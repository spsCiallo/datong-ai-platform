# 大同村农商文旅智慧平台 —— Agent 行为约束

本文件约束所有在本仓库内工作的 AI agent，**与具体工具无关**
（Claude Code、Codex、Cursor、Gemini CLI 等均适用；多数工具会自动读取
根目录的 AGENTS.md，你的工具如果不认，请把本文件内容配置到它的规则文件里）。

项目里很多设计是**刻意为之**，改动前先读 `README.md` 与
`docs/架构说明.md`，不确定的约定以本文件为准。

**刚接手本项目，请先读根目录 `HANDOVER.md`**：项目现状、本机环境、
启动与自检命令、已知坑与待办事项都在那里。

## 一、红线（任何情况下不得违反）

1. **禁止提交 `config/application.yml`**。它含本机数据库口令，已在 `.gitignore` 中。
   需要新增配置项时改模板 `config/application.example.yml`，并同步更新注释。
2. **禁止把任何真实密钥、口令写进代码或文档**（大模型 API Key、数据库口令等）。
   AI 密钥只允许通过 PC 后台「服务器管理 → AI 设置」或环境变量注入。
   README 里的演示账号（admin/admin123 等）是公开演示数据，属例外。
3. **禁止破坏「一键部署」零依赖承诺**：部署机只要求 JDK 17+ 与 MySQL。
   不得让部署流程新增 Node.js、Maven、npm 包或联网下载步骤。
4. **禁止给 `tools/` 下的 Node 脚本引入任何 npm 依赖**。它们必须在完全离线的
   机器上用裸 Node 运行（浏览器自检走 Chrome DevTools Protocol + 内置 WebSocket）。
5. **禁止在前端引入 CDN 资源**。所有 vendors（Vue、Element UI、字体等）一律
   本地化到 `server/src/main/resources/static/vendors/`，保证内网/离线可用。
6. **禁止删除或改坏订单数据相关逻辑**：订单是交易凭证，后台刻意不提供删除接口，
   自检脚本写入的订单也保留，不要"顺手"加删除功能。
7. **游客端只有一套响应式界面**（`/visitor/`）。不得重新拆出
   `/visitor/pc/` 独立电脑版或恢复 `uniapp-visitor` 安卓工程——
   「电脑手机共用」是本轮改造的明确需求，不是妥协。

## 二、脚本与编码

- `.bat` 文件必须是 **CRLF 换行 + 纯 ASCII**（中文写在 `.ps1` 里）；
  `.ps1` 文件必须是 **UTF-8 with BOM**；
  `.sh` 文件必须是 **LF 换行 + UTF-8 无 BOM + 首行 shebang + 可执行位**。
  `.gitattributes` 已固定这些换行规则，不要删改。
- `.sh` 必须兼容 **bash 3.2**（macOS 自带版本）：禁用关联数组、`${var,,}`、
  `mapfile` 等 bash 4 语法；变量紧邻全角字符时必须写成 `${var}`。
- 改动任何脚本后必须执行 `node tools/normalize-scripts.js --check` 通过后才能提交。
- 部署逻辑有两套对等实现：`tools/deploy.ps1`（Windows）与
  `tools/deploy.sh`（macOS / Linux）。**改一边必须同步另一边**，
  行为、提示文案、失败处理都要保持一致。
- 批处理 / 根目录 .sh 只做入口转发，实际逻辑写在 `tools/` 里。
- 读取 `config/application.yml` 时必须容忍 CRLF（它可能由 Windows 侧脚本
  生成），且键值要限定在所属块内取（`port:` 在 app 和 database 下各有一个）。

## 三、后端约定（server/）

- SpringBoot 3.3.5 / Java 17，单进程单 fat jar，端口 8080，不引入新框架
  （不加 MyBatis、JPA、Redis 等），数据访问统一走 `db/Db` 门面 + Spring JDBC。
- Java 包名是 `com.datong.cloud`，启动类 `DatongCloudApplication`，
  产物 `dist/datong-cloud-server.jar`，默认库名 `datong_cloud`，
  端口环境变量 `DT_PORT`，UDP 发现魔数 `DATONG_DISCOVER`。
