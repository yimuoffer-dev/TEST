# 校招指南 · 校招信息管理小程序

本次前端改动与验证边界见 [前端交付说明](docs/FRONTEND-DELIVERY.md) 和 [交互测试清单](docs/INTERACTION-CHECKLIST.md)。以这两份文件和本次测试输出为准，历史交付截图保留在 artifacts/screens，最新截图在 artifacts/delivery。

依据 PRD V2.1、UI 规范 V1.0 与六页组合参考开发。UniApp Vue 3 + Pinia + Vite 前端，Node REST API，SQLite 持久化。包含 H5 和微信小程序构建、管理后台、真实 Excel 导入及自动化测试。

## 快速运行

需要 Node 22.13+（本项目验证版本 Node 24）、npm。

```bash
cd /workspace/TEST
npm ci
npm run server   # REST 服务 3001，自动初始化演示 SQLite
```

另一个终端运行：

```bash
cd /workspace/TEST
npm run dev      # H5 开发服务 5173，通过 Vite 代理 API
```

网页默认游客首页。点击招聘、筛选或个人菜单按需登录；登录面板 → 选择演示身份可切换普通、VIP、职场/高级合伙人、招聘编辑和超级管理员。演示密码登录账号见下表，密码统一 `Demo12345!`（仅存在于演示数据库）。点击个人中心的“切换演示身份”也可切换；编辑及管理员个人中心有管理后台入口。

| 身份       | 演示手机号  |
| ---------- | ----------- |
| 高级合伙人 | 13800138000 |
| 普通用户   | 13800138001 |
| VIP        | 13800138002 |
| 职场合伙人 | 13800138003 |
| 招聘编辑   | 13800138998 |
| 超级管理员 | 13800138999 |

短信/微信登录、会员支付和退款在演示模式模拟，界面明确标注；不会发送真实短信或扣款。示例公告、账户与可提资金为测试数据。验证码为 `123456`。

## 构建与验证

```bash
npm test                   # REST、财务、权限、时间、赠送、Excel、持久化
npm run test:e2e           # Chromium 浏览器完整流程和五种宽度；启动独立内存 API
npm run build              # dist/build/h5
npm run build:mp-weixin    # dist/build/mp-weixin
```

浏览器测试默认使用 `/usr/bin/chromium`；其他系统设置 `CHROMIUM_PATH` 为已安装 Chromium 路径。测试专用端口 3101/5175，不修改开发 SQLite。`playwright-report` 为当前测试报告，`artifacts` 保存页面截图与构建交付包。PNG 图标可通过 `node scripts/render-icons.mjs` 重建。

微信：在微信开发者工具中导入 `dist/build/mp-weixin`，在 `src/manifest.json` 填写你自己的 AppID；用合法 HTTPS 后端域名设置 `VITE_API_BASE` 后重新构建，并在微信平台配置 request/图片业务域名。本仓库未使用虚构 AppID，也未关闭域名校验。

H5 构建后 `npm run server` 同时托管 `dist/build/h5` 静态文件。开发服务通过 `API_PROXY` 指定代理目标；微信端通过构建环境变量 `VITE_API_BASE` 指定 API 基址。

## 代码与文档

- `src/pages`：27 个 UniApp 路由入口，四主导航状态在 Pinia 中保留。
- `src/components`：页面结构、公共卡片、图标、头像、筛选/进展/登录/权限弹窗。
- `src/stores/campus.js`：请求、权限、路由、分页、登录/支付后恢复操作与状态。
- `server/domain.js`：北京时间查询、权益来源、佣金分账、赠送额度、提现及退款。
- `server/app.js`：认证、REST 接口、角色检查、原子事务保存。
- `server/imports.js`：真实 `.xlsx` 模板和 CSV 解析、全量校验、草稿导入。
- `docs/REQUIREMENTS.md`：功能、流程、视觉和验收梳理。
- `docs/API.md`：接口与数据字典。
- `docs/DELIVERY.md`：验证结果、视觉对照与真实接入清单。

## 数据与部署边界

演示数据位于 `.data/campus.sqlite`，由 SQLite WAL 和同步事务保存。小规模单进程服务适用，支付/权益/赠送/提现修改同一事务原子落盘；多实例大规模生产应迁移到 PostgreSQL 表结构与行锁/幂等键，再执行并发和压力验收。

`DATA_DIR` 可指定独立数据目录；备份要通过 SQLite backup 或一致性快照处理 WAL，不应只在运行中复制主文件。不要把演示数据库部署为真实资金系统。

`APP_MODE=production` 禁用所有演示登录、模拟支付、退款、短信验证。空生产库初始化必须安全设置 `ADMIN_PHONE`、`ADMIN_PASSWORD`（至少12位），不得在聊天或版本库中保存密码；生产库不含演示用户、公告、套餐或资金。服务器拒绝将演示库切换为生产库。此开关不代表真实支付/短信适配已接入。

真实上线尚需小程序 AppID、微信登录和绑定、短信服务、微信商户支付/退款回调验签及外链业务域名接入。合伙人资格与后台权限独立。演示推广海报为可下载图文海报，真实微信小程序码需微信服务端接入。Android/iOS 真机、提审、压力/弱网和首屏1.5秒目标需实际验收环境验证。
