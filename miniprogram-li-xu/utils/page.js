const TAB={'home':'pages/home/index','people':'pages/people/index','stats':'pages/stats/index','profile':'pages/profile/index'};
function go(name,query={}){const path=TAB[name]||(['books','book','entry','person'].includes(name)?'pages/'+name+'/index':'');if(!path)return;const url='/'+path+Object.keys(query).map((key,i)=>(i?'&':'?')+encodeURIComponent(key)+'='+encodeURIComponent(query[key])).join('');if(TAB[name])wx.switchTab({url:'/'+path});else wx.navigateTo({url});}
function back(){if(getCurrentPages().length>1)wx.navigateBack();else go('home');}
function error(err){wx.showToast({title:err.message||String(err),icon:'none',duration:2200});}
function tab(page,index){if(page.getTabBar&&page.getTabBar())page.getTabBar().setData({selected:index});}
function formPage(extra){return {...extra,onNavigate(e){go(e.detail.name,e.detail.query||{});},onBack:back};}
module.exports={go,back,error,tab,formPage};
