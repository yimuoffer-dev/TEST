# 礼序微信小程序开发文档

版本：1.0 · 2026-11-07 · 文档先行，随后实施。

## 1. 目标、基线和边界

将 `ui-reference/li-xu/礼序-完整复刻.html` 的八屏界面重建为可导入微信开发者工具的原生微信小程序，保留纸张、梅枝、水墨背景、礼簿封面、花卉徽章、颜色、文字层级、布局、按钮、筛选与记录流程。参考入口对应的可审查分离源码为 `index.html`、`app.js`、`style.css`、`calibration.css`，原图在同目录 `assets/`。

参考优先级：指定完整 HTML > 其当前分离源码和截图 > 最初八张设计图。后续提供的封面、图标与最初截图存在版本差异，以实际 HTML 使用的版本为准，不把素材差异伪称为布局误差。

“像素级高保真”作为逐屏验收目标，而非未经验证的结果声明。基准尺寸是 863 × 1822；页面内容、元素坐标和画布比例需可追溯。真实微信状态栏、右上胶囊、系统安全区与字体渲染不能用网页截图冒充。云环境只有 Chromium，没有微信开发者工具/真机，因此云端能验证源码、数据、资源与样式转换，微信渲染和真机像素差分仍是独立验收阶段。

当前 HTML 曾被用户的 Defender 检测为 `Trojan:Script/Wacatac.B!ml`，尚未解除。只静态读取文档/源码，不执行内嵌 HTML，不复制 Base64 资源大字典、HTML 拼接器、动态代码或自动下载逻辑。使用独立原始图片和重新实现的数据/交互。

## 2. 核心技术决策

| 项目 | 确定方案 | 原因 |
|---|---|---|
| 小程序技术栈 | 微信原生 WXML + WXSS + JavaScript | 控制原生结构与样式，避免 UniApp 转译带来的选择器、组件和单位差异 |
| 渲染器 | WebView，基础库建议 ≥ 3.0.0 | 当前字体与样式以稳定 WebView 能力为基线；不同时维护 Skyline |
| 状态与持久化 | 页面 `data/setData` + 独立 store + `wx.getStorageSync/setStorageSync` | 小规模八页应用不引入全局框架；验证输入与存储数据 |
| 导航 | 四项自定义 tabBar + `switchTab`；详情页 `navigateTo/navigateBack` | 真正页面路由和返回栈，不用单页 hash 模拟 |
| 布局单位 | `rpx`；运行时安全区用 `px` | 参考 px × 750/863 转换，保留小数，系统尺寸不重复换算 |
| 图表 | 本地生成的透明 PNG 图表，数据列表为原生 WXML | 微信 WXSS 不保证 `conic-gradient` 与网页一致；避免引入第三方图表包；后续接真实统计时通过绘制器更新图片 |
| 字体 | 系统宋体回退；可配置 HTTPS `wx.loadFontFace` | 不假设本地 CSS `@font-face` 在微信端有效，外部字体地址必须真实且配置合法域名 |
| 依赖 | 小程序运行时零 npm 依赖 | 不把原仓库 Node/Express/SQLite 带入客户端 |
| 测试 | Node 内置测试器 + 资源/路由/WXML 配对/体积检查 | 无外部测试依赖，可离线运行；与微信实际编译分开报告 |
| 数据服务 | 第一阶段本地演示，保留 service/store 接口 | 原参考不是完整后端产品，不虚构账户、云同步、付款和隐私承诺 |

新代码放入 `miniprogram-li-xu/`，不替换原校园招聘 UniApp 的 `src/`、`server/`、manifest 或依赖锁文件。微信开发者工具直接导入新目录；不需要执行旧项目构建。

## 3. 项目结构

```text
miniprogram-li-xu/
  app.js / app.json / app.wxss
  project.config.json        # 使用 touristappid 仅供导入预览，发布需真实 AppID
  sitemap.json
  config.js                  # 字体地址等公开配置，不放凭据
  custom-tab-bar/            # 礼簿、往来、统计、我的
  pages/
    home/                    # 礼序首页
    books/                   # 全部礼簿 + 类型/年份/关键字筛选
    book/                    # 礼簿详情与记账列表
    entry/                   # 收/送礼记账、自定义数字键盘
    people/                  # 往来列表与分组
    person/                  # 亲友资料、收送礼时间线
    stats/                   # 年度统计、柱状图、环形图和排名
    profile/                 # 个人信息、服务入口
  components/
    page-header/             # 状态区占位、标题、返回/设置，不伪造系统时间
    ui-icon/                 # 原始图标映射与选中态
    flower-badge/            # 直接使用花卉 PNG 徽章
    book-cover/              # 封面裁切槽位、透明边缘归一
    section-title/           # 朱红竖线、标题、云纹/查看全部
    segment-tabs/            # 全部/收礼/送礼等互斥选择
    action-button/           # 朱红描金主操作
  assets/                    # 本地资源；原始文件仍留在 ui-reference
  data/seed.js               # 参考数据，无凭据
  services/store.js          # 校验、持久化、筛选、增加礼簿/记录、统计聚合
  utils/page.js              # 导航、toast、状态栏尺寸
  styles/tokens.wxss         # 提取的设计变量（落地为字面值与类）
  styles/reference.wxss      # 可支持的 HTML 样式转换
  scripts/                   # 资源预处理与审计；不在运行时执行
  tests/                     # 数据、路由、包体、引用和模板结构测试
  README.md                  # 导入、验证与发布前配置步骤
```