- 所有 REST 接口统一返回 `{ ok, ... }` 结构（用 `common/R`），错误抛
  `ApiException` 交给全局异常处理器，不得自造响应格式。
- 权限一律用 `@RequireRole` 注解声明，新接口必须明确角色，不允许裸接口
  （健康检查等白名单除外）。
- **数据库变更必须幂等**：`schema.sql` 只用 `CREATE TABLE IF NOT EXISTS`；
  `DatabaseBootstrap` 反复执行不得删除或覆盖已有数据。
  遵守既有表设计约定：表名复数、必带 `seq` 自增写入顺序列、时间字段用
  VARCHAR、图片只存相对路径（本版实景照片在 `/assets/img/photo/`，虚拟地图底图在 `/assets/img/art/`）。
- **AI 功能必须可降级**：未配置密钥或第三方接口失败时，自动落回本地
  `knowledge` 知识库，全流程不得向用户报错。新增 AI 能力同样要有兜底。

## 四、前端约定

- `static/admin|merchant|visitor` 三端是**无构建**的手写页面（Vue 2.7 +
  Element UI 2.15），直接改源文件即可，不得给它们引入打包工具。
- 游客端 `static/visitor/` 是**一套电脑手机共用的响应式界面**：
  ≥900px 顶部导航 + 多栏网格，<900px 底部 Tab + 单栏。
  改游客端时两种断点都要看，不能只调手机把桌面挤坏（或反之）。
- 主题系统：`assets/js/theme.js` + `assets/css/themes.css`，
  四主题 `red / cyan / dark / blue`，只覆盖设计令牌。
  主题脚本必须在 `<head>` 同步引入（防首屏白闪）。
  图表配色实时读 CSS 变量（`assets/js/charts.js`），切主题自动重绘。
- 视觉资源分两类：**点位 / 商品 / 活动的配图是真实照片**，放在
  `assets/img/photo/`（每个主题 `<base>.jpg` / `<base>-b.jpg` / `<base>-c.jpg`
  三张同源不同景别，1000×750，换图请重新裁切，不要放程序化插画）；
  其余程序化图形资产（虚拟地图底图 `assets/img/art/map-village.svg`、
  logo / favicon / hero / 头像 / 图标 sprite）由 `tools/make-art.js` 生成。
  改构图或配色改生成器再重跑，**不要手工改生成的 SVG**（下次重跑会被覆盖）。
- 新增图片资源放 `static/assets/img/photo/`（实景照片）或
  `static/assets/img/art/`（生成图形），并保证被 smoke-test 的
  「图片引用存在性」静态检查覆盖到（该检查会递归扫描 img 目录）。

## 五、改完必须自检（提交前顺序执行）

1. 改了 Java：`rebuild.bat`（或 `tools/build.ps1`）重新编译，
   **必须把产物同步到 `dist/datong-cloud-server.jar`**——dist 里的 jar 是
   交付物，源码与 jar 不同步等于交付了旧版本。
2. `node tools/smoke-test.js` —— 接口断言必须全绿。
3. 改了前端：`node tools/browser-check.js` —— 无未捕获异常、无控制台错误、
   无 4xx/5xx，并对关键 DOM 做断言；顺带产出 `docs/screenshots/` 截图。
4. 改了 `tools/deploy.ps1` / `tools/deploy.sh` 里**读 `config/application.yml`
   的取配置逻辑**：`node tools/deploy-config-test.js` 必须全绿。
   它守的是「`port` 同名键导致配置自污染」那个 P0（首次部署不发作、第二次起
   才发作，Windows 与 macOS 两侧各自踩过）。**测试是抽交付版函数体来跑的、
   不是复制一份实现**，所以改了脚本它一定会跟着变。
5. 改了脚本：`node tools/normalize-scripts.js --check`。
6. 自检失败禁止提交；不得为了让检查通过而删除或弱化断言。

## 六、协作与 Git

