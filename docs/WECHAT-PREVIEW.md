# 微信小程序预览与服务器文件的区别

2026-10-15：微信 AppID 已配置为 wx2249679a29811468，生产 API 基址为 https://test.offerxingqiu.cn。

## 直接使用预编译包

下载仓库 artifacts/wechat-preview.zip，解压后将 dist/build/mp-weixin 导入微信开发者工具。该目录内 project.config.json 已包含 AppID，编译代码已包含生产 API 地址，域名校验保持开启。使用有该小程序开发权限的微信登录。

微信公众平台「开发管理 → 开发设置 → 服务器域名」添加 request 合法域名 https://test.offerxingqiu.cn。然后在开发者工具中编译、预览、上传；线上发布仍需平台审核。

## 修改源码

src/manifest.json 的 mp-weixin.appid 设置微信 AppID；.env.production 的 VITE_API_BASE 设置生产 API 基址。该文件仅包含公开服务地址，没有密码。

在电脑上的源码目录执行 npm ci，再执行 npm run build:mp-weixin。不要在正在运行后端的目录中重新安装构建依赖；服务器构建请使用独立副本。

宝塔里修改 src 并不会自动更新微信小程序，仍需重新构建，把生成目录下载到电脑后由微信开发者工具上传。修改 src 也不会自动更新服务器上的 H5 发行文件，H5 需要 npm run build 后更新 dist/build/h5。

后端当前已通过用户截图确认 production 健康检查；真实微信登录、短信和支付适配仍未实现，AppID/API 配置不会自动实现这些服务。生产库不含演示账号和公告，可用已创建管理员账号登录维护。