每页使用同名 `.js/.json/.wxml/.wxss` 四件套。组件通过 `app.json.usingComponents` 注册，不让业务层依赖 DOM。重复列表由页面数据驱动，组件只负责呈现与事件抛出。

## 4. 页面与组件职责

| 页面 | UI 内容 | 主要状态 | 事件/目标 |
|---|---|---|---|
| home | 品牌头、搜索、两本礼簿、新开礼簿、近日往来 | 最近礼簿、最近记录、keyword | 查看全部→books；封面→book；往来→person |
| books | 搜索、类型与年份、年份标题、四类封面、创建 | keyword/type/year | 筛选；详情；新建弹层 |
| book | 大封面、主题/日期/主家/汇总、明细、记一笔 | id/tab/rows | 明细→person；记账→entry |
| entry | 紧凑封面、收送切换、姓名/关系/金额/礼品/备注、键盘 | bookId/personId/direction/form | 保存回详情；保存继续清空表单 |
| people | 搜索、三个计数、四组 tab、亲友卡片 | keyword/group | 关系筛选；人物详情 |
| person | 人物卡、累计收送、三组 tab、时间线、备注 | id/direction | 收送筛选；新增往来→entry 并预填姓名 |
| stats | 年份、三汇总卡、柱状/环形图、前五 | year/aggregates | 切年展示对应数据，不只更换标题；人物排名→详情 |
| profile | 姓名/徽章/典藏标识、计数、八项服务 | counters/modal | 新建、导出、亲友管理；其他入口明确展示演示边界 |

## 5. HTML → WXML 映射

| 原 HTML/浏览器能力 | 小程序实现 |
|---|---|
| div/main/section/header/nav | view 与自定义组件；标题用 text |
| span/p/h1/h2 | text + 明确字体、行高、块级类，重置默认差异 |
| button + click | button + bindtap；重置 `button::after` 默认边框、padding、line-height |
| img + object-fit | image + mode（aspectFit/scaleToFill）；原封面槽位使用 scaleToFill 和同等裁切比例 |
| svg/use 图标 | 图片素材；不在 WXML 中内联 SVG 或引用网页 symbol |
| input / textarea | 原生 input / textarea + bindinput；金额使用自定义键盘，不唤起系统数字键盘 |
| select | picker；显示当前标签与下箭头，不依赖浏览器原生选择器 |
| dialog | page 级遮罩 view、catchtap 与表单；简单说明用 wx.showModal |
| map/join/三元模板字符串 | data 中预计算，WXML 使用 wx:for/wx:key/wx:if；不运行任意 JS |
| DOM 查找/classList/innerHTML | setData 与 class 条件绑定；text 自动转义，无 HTML 注入 |
| hash 路由 | app.json 页面路由 + query id；所有 id 经 store 校验 |
| localStorage | store 封装微信同步存储；损坏数据回退到种子数据 |
| Blob/临时 a 下载 | wx.env.USER_DATA_PATH + FileSystemManager.writeFile + 可用时 wx.shareFileMessage，由用户点击触发 |
| window.resize/zoom | rpx 宽度自适应，不缩放整个文档 |
| browser alert/toast | wx.showToast / wx.showModal |

页面路径/资源名只从常量映射中取值；本地存储数据不拼接 WXML，不动态执行。没有外部脚本、web-view、eval、Function 或隐式网络请求。

## 6. WXSS 映射及兼容方案