- 不直接向 `main` 推送；从 `main` 拉分支，改完提 PR，自检通过后再合并。
- **每个成员（及其 agent）必须用自己的 GitHub 身份提交**：`user.name` 用
  自己的 GitHub 用户名，`user.email` 用自己的 noreply 邮箱。GitHub 按**邮箱**
  归属贡献，照抄别人的 `git config` 等于把自己的提交记到别人头上。
- 提交信息用中文，说清「改了什么、为什么」；一次提交只做一件事。
- 不提交 `logs/`、`server/target/`、`node_modules/`、`dist/` 之外的构建产物
  （均已 gitignore，不要绕过）。
- 保持现有注释风格：中文、高密度、写明「演示取舍」与「生产改造点」。
  删注释前先确认它不是在解释某个刻意设计。

## 七、提交日志与上下文记忆（每次提交必做）

为了让多名成员的 agent 能接续彼此的工作，**每次提交必须随附两样东西**，
并包含在同一个提交里：

### 1. 工作日志 `docs/worklog/`

- 一次提交一份，文件名 `YYYY-MM-DD-<主题小写短横线>.md`。
- 日志的读者是「下一个接手的 agent」，要写的是**代码和提交信息里看不到的东西**：
  为什么这么改、排查过程中走过的死胡同、自检结果摘要、遗留问题与建议下一步。
- 禁止流水账；一份合格的日志删掉文件清单后仍然有信息量。

### 2. 上下文记忆 `docs/agent-memory.md`

- 全团队 agent 共享的长期记忆，按主题分类，每条一到三行，标注日期与来源日志。
- 只沉淀跨任务仍然有价值的事实；本次工作没有值得沉淀的就不动它。
- 禁止把工作日志内容复制进来——记忆是蒸馏物，不是归档。

## 八、大更新必须提交 GitHub 并写更新日志（长期约束）

这一条是**项目级硬约束，不随某次任务结束而失效**。以后任何 agent 接手本项目，
只要动了功能代码、页面、数据结构或视觉资源，都必须按本节执行。

### 1. 什么算「大更新」

满足任意一条即算，必须提交并写日志：

- 新增/修改/删除任何接口、数据表、字段（含 `schema.sql` / `seed.sql`）；
- 新增或改动页面、视图、组件、交互流程（游客端 / 商户端 / 管理端任一端）；
- 调整视觉设计（主题令牌、图片资源、`tools/make-art.js` 生成物、布局与动效）；
- 批量内容订正（文案、命名、图集、坐标等影响三端展示的数据）；
- 修改 `tools/` 下的构建、部署、自检脚本或 `config/` 约定。

只改错别字、只调一行注释这类改动可以合并进相邻的常规提交，不必单开日志。

### 2. 提交到哪个仓库

- 远端固定为 **https://github.com/spsCiallo/datong-ai-platform**（`origin`）。
- 首次推送用 `main` 作为默认分支；日常按第六节走分支 + PR。
- 网络需要代理时用 **127.0.0.1:7897**（本机 Clash 端口），
  已配在 git 全局 `http.proxy` / `https.proxy`；换机器时重新配一次即可。
- 提交前必须确认：`config/application.yml` 未被暂存（红线 1）、
  `logs/` 与临时探针脚本未被暂存、`dist/` 里的 jar 与源码一致。

### 3. 提交信息与更新日志的写法

- 提交信息用中文，首行格式 `<端/模块>：<一句话做了什么>`，
  正文分点写「改了什么 / 为什么 / 影响范围」。
- **本次更新内容必须写进提交信息正文**，同时在 `docs/worklog/` 落一份日志，
  并在 `docs/CHANGELOG.md` 的「未发布」区块补一条面向使用者的摘要
  （新增了什么、修了什么、有哪些不兼容变化）。
- 涉及数据结构变更时，日志里必须写清迁移方式（是否需要重灌 seed、
  `DatabaseBootstrap` 是否会自动补列、旧数据要不要人工订正）。

### 4. 推送失败的处置

- 推送失败不得静默跳过：要么解决（代理、凭据、冲突）后重推，
  要么在回复里明确写出失败原因与当前分支状态，禁止假装已提交。
- 推送成功后回报：分支名、提交哈希、提交信息首行、远端地址。

