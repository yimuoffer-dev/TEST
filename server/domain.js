import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
export const STATUSES=['已投递','笔试','AI面','一面','二面','三面','Offer','已拒绝','已签约'];
export const INTERVIEWS=['AI面','一面','二面','三面'];
export const id=()=>randomUUID();
export const day=(date=new Date())=>new Date(new Date(date).getTime()+8*3600000).toISOString().slice(0,10);
export const month=(date)=>day(date).slice(0,7);
export const money=(cents)=> (cents/100).toFixed(2);
export function fail(message,status=400){const e=new Error(message);e.status=status;throw e;}
export const hashPassword=(password,salt=randomBytes(16).toString('hex'))=>`${salt}:${scryptSync(password,salt,64).toString('hex')}`;
export function checkPassword(password,hash){const [salt,value]=hash.split(':');return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(value,'hex'));}
export function publicJobs(db){return db.jobs.filter(j=>j.published&&!j.deleted&&!j.hidden);}
export function canApply(j,now=new Date()){return (!j.start||new Date(j.start)<=now)&&(!j.deadline||new Date(j.deadline)>=now);}
export function publicationLabel(j,now=new Date()){const diff=Math.round((Date.parse(day(now))-Date.parse(day(j.uploadedAt)))/86400000);return diff===0?'今日发布':diff===1?'昨日发布':`${Math.max(diff,0)}天前发布`;}
export function matches(j,q={},now=new Date()){
 const has=(key,actual)=>!q[key]?.length||q[key].some(v=>actual.includes(v));
 const degreeOptions=j.degree.includes('本科')?['本科','硕士','博士']:j.degree.includes('硕士')?['硕士','博士']:[j.degree];
 if(!has('natures',[j.nature])||!has('degrees',degreeOptions)||!has('batches',[j.batch])||!has('types',[j.type])||!has('industries',[j.industry]))return false;
 if(q.cities?.length&&!q.cities.some(c=>j.cities.some(a=>a.includes(c))))return false;
 if(q.majors?.length&&!q.majors.some(m=>j.majors.some(v=>v.includes(m)||v.includes(m==='计算机'?'软件工程':m))))return false;
 const text=[j.company,j.title,...j.positions,...j.cities].join(' ');
 if(q.search&&!text.toLowerCase().includes(q.search.trim().toLowerCase()))return false;
 const age=new Date(now)-new Date(j.uploadedAt);
 if((q.scope==='latest'&&!(age>=0&&age<=72*3600000))||(q.scope==='new24'&&!(age>=0&&age<=24*3600000)))return false;
 if(q.scope==='recommended'&&(!j.recommended||(j.recommendUntil&&new Date(j.recommendUntil)<now)))return false;
 if(q.scope==='open'&&!canApply(j,now))return false;
 if(q.scope==='closing'&&(!canApply(j,now)||!j.deadline||new Date(j.deadline)-now> (q.windowDays||7)*86400000))return false;
 if(q.date&&day(q.mode==='closing'?j.deadline||'1970-01-01':j.uploadedAt)!==q.date)return false;
 return true;
}
export function queryJobs(db,q={},now=new Date()){
 const resolved={windowDays:db.config.closingDays,...q};if(q.cities?.length)resolved.cities=q.cities.flatMap(c=>db.config.locations?.[c]||[c]);if(q.majors?.length)resolved.majors=q.majors.flatMap(m=>db.config.majorAliases?.[m]||[m]);const jobs=publicJobs(db).filter(j=>matches(j,resolved,now));
 return jobs.sort((a,b)=>q.scope==='hot'?b.views-a.views||new Date(b.uploadedAt)-new Date(a.uploadedAt):q.scope==='closing'?new Date(a.deadline)-new Date(b.deadline):q.scope==='recommended'?a.recommendOrder-b.recommendOrder:new Date(b.uploadedAt)-new Date(a.uploadedAt));
}
export function statistics(db,now=new Date()){return {total:publicJobs(db).length,new24:queryJobs(db,{scope:'new24'},now).length,open:queryJobs(db,{scope:'open'},now).length,closing:queryJobs(db,{scope:'closing'},now).length};}
export function syncMessages(db,date=day(),now=new Date()){
 for(const mode of ['new','closing']){const count=queryJobs(db,{date,mode},now).length;let m=db.messages.find(m=>m.date===date&&m.mode===mode);if(!m&&count){m={id:id(),date,mode,count};db.messages.push(m);}if(m)m.count=count;}
}
export function entitlement(db,user,now=new Date()){
 const sources=db.rights.filter(r=>r.userId===user?.id&&!r.revoked);
 if(sources.some(r=>r.type==='senior'))return {type:'senior',label:'高级合伙人',permanent:true,expires:null};
 if(sources.some(r=>r.type==='partner'))return {type:'partner',label:'职场合伙人',permanent:true,expires:null};
 const vip=sources.filter(r=>r.type==='vip').sort((a,b)=>new Date(a.at)-new Date(b.at));let expiry=0;
 for(const r of vip)expiry=Math.max(expiry,new Date(r.at).getTime())+r.days*86400000;
 return expiry>new Date(now).getTime()?{type:'vip',label:'VIP会员',expires:new Date(expiry).toISOString(),permanent:false}:{type:'normal',label:'普通用户',expires:null,permanent:false};
}
export const privileged=(db,user)=>user&&entitlement(db,user).type!=='normal';
export const partner=(db,user)=>['partner','senior'].includes(entitlement(db,user).type);
export const distributor=(db,user)=>user&&(user.distributor||partner(db,user));
export function serializeJob(db,j,user){const out={...j,status:canApply(j)?'投递中':j.start&&new Date(j.start)>new Date()?'未开始':'已截止',publication:publicationLabel(j)};if(!privileged(db,user)){delete out.sourceUrl;delete out.applyUrl;}return out;}
export function bindReferral(db,user,referrerId){if(!referrerId||user.referrerId)return;const ref=db.users.find(u=>u.id===referrerId);if(!ref)fail('推荐人不存在');let cursor=ref;const seen=new Set();while(cursor){if(cursor.id===user.id||seen.has(cursor.id))fail('不能自荐或形成循环推荐');seen.add(cursor.id);cursor=db.users.find(u=>u.id===cursor.referrerId);}user.referrerId=ref.id;user.referralAt=new Date().toISOString();}
export function visit(db,sharerId,visitorId){if(sharerId===visitorId)return;const sharer=db.users.find(u=>u.id===sharerId);if(!sharer)return; if(!db.visits.some(v=>v.sharerId===sharerId&&v.visitorId===visitorId))db.visits.push({sharerId,visitorId,at:new Date().toISOString()});if(sharer.referrerId&&!sharer.teamAt&&db.visits.filter(v=>v.sharerId===sharerId).length>=5)sharer.teamAt=new Date().toISOString();}
export function wallet(db,userId){const rows=db.ledger.filter(l=>l.userId===userId);const total=rows.filter(l=>l.kind==='commission').reduce((n,l)=>n+l.cents,0);const adjustments=rows.filter(l=>l.kind==='reversal').reduce((n,l)=>n+l.cents,0);const withdrawals=db.withdrawals.filter(w=>w.userId===userId);const pending=withdrawals.filter(w=>['待审核','待打款'].includes(w.status)).reduce((n,w)=>n+w.cents,0);const paid=withdrawals.filter(w=>w.status==='已打款').reduce((n,w)=>n+w.cents,0);const raw=total+adjustments-paid-pending;return {available:Math.max(0,raw),recovery:Math.max(0,-raw),pending,paid,total,net:total+adjustments};}
export function commission(db,order,recipient,kind,rate){const cents=Math.round(order.cents*rate/100);if(cents)db.ledger.push({id:id(),userId:recipient.id,orderId:order.id,kind:'commission',channel:kind,cents,rate,ruleVersion:db.config.ruleVersion,at:new Date().toISOString()});}
export function settleOrder(db,order){if(order.status==='paid')return order;if(order.status!=='pending')fail('订单状态不可支付');const user=db.users.find(u=>u.id===order.userId);order.renewal=db.orders.some(o=>o.id!==order.id&&o.userId===user.id&&o.type===order.type&&o.status==='paid');order.status='paid';order.paidAt=new Date().toISOString();order.ruleVersion=db.config.ruleVersion;order.referrerId=user.referrerId||null;order.commissionSnapshot=[];db.rights.push({id:id(),userId:user.id,type:order.type,days:order.days,at:order.paidAt,source:'购买',orderId:order.id});const ref=db.users.find(u=>u.id===user.referrerId);if(ref&&distributor(db,ref)){const tier=entitlement(db,ref).type;const rules=db.config.commissionRules||[];const rule=rules.find(r=>r.type===order.type&&r.tier===tier&&r.renewal===order.renewal);const rate=rule?.direct??db.config.rates[tier]?.direct??db.config.rates.normal.direct;order.commissionSnapshot.push({userId:ref.id,tier,channel:'直接',rate});commission(db,order,ref,'直接',rate);if(ref.teamAt){const parent=db.users.find(u=>u.id===ref.referrerId);if(parent&&partner(db,parent)){const parentTier=entitlement(db,parent).type;const teamRule=rules.find(r=>r.type===order.type&&r.tier===parentTier&&r.renewal===order.renewal);const teamRate=teamRule?.team??db.config.rates[parentTier].team;order.commissionSnapshot.push({userId:parent.id,tier:parentTier,channel:'团队',rate:teamRate});commission(db,order,parent,'团队',teamRate);}}}return order;}
export function refundOrder(db,order,reason){if(order.status==='refunded')return;if(order.status!=='paid')fail('仅已支付订单可退款');if(!reason?.trim())fail('请填写退款原因');order.status='refunded';order.refundReason=reason;order.refundAt=new Date().toISOString();db.rights.filter(r=>r.orderId===order.id).forEach(r=>r.revoked=true);for(const l of db.ledger.filter(l=>l.orderId===order.id&&l.kind==='commission')){for(const w of db.withdrawals.filter(w=>w.userId===l.userId&&['待审核','待打款'].includes(w.status))){w.status='已关闭';w.reason='订单退款，佣金冲回';}db.ledger.push({id:id(),userId:l.userId,orderId:order.id,kind:'reversal',channel:l.channel,cents:-l.cents,at:new Date().toISOString(),reason});}}
export function createWithdrawal(db,user,data){if(!distributor(db,user))fail('请先开通分销资格',403);const cents=Number(data.cents);const w=wallet(db,user.id);if(w.recovery)fail('待追回佣金未结清，暂不可提现');if(!Number.isSafeInteger(cents)||cents<5000||cents>w.available)fail('提现金额至少50元且不能超过余额');if(!['微信','支付宝'].includes(data.method)||!data.name?.trim()||!data.image?.startsWith('data:image/'))fail('请填写收款方式、姓名并上传收款码');const result={id:id(),userId:user.id,cents,method:data.method,name:data.name.trim(),image:data.image,status:'待审核',at:new Date().toISOString()};db.withdrawals.push(result);return result;}
export function changeWithdrawal(db,w,action,reason='',admin=false){const states={cancel:['待审核','已撤销'],approve:['待审核','待打款'],reject:['待审核','已驳回'],pay:['待打款','已打款']};const pair=states[action];if(!pair||w.status!==pair[0])fail('提现状态已变化，请刷新');if(action!=='cancel'&&!admin)fail('需要超级管理员权限',403);if(['reject','pay'].includes(action)&&!reason.trim())fail(action==='pay'?'请填写流水号或凭证':'请填写驳回原因');w.status=pair[1];w.reason=reason;w.updatedAt=new Date().toISOString();return w;}
export function quotas(db,user,now=new Date()){const current=month(now);return db.config.giftQuotas.map(q=>({...q,used:db.gifts.filter(g=>g.ownerId===user.id&&g.type===q.type&&g.generatedMonth===current&&!g.returned).length}));}
export function expireGifts(db,now=new Date()){for(const g of db.gifts)if(g.status==='待领取'&&new Date(g.expires)<now){g.status='已过期';g.returned=true;}}
export function generateGift(db,user,data,now=new Date()){expireGifts(db,now);if(entitlement(db,user).type!=='senior')fail('仅高级合伙人可赠送',403);const quota=quotas(db,user,now).find(q=>q.type===data.type);if(!quota)fail('不可赠送该权益');if(quota.used>=quota.limit)fail('本月额度已用完');const validDays=Number(data.validDays);if(!Number.isInteger(validDays)||validDays<1||validDays>db.config.giftMaxDays)fail('领取期限超出范围');const g={id:id(),code:randomBytes(5).toString('hex').toUpperCase(),ownerId:user.id,type:quota.type,days:quota.days,generatedMonth:month(now),at:new Date(now).toISOString(),expires:new Date(new Date(now).getTime()+validDays*86400000).toISOString(),status:'待领取',returned:false};db.gifts.push(g);return g;}
export function redeemGift(db,user,code,now=new Date()){expireGifts(db,now);const g=db.gifts.find(g=>g.code===code?.trim().toUpperCase());if(!g||g.status!=='待领取')fail('兑换码不存在、已领取或已失效');if(partner(db,user))fail('已拥有永久权益，不核销此凭证');bindReferral(db,user,g.ownerId);g.status='已领取';g.receiverId=user.id;g.claimedAt=new Date(now).toISOString();db.rights.push({id:id(),userId:user.id,type:g.type,days:g.days,at:g.claimedAt,source:'赠送兑换',giftId:g.id});return g;}
export function revokeGiftPermission(db,user){db.rights.filter(r=>r.userId===user.id&&r.type==='senior'&&!r.revoked).forEach(r=>r.revoked=true);for(const g of db.gifts.filter(g=>g.ownerId===user.id&&g.status==='待领取')){g.status='已作废';g.returned=true;g.reason='赠送权限已取消';}}
export function saveRecord(db,user,data,recordId){if(!data.company?.trim()||!data.position?.trim()||!STATUSES.includes(data.status)||!/^\d{4}-\d{2}-\d{2}$/.test(data.date||''))fail('请填写单位、岗位、状态及有效日期');if(!Number.isFinite(Date.parse(data.date))||day(data.date+'T00:00:00+08:00')!==data.date)fail('日期无效');let r=recordId?db.records.find(r=>r.id===recordId&&r.userId===user.id):data.jobId?db.records.find(r=>r.userId===user.id&&r.jobId===data.jobId&&r.position===data.position.trim()):null;if(recordId&&!r)fail('记录不存在',404);if(!r){r={id:id(),userId:user.id,jobId:data.jobId||null,initialDate:data.date,history:[]};db.records.push(r);}for(const key of ['company','position','status','notes','referralCode','referralUrl','applyUrl','sourceUrl'])r[key]=String(data[key]||'').trim();r.history.push({id:id(),status:data.status,date:data.date,notes:data.notes||'',at:new Date().toISOString()});return r;}
