# REST 接口与数据字典

接口前缀 `/api`，JSON，认证使用 `Authorization: Bearer <token>`。令牌7天有效，退出注销当前令牌。错误格式 `{ "message": "..." }`；401 登录，403 权限，400 校验，404 不存在，503 未配置真实适配器。服务端不向普通用户返回可复制的受限公告链接。

## 接口

| 路径                         | 方法         | 说明                                                     |
| ---------------------------- | ------------ | -------------------------------------------------------- |
| `/health`                    | GET          | 服务及运行模式                                           |
| `/bootstrap`                 | GET          | 用户、权限、配置、全平台统计、本人记录收藏和余额         |
| `/jobs?q=<JSON>&page=1`      | GET          | 搜索/筛选/专题/统计共用查询，10条分页                    |
| `/jobs/:id`                  | GET          | 详情、每日同用户去重浏览量；收藏/记录关联可回看          |
| `/daily?date=YYYY-MM-DD`     | GET          | 北京时间当日新增、截止数量                               |
| `/messages`                  | GET          | 每日每类唯一提醒与本人已读状态                           |
| `/messages/:id/read`         | POST         | 标记本人已读                                             |
| `/auth/demo`                 | POST         | 仅演示，`{type}` 六身份                                  |
| `/auth/login`                | POST         | `{phone,mode,password/code,referrerId?}`                 |
| `/auth/logout`               | POST         | 注销当前令牌                                             |
| `/profile`                   | PATCH        | 本人昵称、头像、届别、专业、求职状态                     |
| `/account`                   | POST         | 手机/密码/微信设置，身份验证码；真实服务未接入时不可操作 |
| `/favorites`                 | GET          | 本人收藏，全量、不限10条                                 |
| `/favorites/:id`             | POST         | 添加/取消本人收藏                                        |
| `/records`                   | POST         | 新建，关联公告+相同岗位识别追加                          |
| `/records/:id/progress`      | POST         | 以记录ID追加历史                                         |
| `/records/:id`               | PATCH/DELETE | 修改个人基础信息/删除全部历史                            |
| `/orders`                    | GET/POST     | 本人订单/选择后台套餐创建待支付单                        |
| `/orders/:id/pay`            | POST         | **演示支付**，幂等结算权益及佣金，生产禁用               |
| `/rights`                    | GET          | 独立权益来源，购买、后台授权、赠送                       |
| `/distribution/apply`        | POST         | 即时开通分销，不变会员                                   |
| `/referral/visit`            | POST         | 已确认用户去重访问与首次固定推荐                         |
| `/distribution`              | GET          | 余额、收入、客户、团队、订单、提现状态                   |
| `/withdrawals`               | POST         | 提现金额分、方式、姓名、收款码；冻结余额                 |
| `/withdrawals/:id/cancel`    | POST         | 本人仅待审核可撤销                                       |
| `/gifts`                     | GET/POST     | 高级合伙人本人凭证与月额度/生成                          |
| `/gifts/:id/revoke`          | POST         | 作废未领凭证，退原月份额度                               |
| `/redeem`                    | POST         | 单次领取，禁止重复永久权益核销                           |
| `/admin`                     | GET          | 编辑公告；管理员额外返回用户/订单/资金                   |
| `/admin/jobs`                | POST         | 创建/编辑公告，真实创建时间保留                          |
| `/admin/jobs/:id`            | PATCH        | 发布、下架、删除、推荐和业务时间维护                     |
| `/admin/import/template`     | GET          | base64 标准 `.xlsx` 模板                                 |
| `/admin/import/preview`      | POST         | `{format:'xlsx',file:<base64>}` 或 `{format:'csv',text}` |
| `/admin/import`              | POST         | `{items:[...]}`，全量校验后原子保存草稿                  |
| `/admin/topics`              | PATCH        | 编辑及管理员专题维护                                     |
| `/admin/config`              | PATCH        | 仅管理员维护字典、套餐、佣金/赠送和服务内容              |
| `/admin/orders/:id/refund`   | POST         | **演示退款**，撤单一来源并冲回佣金，生产禁用             |
| `/admin/withdrawals/:id`     | POST         | `approve/reject/pay`，驳回原因、打款流水必填             |
| `/admin/users/:id/authorize` | POST         | 授权VIP/职场/高级；取消高级权限作废未领凭证              |

## 数据字典

| 对象     | 关键字段                                                                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 公告     | id, company, title, logo, nature, industry, degree, batch, type, cities[], start?, deadline?, uploadedAt, createdAt, published, hidden, deleted, recommended, recommendOrder, recommendUntil?, views, positions[], majors[], intro, introImages[], sourceUrl?, applyUrl? |
| 查询     | scope: latest/recommended/closing/hot/new24/open; search; natures/degrees/batches/types/cities/majors/industries 数组；日报 date/mode                                                                                                                                    |
| 用户     | id, phone, nickname, avatar（首字或图片）, batch, major, seeking, role:user/editor/admin, distributor, referrerId, referralAt, teamAt                                                                                                                                    |
| 投递记录 | id, userId, jobId?, company, position, status, initialDate, notes, referralCode/referralUrl/applyUrl/sourceUrl, history[]                                                                                                                                                |
| 历史     | id, status, date（用户进展日）, at（真实创建时间）, notes                                                                                                                                                                                                                |
| 权益     | id, userId, type:vip/partner/senior, days, at, source, orderId/giftId, revoked                                                                                                                                                                                           |
| 订单     | id, userId, type, title, cents, days, status:pending/paid/refunded, paidAt/refundAt, renewal, ruleVersion, referrerId, commissionSnapshot[]                                                                                                                              |
| 账本     | id, userId, orderId, kind:commission/reversal, channel:直接/团队, cents, rate, ruleVersion, at, reason?                                                                                                                                                                  |
| 提现     | id, userId, cents, method:微信/支付宝, name, image, status:待审核/待打款/已打款/已驳回/已撤销/已关闭, at, updatedAt, reason                                                                                                                                              |
| 凭证     | id, ownerId, code, type:vip/partner, days, generatedMonth, at, expires, status:待领取/已领取/已作废/已过期, returned, receiverId?, claimedAt?                                                                                                                            |
| 配置     | topics[], dictionaries, locations, majorAliases, closingDays, packages[], rates, commissionRules[], ruleVersion, giftQuotas[], giftMaxDays, help[]                                                                                                                       |

金额统一安全整数分；界面固定两位小数。时间持久化 ISO，展示北京时间。佣金规则可按 type/tier/renewal 分别配置，缺省用各身份 rates；支付时保存快照。数据库单事务存储 JSON 状态，所有修改同步原子提交。异常回滚内存状态并拒绝持久化半成品；真实支付回调需另行接入验签和网络重试层。