1. 读取 style.css + calibration.css 的最终覆盖顺序，保留参考选择器与模块对应关系，不能只提取首个声明。
2. 所有设计 px 数字乘 `750/863 ≈ 0.8690614148`；例如 34→29.55rpx、38→33.02rpx、96→83.43rpx。border 的 1px 保持物理像素线宽，避免亚像素抖动。
3. 颜色变量展开为字面值。组件启用 `styleIsolation: apply-shared`，允许 app.wxss 统一风格；组件内部不覆盖业务状态。
4. flex、定位、圆角、背景、opacity、box-shadow、transition 转换为支持的等价声明。gap 改相邻 margin；不依赖 grid、:has、mask-composite、border-image SVG、filter、伪元素中的 SVG 与 CSS 数据 URL。
5. 纸张、淡山水和梅枝在构建期由原背景图生成轻量位图；运行时 image 绝对定位、pointer-events:none。复杂转角边框由构建期 PNG 9-slice/覆盖边框实现；简化为统一细线圆角的版本必须在验收记录中标明。
6. 页脚使用自定义 tabBar 固定定位，增加 `env(safe-area-inset-bottom)`；内容有同等底部留白。详情也呈现同款底部导航，由统一导航组件处理。
7. 取消原网页假状态栏（10:24、Wi-Fi、电池）；通过系统状态栏高度留白，保留微信胶囊区域。标题栏在胶囊下方，返回点按范围 ≥ 44px，不能与胶囊重叠。
8. 动效仅包含约 150–200ms 的按压透明度、按钮反馈、提示、弹层淡入；原参考没有页面转场动画，不新增大幅滑动、弹跳、粒子或复杂加载动效。

## 7. 设计规范提取

提取来源：CSS 变量、最终有效声明、页面 DOM 坐标、资源尺寸、参考文案。以下是确定基准，开发转换后写入 tokens 与样式清单。

| Token | 基准值 | 用途 |
|---|---|---|
| paper | #f6ecdf / 校准遮罩 #f7eee3 | 页面宣纸底色 |
| ink | #28261f | 标题/正文 |
| vermilion | #a43e29 | 金额、强调线、选中态 |
| gold | #b78d51 | 描边、分隔、次级装饰 |
| line | #d5bfa2 | 行分隔 |
| secondary | #746d60 / #8e887c | 时间/占位文案 |
| heading | 38px → 33.02rpx，600 | 模块标题 |
| page title | 43px → 37.37rpx，600 | 页面导航标题 |
| row name | 34px → 29.55rpx，600 | 人名/主文案 |
| body | 24–28px → 20.86–24.33rpx | 描述与正文 |
| money | 39–49px → 33.89–42.58rpx | 金额数字，Georgia/宋体回退 |
| entry money | 80px → 69.52rpx | 礼金输入 |
| page horizontal inset | 34px → 29.55rpx | 通用横向边距 |
| column gap | 36px → 31.29rpx | 首页双封面 |
| radius | 16–23px → 13.90–19.99rpx | 卡片边角 |
| row separator | 1px | 分隔线 |
| main action | 96px → 83.43rpx | 主按钮高度 |
| bottom nav | 141px → 122.54rpx + 安全区 | 固定底栏 |

字体：参考包只带页面使用字形的 129KB WOFF 子集。客户端不同字体会产生可见误差。小程序运行时通过 `config.fontUrl` 配置真实 HTTPS 字体 URL 并执行 `wx.loadFontFace({global:true})`；未配置时明确使用系统衬线回退，不能声称已达到跨设备字形一致。字体文件许可随项目分发。字体加载完成后再采集对比图。

关键参考坐标（原 863 画布）：首页搜索 y358、封面 y569、近期往来 y1372；books 列表 y470、创建按钮 y1548；book 头卡 y199–571、tabs y611；profile 头卡 y208–587；entry 键盘 y1250、保存 y1674；导航 y1681。小程序坐标对比必须先扣除真实系统状态栏相对参考 72px 的高度差，再比较正文，不能通过拉伸系统区掩盖误差。

## 8. 图片和静态资源

- 原始 103 个 PNG 和 6 款封面/5 款背景是资源真源，不直接复制 53MB HTML 到微信包。
- 只打包实际使用的图标、3 款背景、封面与图表；按类型命名，生成 manifest（原图 SHA-256、输出尺寸、字节数、用途）。
- 图标保留透明边缘；封面使用参考槽位裁切/缩放，不在客户端重绘文字。背景在构建期叠加纸色与角落梅枝，避免不兼容滤镜与大背景干扰正文。
- 资源转换使用可复现 Pillow 脚本，PNG 量化或 WebP 编码不得覆盖原图。图片先保证清晰度，再测包体，不静默降低质量。
- 首选本地资源，无未配置的 CDN/域名依赖；本地背景、封面优先压缩后测试，目标主包 < 2MiB。若超限，则使用分包/合法 HTTPS 静态域名，需要真实配置，不虚构域名。应报告资源总量，不仅报告 JS 大小。
- 包体 2MiB 是本项目保守验收阈值，实际上线以当前微信开发者工具规则为准。代码包不携带原 PNG、Python、测试截图、构建脚本、报告与未使用字典。
- 图片解码、文件引用、大小写、路径均自动检查；微信端验证 iOS/Android WebP 支持；不支持时提供 PNG 编码构建选项并重新测包体。

