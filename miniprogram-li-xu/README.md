# 礼序 · 原生微信小程序

开发文档：仓库 `docs/LI-XU-MINIPROGRAM-DEVELOPMENT.md`。项目为原生 WXML/WXSS/JavaScript，与既有校园招聘应用独立，不依赖其后端和 npm 运行时。

## 微信开发者工具导入

1. 下载仓库，在微信开发者工具“导入项目”中选择 **miniprogram-li-xu** 目录，不要选择仓库根目录。
2. `project.config.json` 的 `touristappid` 仅用于导入 UI 演示。关联真实小程序或发布时填写你自己的 AppID；不要使用原校招项目的 AppID 代替。
3. 选择 WebView 渲染器，工程默认基础库 3.7.0。点击“编译”。本项目无需 npm 构建，也没有服务器启动步骤。
4. 首页面为礼序，底部依次为礼簿、往来、统计、我的。可从首页/我的创建礼簿，从详情记一笔，人物详情可预填记账姓名。
5. 云端未运行微信开发者工具，若编译报错应按工具真实输出修正；不能将本地源码检查当作微信编译通过。

## 当前功能

八页原生界面、九个共享组件、自定义导航、搜索/组合筛选、原始素材映射、六款封面、创建礼簿、收送礼/关系切换、两位小数数字键盘、保存/保存继续、本地持久化、人物时间线、参考统计及按年记录汇总、用户点击触发的 JSON 文件分享。

2026 年统计 128600/96300/412 为 HTML 参考汇总，不是五人节选数据的加总。新增记录反映到本机计数和月度数据；其他年份按已知记录汇总。账户、会员、家庭共享、云备份和真实微信提醒不在此 UI 演示中虚构接入。

页面背景及封面使用本地 WebP，主包按排除开发文件后的运行文件清单检查，保守阈值 2 MiB。图片原始文件在仓库 `ui-reference/li-xu/assets/`，小程序只带显示用压缩衍生资源。

## 字体与视觉验收

`config.js` 的 `fontUrl` 默认留空。配置真实且可用的 HTTPS 字体地址，并在微信后台设置合法域名后，`wx.loadFontFace` 才会加载全局 `LixuSerif`。不应关闭域名校验来代替正式配置。未配置时使用系统衬线字体，iOS/Android 字形可能不同。

系统状态栏/胶囊/安全区使用真实微信环境尺寸，不显示假的 10:24、电池或 Wi-Fi。参考的像素坐标转换为 rpx；对比正文时应扣除真实状态栏高度差。

WXSS 对复杂转角描边采用细线圆角近似。图表由 Pillow 生成透明 PNG，保留参考颜色/比例/文字。以上与字体均需在微信端截图中进一步核对。当前状态和验收步骤见 `VALIDATION.md`，尚未完成真机像素级验收。

## 本地验证与重建

在仓库根目录运行：

```bash
node --test miniprogram-li-xu/tests/*.test.cjs
python3 miniprogram-li-xu/scripts/validate.py
```

资源重建需要 Pillow；图表脚本使用云环境已安装的 Noto Serif CJK 字体路径，可以修改该脚本中的字体路径适配本机：

```bash
python3 miniprogram-li-xu/scripts/prepare-assets.py
python3 miniprogram-li-xu/scripts/render-charts.py
python3 miniprogram-li-xu/scripts/build-styles.py
```

`styles/design.wxss` 保存 863px 原参考尺寸；`build-styles.py` 转换为 `styles/reference.wxss`，1px 边线保持物理像素，其余乘 750/863。不要手改生成的 reference.wxss。

`assets/manifest.json` 记录源 PNG SHA-256、输出尺寸和字节。scripts/tests/README/VALIDATION/设计源样式/manifest 按 project.config.json 排除打包。验证程序不是微信编译器，仅检查结构与逻辑。没有外部脚本、HTML 拼接、WebView 嵌入、eval 或隐式联网；可选字体请求和用户主动导出均为显式流程。

原 HTML 的 Defender 检测问题尚未解除。此项目是独立原生源码重建，不包含被拦截 HTML/ZIP，也不把原文件检查结果转移为本项目的杀毒证明。
