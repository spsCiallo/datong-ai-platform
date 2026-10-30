# 大同村农商文旅智慧平台

> 一套面向乡村振兴场景的农商文旅一体化平台。**一台电脑当服务器**，PC 管理后台、
> 商户工作台、游客端（电脑手机共用的一套响应式界面）共用一个后端。
> 后端 SpringBoot + MySQL，AI 采用本地知识库与可选第三方大模型；未配置或第三方调用失败时回退本地回答。

本项目由「郫都区战旗村川西林盘农商文旅智慧服务平台」重构而来：
后端架构、接口、数据表与权限体系沿用原项目（保证可运行、接口兼容），
游客端合并为一套响应式界面，前端视觉全面换新（朱砂红主色 + 四主题切换），
演示数据重写为「大同村」（桑干河畔 · 黄花台地 · 大同黄花）。

---

## 阅读导航

- [一键部署、地址与默认账号](#quick-start)
- [后端架构](#backend-architecture)
- [三端功能清单](#features)
- [主题切换](#themes)
- [数据库概览](#database)
- [目录结构](#layout)
- [自检脚本](#checks)
- [常见问题](#faq)

> 文中密码仅为公开演示账号，不包含成员本机口令或真实密钥。

---

<a id="quick-start"></a>

## 一、一键部署

### Windows

| 步骤 | 操作 | 说明 |
| --- | --- | --- |
| 1 | 确认电脑装了 **JDK 17+** 和 **MySQL** | 命令行 `java -version` 能看到 17 以上；MySQL 服务已启动 |
| 2 | 双击 **`一键部署.bat`** | 脚本自动完成：检查环境 → 探测数据库口令 → 建库建表灌演示数据 → 后台启动服务 → 打开浏览器 |
| 3 | 浏览器里打开打印出来的地址即可 | 部署完成后控制台会列出各端地址 |

**不需要装 Node.js、不需要装 Maven、不需要手工执行 SQL、不需要配任何连接串。**
运行包 `dist/datong-cloud-server.jar` 已经预编译好，双击即可。

### macOS / Linux

```bash
./deploy.sh      # 一键部署并启动
./stop.sh        # 停止服务
./status.sh      # 查看运行状态与各端地址
./rebuild.sh     # 重新编译后端（需要 Maven，改了 Java 代码才需要）
./reset.sh       # 清空业务数据并重灌演示数据（需输入 YES 确认，不可恢复）
```

### 部署后的访问地址

| 端 | 地址 | 说明 |
| --- | --- | --- |
| **PC 管理后台** | `http://localhost:8080/admin/` | 管理员用 |
| **商户工作台** | `http://localhost:8080/merchant/` | 商家用，电脑浏览器 |
| **游客端** | `http://localhost:8080/visitor/` | **电脑手机共用一套响应式界面** |
| **统一入口页** | `http://localhost:8080/` | 含手机端二维码 |

> 手机访问要用**局域网地址**（形如 `http://192.168.x.x:8080/visitor/`），
> 部署脚本会打印出来，入口页也有二维码。前提是手机和电脑连同一个 WiFi。
> 游客端没有独立手机版/电脑版之分：窄屏自动收起为底部 Tab，宽屏切换为顶部导航 + 多栏布局。

### 默认账号

| 角色 | 账号 | 密码 | 说明 |
| --- | --- | --- | --- |
| 平台管理员 | `admin` | `admin123` | 系统预置，不开放注册 |
| 商家 | `zhangmm` | `123456` | 云州黄花合作社 · 张桂芬（农产品） |
| 商家 | `lims` | `123456` | 塞上铜艺工坊 · 李长明（非遗手艺人） |
| 商家 | `liujg` | `123456` | 桑干河畔民宿 · 刘建国（民宿经营者） |
| 游客 | `wangyou` | `123456` | 游客 小王 |
| 游客 | `lixue` | `123456` | 游客 李同学 |

> **登录页初始不显示任何账号**：只有「存在 + 成功登录过至少一次」两个条件都满足，
> 账号才会出现在快捷登录卡片里。演示时手动输入一次即可。

---

<a id="backend-architecture"></a>

## 二、后端架构

后端是 **Spring Boot 3.3.5 / Java 17 的单体应用**，打成一个带内嵌 Tomcat 的 fat jar。
同一个进程托管页面、提供 REST API、初始化 MySQL，并提供局域网发现与二维码。
默认 HTTP 端口为 8080；部署脚本遇到占用会选择空闲端口，以终端实际输出为准。

```
游客端 /visitor/ ─┐
商户端 /merchant/ ─┼─→ HTTP JSON /api/** ─→ AuthInterceptor ─→ Controller ─→ Service ─→ Db ─→ MySQL
管理端 /admin/   ─┘                                              │
                                                              AiService（本地知识库 + 可选大模型）
```

| 层面 | 实现 |
| --- | --- |
| Web | Spring MVC、内嵌 Tomcat、Jackson；13 个 Controller |
| 业务 | `service/` + `auth/AuthService` |
| 数据访问 | Spring JDBC `JdbcTemplate` + `db/Db` 门面（无 MyBatis / JPA / Redis） |
| 连接池 | HikariCP + MySQL Connector/J |
| 静态页面 | `resources/static/`，本地 Vue 2.7 / Element UI，零构建 |
| AI | JDK HttpClient；本地关键词检索 + 可选 OpenAI 兼容接口润色 |
| 部署 | `.bat` → `tools/deploy.ps1`；`.sh` → `tools/deploy.sh` |

**接口兼容承诺**：本轮重构不改任何 REST 路径、请求/响应字段、角色权限与订单状态机。
三端页面全部按既有契约对接（购物车准入、逐项结算、拒绝协商、买家确认收货结算、
活动预约与商品预约分离、AI 未命中明确拒答）。

---

<a id="features"></a>

## 三、功能清单

### 游客端（一套响应式界面，电脑手机共用）

| 页面 | 功能 |
| --- | --- |
| 登录 / 注册 | 账号密码登录、游客自助注册、快捷登录卡片（仅登录过的账号） |
| 首页 | 集章进度环形图、功能宫格、推荐点位、热门好物、近期活动 |
| 点位打卡集章 | 14 个大同村点位、打卡得印章、印章墙、集齐通关提示 |
| 点位详情 | 图集轮播（4.2s 自动播放）、语音讲解（浏览器 TTS）、印章状态 |
| 商城 | 分类筛选、关键词搜索、购物车（本地，仅农产文创可加购） |
| 商品详情 | 图文详情、四类购买表单（实物地址 / 研学场次 / 民宿房型 / 农事时段） |
| 研学民宿预约 | 研学 / 民宿 / 农事体验三类项目聚合入口 |
| 我的订单 | 状态筛选、取消、商家拒绝协商（同意关闭 / 继续协商）、确认收货结算、物流 |
| 活动日历 | 活动列表、详情、人数上限、预约/取消；自动区分已结束活动 |
| AI 助手 | 知识库问答、打字机效果、猜你想问、未命中明确说明 |
| AI 行程规划 | 按天数 / 人数 / 偏好生成 1-3 天时间轴行程 + 花费预估 |
| 消息客服 | 与商家文字 / 图片 / 商品卡 / 订单卡聊天，在线 / 输入中 |
| 举报中心 | 提交举报、查看处理进度与上诉结果 |
| 我的 | 集章与消费统计、头像与改密、**四主题切换**、退出登录 |

### PC 管理后台

运营概览、商家管理、买家管理、订单总览、商品总览、内容与活动（点位 / 活动 / 知识库）、
服务器状态、连接配置、手机端二维码、AI 设置、数据总览与表浏览。

### 商户工作台

工作台看板、商品管理（含 AI 文案）、订单管理（接单 / 拒绝 / 发货 / 办理入住）、
消息客服、用户举报与上诉、店铺信息。

---

<a id="themes"></a>

## 四、主题切换

全站支持四种主题，入口在游客端「我的 → 界面主题」、管理端 / 商户端「个性化设置」，
游客端顶部导航也有四个色点快捷切换：

| 主题 | 标识 | 说明 |
| --- | --- | --- |
| 朱砂（默认） | `red` | 朱砂红主色 + 宣纸暖白底，对应大同黄花与黄花台地的土地 |
| 青瓷 | `cyan` | 青瓷绿主色，清爽护眼 |
| 墨夜 | `dark` | 暖味墨黑 + 珊瑚红提亮，卡片 / 弹窗 / 表格 / 输入框整体变深 |
| 靛蓝 | `blue` | 靛蓝主色，商务感 |

实现方式：`assets/js/theme.js` 只切换 `<html data-theme>`，
`assets/css/themes.css` 覆盖 `app.css` 的设计令牌（CSS 变量），
因此卡片、弹窗、表格、Element UI 组件一起换装，不会出现「卡片黑了弹窗还白」。
图表（`charts.js`）实时读取 `--brand` 等令牌，切主题自动重绘。
偏好存 localStorage（key `datong.theme`），刷新不丢。

---

<a id="database"></a>

## 五、数据库概览

MySQL，默认库名 `datong_cloud`，**18 张表、235 个物理字段**（与原项目完全一致）。
所有表 InnoDB + utf8mb4；服务启动时自动建库、建表、补列、灌种子数据（全部幂等）。

核心表：`users` / `merchants` / `admins`（三类账号）、`spots` / `stamps`（点位集章）、
`products` / `orders` / `settlements`（商品与订单结算）、`activities` / `activityBookings`（活动预约）、
`knowledge`（AI 知识库）、`sessions` / `settings`、`chatMessages` / `chatTyping`、
`reports` / `orderLogs` / `notifications`。

订单状态机（无外键，逻辑关联由业务层保证）：

- 实物：`pending → confirmed → shipped → completed`
- 民宿：`confirmed → checked_in → completed`
- 研学 / 农事：`confirmed → completed`
- 取消 / 退款：`cancelled` / `refunded`；`used` 仅历史数据只读兼容
- 商家拒绝不直接关单，等买家「同意关闭」才 `cancelled`

演示数据（`db/seed.sql`，幂等 `INSERT IGNORE`）：
14 点位 · 6 商户 · 12 游客 · 16 商品 · 10 活动 · 40 条知识库 · 约 48 笔订单
（覆盖全部状态与两条拒绝协商线）· 26 条打卡 · 聊天 / 举报 / 通知若干。
订单与打卡日期用 `CURDATE()` 相对生成，无论哪天重置，运营看板近 7/30 日都有走势。

---

<a id="layout"></a>

## 六、目录结构

```
datong-ai-platform/
├─ 一键部署.bat / deploy.bat      双击这个启动
├─ stop.bat / status.bat / rebuild.bat / reset.bat
├─ deploy.sh / stop.sh / status.sh / rebuild.sh / reset.sh
├─ dist/
│  └─ datong-cloud-server.jar     预编译运行包
├─ config/
│  ├─ application.example.yml     可提交的配置模板
│  └─ application.yml             本机配置，由部署脚本自动生成，禁止提交
├─ server/
│  ├─ pom.xml                     artifactId = datong-cloud-server
│  └─ src/main/
│     ├─ java/com/datong/cloud/   DatongCloudApplication + config/auth/common/db/controller/service
│     └─ resources/
│        ├─ application.yml
│        ├─ db/schema.sql         18 张表建表脚本（幂等）
│        ├─ db/seed.sql           大同村演示数据（幂等，图集已并入）
│        └─ static/
│           ├─ index.html         统一入口页
│           ├─ admin/             PC 管理后台
│           ├─ merchant/          商户工作台
│           ├─ visitor/           游客端（一套响应式界面，无独立 pc 目录）
│           └─ assets/            设计系统、四主题、插画、图表、语音
├─ tools/                         部署、编译、自检与美术生成脚本
│  └─ make-art.js                 视觉资源生成器（node tools/make-art.js 重绘全套插画）
└─ docs/
```

---

<a id="checks"></a>

## 七、自检脚本（改完代码跑一遍）

| 命令 | 作用 |
| --- | --- |
| `node tools/smoke-test.js` | 接口冒烟测试 + 图片引用存在性静态检查 |
| `node tools/browser-check.js` | 前端实机自检（无头 Chrome + CDP，含桌面/手机双视口、主题切换、截图） |
| `node tools/deploy-config-test.js` | 部署配置解析回归测试 |
| `node tools/normalize-scripts.js --check` | 脚本编码自检 |
| `node tools/make-art.js` | 重新生成全套插画 / 图标 / 头像（改美术后跑） |

> 冒烟测试与浏览器自检会往库里写测试数据。账号与商品会自动清理；
> **订单会保留**（交易凭证，后台刻意不提供删除接口）。
> 正式演示前用 `reset.bat` / `./reset.sh` 恢复干净数据。

---

<a id="faq"></a>

## 八、常见问题

**Q：游客端电脑和手机是两个网址吗？**
不是。同一地址 `http://<ip>:8080/visitor/`。窄屏（<900px）显示底部 Tab + 单栏，
宽屏显示顶部导航 + 多栏网格。不需要再访问 `/visitor/pc/`（该目录已删除）。

**Q：怎么换主题？**
游客端「我的 → 界面主题」或顶部导航右侧四个色点；管理端 / 商户端在「个性化设置」。
朱砂 / 青瓷 / 墨夜 / 靛蓝四种，全站一起换。

**Q：AI 助手需要联网吗？**
不需要。默认走本地知识库检索（40+ 条大同村条目），未命中会明确说「资料中没有」。
在管理后台配置大模型接口后，命中知识的内容会再润色一遍；调用失败自动回落本地原文。

**Q：演示数据里的黄花、铜火锅是真实商品吗？**
是演示数据，不是真实交易。支付为账务口径（买家确认收货入账、退款冲减），没有接真实支付通道。
生产接入支付/分账时，只需在 `SettlementService.settle()` 里调起真实转账。

**Q：为什么登录页看不到账号？**
刻意的。只有成功登录过一次的账号才会出现在快捷登录区，避免任何人打开登录页就能看到平台有哪些账号。