## 9. 交互、状态和导航

### 9.1 路由

`home ↔ people ↔ stats ↔ profile` 用 switchTab；`books`、`book?id=...`、`person?id=...`、`entry?bookId=...&personId=...` 用 navigateTo。详情返回使用 navigateBack，空栈回 home。query id 不存在显示可理解的空态，不读取任意路径。共享主键保持稳定，不用页面数组下标作为业务 id。

### 9.2 表单和筛选

搜索 trim 后匹配姓名/关系/礼事；分组与搜索组合生效。礼簿按类型与年份组合筛选。人物详情“全部/收礼/送礼”按真实 direction 字段过滤。姓名和礼簿名不允许为空；金额以分为整数保存，限制 2 位小数和上限，拒绝 NaN/Infinity/负数/科学计数；自定义键盘处理零开头、小数点、退格和清空。保存按钮执行中禁用，防重复提交。保存并继续保留当前礼簿、关系和方向，清空姓名/金额/礼品/备注；普通保存返回对应详情。

### 9.3 本地演示数据

store 存储 version/books/people/records。迁移损坏或未知版本时安全回退并提示，不让页面白屏。所有输入保留为纯文本，不拼 HTML。新增记录更新礼簿汇总、人物时间线、首页近日往来、profile 计数；统计使用同一聚合器，不能让一页保存而另一页仍展示旧副本。

参考指定年度统计的默认数据为展示基线（128600/96300/412 等），和只列五个人的节选列表不是完整数据库。统计页明确区分参考汇总与本机新增记录，切到无数据年份展示空态，不伪造真实业务统计。

### 9.4 系统行为

导出仅在用户点击时生成 JSON 文件，弹出原生分享/保存界面，不下载远程程序。家庭共享、真实云备份、账户权限、付费会员不在 UI 复刻阶段伪造完成；展示明确说明与后续 service 接口。提醒是本地偏好，不声称已完成订阅消息推送。

## 10. 动效、可访问与性能

按压透明度 0.72，transition 160ms；弹层淡入 180ms。不添加参考不存在的轮播和加载动画。输入有可见 label，按钮至少 44px 热区（低矮视觉按钮通过透明容器扩展），装饰 image 不成为点击目标。长列表允许滚动，不固定内容总高度裁切记录。scroll-view 内不嵌套同向滚动区域；图片指定尺寸，避免解码后布局跳动。

## 11. 开发步骤与交付计划

1. **文档/基线**：完成本文件并保存提交；静态提取颜色/尺寸/图标映射和参考哈希，锁定原生技术栈。
2. **资源与骨架**：独立项目、app 配置、自定义导航、token、全局按钮重置、资源压缩与 manifest；先测包体。
3. **基础组件**：标题、图标、封面、徽章、tab、操作按钮；确定 styleIsolation 和事件模型。
4. **页面复刻**：home → books/book → people/person → entry → stats/profile；每页有独立 WXML 与数据绑定，保持参考文案/节奏。
5. **行为接线**：store、搜索、picker、分组、查询路由、表单/金额键盘、持久化、导出与提示。
6. **静态/逻辑验证**：Node 测试；全部资源有效；路由可达；WXML 标签配对/表达式检查；WXSS 不含网页专属选择器；代码包低于预算。
7. **微信工具验证**：用户使用真实 AppID 导入，编译八页，排查 WXML/WXSS/基础库报错；工具里采集相同视口截图。云环境不可执行时明确列为未执行。
8. **逐像素复核**：863 基准等比到设备宽度；对正文截图做 overlay/diff，标记字体、位置、线宽、图片压缩差异，逐项修正；iOS/Android 各至少一台。
9. **交付**：完整源码、文档、资源 manifest、测试结果、导入说明、待配置项；不把“源码测试通过”写成“真机完全一致”。

## 12. 验收和未决依赖

开发完成标准：8 页可导入、页面/组件注册完整、原图对应正确、全部交互有结果、数据与金额校验通过、无 HTML 注入接口、无外部脚本/隐式联网、主包预算通过。对照表记录每页状态。

视觉验收：固定字体/设备宽度/基础库/系统字体缩放，默认状态、空态、筛选态与保存后状态分别截图；同一标准区的元素坐标偏差目标 ≤ 1 CSS px，色值与字号按 token 对齐，线宽允许设备像素量化误差；素材压缩与系统字体的残余差异需量化并记录。未采集微信真机截图前不能宣称像素级验收完成。

需要用户环境提供的发布条件：真实微信 AppID、可用开发者工具/真机、可选合法字体 HTTPS 域名。生产 API、登录、云同步/备份、订阅消息、隐私政策与发布审核属于后续接入，不阻塞本地 UI 复刻。
