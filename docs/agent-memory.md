# 上下文记忆

全团队 agent 共享的长期记忆。**只沉淀跨任务仍然有价值的事实**，每条一到三行，
标注日期与来源日志。工作日志（`docs/worklog/`）里的过程细节不要往这里搬。

分类顺序：环境 / 数据 / 后端 / 前端 / 视觉资源 / 自检 / 踩坑。

---

## 环境

- 本机 MySQL 9.6 在 `127.0.0.1:3306`，库名 `datong_cloud`；mysql 客户端在
  `C:/Program Files/MySQL/MySQL Server 9.6/bin/mysql.exe`，**必须加 `-h127.0.0.1`** 才能连。
  （2026-10-31，agri-tourism-revamp）
- Maven 只能用 `C:/Users/13541/.workbuddy/binaries/maven/apache-maven-3.9.16/bin/mvn.cmd`
  且必须 `-o` 离线；实际编译统一走 `tools/build.ps1`，不要手敲 mvn。
  （2026-10-31，agri-tourism-revamp）
- 服务只能用 `tools/deploy.ps1 start|restart` 拉起，`java -jar` 直启全部失败且不生成日志；
  `restart` 含健康检查等待，前台跑必超时，**必须后台跑**。（2026-10-31，agri-tourism-revamp）
- `tools/deploy.ps1` 每次启动都会重写 `config/application.yml`，手改该文件（含
  `reset-on-start`）在 java 启动前就被覆盖，属无效操作。（2026-10-31，agri-tourism-revamp）

## 数据

- `spots` / `products` / `activities` 三表有 `images`(JSON 数组)、`mapX`(0–1000)、
  `mapY`(0–700)；`DatabaseBootstrap` 启动时幂等补列，老库不用手工改结构。
  （2026-10-31，agri-tourism-revamp）
- **约定：`images[0] === cover`**。后端 `ShopService.imagesOfBody()` 兜底、前端保存时
  把第一张同步进 cover，这样只有 cover 的老数据也不会炸。（2026-10-31，agri-tourism-revamp）
- 重灌演示数据不要用 `deploy.ps1 reset`（`Read-Host` 在重定向下会卡死）；直接
  `mysql` 依次导 `schema.sql` + `seed.sql`，**必须带 `--default-character-set=utf8mb4`**。
  （2026-10-31，agri-tourism-revamp）
- 订单是交易凭证，后台刻意不提供删除接口；自检脚本产生的测试订单会累积，属正常。
  （2026-10-31，agri-tourism-revamp）

## 后端

- `ChatService` 早已支持 `product` / `order` 消息类型并做归属校验（商品属该商家、
  订单同时属该商家与该买家），聊天类问题优先查前端，不要动这个服务。
  （2026-10-31，agri-tourism-revamp）
- 数据库变更必须幂等：`schema.sql` 只用 `CREATE TABLE IF NOT EXISTS`，新列走
  `DatabaseBootstrap.ensureColumn`，新表要在 `db/Tables` 白名单里登记。
  （2026-10-31，agri-tourism-revamp）

## 前端

- 三端是无构建手写页面（Vue 2.7 + Element UI 2.15），**静态资源打进 jar**，
  所以改完前端也必须 `tools/build.ps1` + 重启，否则浏览器拿到的是旧 jar 里的文件。
  （2026-10-31，agri-tourism-revamp）
- Vue 2 的 `computed` 里用普通函数做 `.filter/.map` 回调时 `this` 不是组件实例
  （脚本按严格模式解析），要在回调外先取局部变量。踩过一次导致整个编辑弹窗渲染中断。
  （2026-10-31，agri-tourism-revamp）
- `village-map` 组件是三端共用的（`assets/js/village-map.js` + `assets/css/village-map.css`）。
  在**子组件模板**里用到时必须 `Vue.component` 全局注册，局部 `components` 解析不到。
  （2026-10-31，agri-tourism-revamp）

## 视觉资源

- `assets/img/art/` 下所有插画由 `tools/make-art.js` 生成，**不要手改生成的 SVG**
  （下次重跑会被覆盖）。要改构图或配色改生成器再重跑。（2026-10-31，agri-tourism-revamp）
- 主题四色 `red / cyan / dark / blue`，只覆盖设计令牌；`red` 是默认主题，
  `DTTheme.set('red')` 会把 `data-theme` 属性**移除**，这是正常行为不是 bug。
  （2026-10-31，agri-tourism-revamp）

## 自检

- 顺序：`tools/build.ps1` → `smoke-test.js` → `browser-check.js` →
  `deploy-config-test.js` → `normalize-scripts.js --check`。自检失败禁止提交，
  不得为了让检查通过而删改断言。（2026-10-31，agri-tourism-revamp）
- `smoke-test.js` 会扫描静态资源里的图片引用存在性，**文档/占位符里写
  `/assets/img/art/xxx.svg` 会被当成真实引用**，写示例路径要指向确实存在的文件。
  （2026-10-31，agri-tourism-revamp）
- `browser-check.js` 会把截图写到 `docs/screenshots/`，改完 UI 可以直接看这些图复核。
  （2026-10-31，agri-tourism-revamp）

## 踩坑

- `job_kill` 杀掉挂着的中转 job 会连带杀掉它管理的 java 进程，杀完必须复查
  `/api/health` 并重启服务。（2026-10-31，agri-tourism-revamp）
- 中文输出在 Git Bash 下会乱码（GBK 控制台），看日志用 grep 关键字而不是肉眼读。
  （2026-10-31，agri-tourism-revamp）
- 仓库远端是 https://github.com/spsCiallo/datong-ai-platform ，走代理 `127.0.0.1:7897`；
  首次推送用 `main` 作为默认分支。（2026-10-31，agri-tourism-revamp）
