# 交接说明（HANDOVER）

> **接手本项目的 agent，请先读完本文件再看代码。**
> 最后更新：2026-10-31　｜　项目位置：`D:\毕业设计\datong-ai-platform`

---

## 0. 一句话

大同村农商文旅智慧平台（大同云）。课程/演示向的**单机部署**项目：
一台电脑当服务器（SpringBoot + MySQL），PC 管理后台 + 商户工作台 + 游客端
（一套电脑手机共用的响应式界面）三端共用一套后端。
设计目标：**目标用户双击 `.bat` 就能跑起来，「不出错」优先于「功能多」**。

由 `zhanqi-ai-platform`（战旗村项目）重构而来：后端接口与表结构兼容，
前端视觉全面换新，游客端合并为响应式单端，演示数据重写为大同村内容。

## 1. 必读顺序

| 顺序 | 文件 | 作用 |
| --- | --- | --- |
| 1 | `AGENTS.md` | **行为红线与开发约定** |
| 2 | `HANDOVER.md` | 本文件 |
| 3 | `README.md` | 面向使用者：怎么部署、怎么用 |
| 4 | `docs/架构说明.md` | 面向开发者：整体架构与设计取舍 |

## 2. 本机环境（这台 Windows 机器）

| 项 | 值 |
| --- | --- |
| MySQL | 9.6，`127.0.0.1:3306`，库 `datong_cloud`（服务名 MySQL960 正在运行；MySQL96 是停止的旧服务，别搞混） |
| **数据库口令** | 见 `config/application.yml` 的 `app.database.password`。**该文件已 gitignore，禁止抄进任何文档/日志/提交**。部署脚本会自动探测常见口令 |
| JDK | `C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`（已在 PATH） |
| Maven | `C:\Users\13541\.workbuddy\binaries\maven\apache-maven-3.9.16\bin\mvn.cmd`（**不在 PATH，要用全路径**；只能用 `mvn.cmd`） |
| Chrome | `C:\Program Files\Google\Chrome\Application\chrome.exe`（前端自检用 CDP 驱动） |
| Node | v24，已在 PATH |
| `.m2` | 已预热（SpringBoot 3.3.5 依赖齐全），编译可离线 `-o` |

### 这台机器的坑（沿用旧项目经验）

1. **npm 完全不可用**（单请求 90–290 秒）。需要下载东西用 Node 的 `fetch` 或 curl。
   这也是三端前端做成「零构建」的直接原因。
2. **PowerShell 5.1 不支持 `&&`**。串联命令用 `;`。
3. **沙箱可能拦截删除**。`server/target` 下可能出现假文件锁，用 Node 的 `fs.rmSync` 绕。
4. **环境变量可能有同名大小写键**（Path/PATH），`deploy.ps1` 已自带清理逻辑。

## 3. 怎么跑起来、怎么验证

```powershell
# 编译（改了 Java 才需要）；产物同步到 dist\datong-cloud-server.jar
& 'C:\Users\13541\.workbuddy\binaries\maven\apache-maven-3.9.16\bin\mvn.cmd' -o -f server\pom.xml -DskipTests package
Copy-Item server\target\datong-cloud-server.jar dist\datong-cloud-server.jar -Force

# 启动（含首次部署初始化）
.\一键部署.bat
# 停止 / 状态
.\stop.bat
.\status.bat
```

自检（`AGENTS.md` 第五节）：

```powershell
node tools/normalize-scripts.js --check
node tools/smoke-test.js
node tools/browser-check.js
node tools/deploy-config-test.js
```

> 自检脚本会往库里写测试账号、商品和订单。账号与商品会自动清掉；
> **订单会保留**。正式演示前双击 `reset.bat` 恢复干净数据（需输入 YES）。
> reset 沿用上次运行的端口，不一定是 8080；smoke-test 默认打 8080，
> 端口不对时按打印出来的地址传参：`node tools/smoke-test.js 8081`。

## 4. 本轮改造要点（接手必知）

1. **游客端是一套响应式界面**（`/visitor/`）。`/visitor/pc/` 与 `uniapp-visitor/` 已删除，
   `WebConfig` 不再转发 pc 目录。改游客端时桌面（≥900px）与手机两种断点都要看。
2. **四主题**：`red / cyan / dark / blue`。`themes.css` 替代了旧 `theme-dark.css`。
   深色令牌 `--bg: #171412`（不是旧版的 `#151A18`）。
3. **视觉资源全部重绘**：`tools/make-art.js` 生成 `assets/img/art/` 下 90 张场景插画
   （14 点位 + 16 商品，各 3 张图集：白昼 / 黄昏 / 暮色）+ logo / 头像 / 图标 sprite。
   旧 `assets/img/photos/*.jpg` 已删除。改美术改生成器再重跑，别手改生成物。
4. **charts.js** 组件名保持 `zq-line / zq-donut / zq-bars / zq-spark`（页面模板不用改），
   配色改为实时读 CSS 令牌，切主题自动重绘。
5. **seed.sql 全量重写**：大同村内容（黄花 / 铜艺 / 民宿 / 研学 / 湿地 / 古堡）。
   订单覆盖全部状态 + 两条拒绝协商线；图集 JSON 直接写进 spots/products，
   不再有独立的 seed-gallery.sql。
6. **JS 全局前缀仍是 `ZQ`/`DT` 混用**：业务对象 `window.DT`、主题 `DTTheme`、
   语音 `DTSpeech`、头像 `DTProfile`、印章 `DTSpotIcons`、图表 `DTCharts`；
   图表组件注册名保留 `zq-line` 等。localStorage key 统一 `datong.*`。

## 5. 已知边界（沿袭旧项目，未在本轮扩大改造）

- 主键 `Db.nextId()` 按「行数+1」生成，删除账号后序号可能复用（旧项目实测过的缺陷，
  彻底修需要独立计数器表，别在这里打补丁）。
- 物流是模拟的：`LogisticsService.track()` 按「发货时间 + 运单号」生成可复现节点。
- 无真实支付通道；「资金」是账务口径。
- `tools/deploy.sh` 的取配置逻辑比 ps1 版弱两处（缩进写死、不剥行尾注释），
  日常不触发；改配置解析时先跑 `deploy-config-test.js`。

## 6. 论文

毕业设计论文按学校「附件6」模板生成，输出在 `D:\毕业设计\` 下
（封面字段：机电信息学院 / 软件技术 / 2024级软件技术1班 / 帅鹏山 / 246230119 /
校内指导教师 李敏 / 日期 2026年10月31日）。
论文内容以本平台真实实现为依据，不编造未实现功能。
