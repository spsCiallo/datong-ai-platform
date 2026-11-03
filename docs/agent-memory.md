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

- **Vue 2 给对象新增属性必须用 `this.$set(obj, key, val)`**，直接 `obj.key = val`
  不会触发视图更新。新增商品时 `form` 是字面量、本来没有 `mapX/mapY` 键，踩过一次
  导致「地图点了准星不出现」。（2026-10-31，map-picking-and-ui-fixes）
- 游客端 `TOP_VIEWS`（visitor.js:20）决定哪些视图算顶层 Tab：进这些视图会**清空返回栈**。
  新增导航入口要同步登记，否则从该页进详情再返回会多退一层（2026-11-03，mine-wall-and-nav-icons）。
- 详情页里的「看全图」这类"再进一层"的跳转不能走 `go()`（顶层会清栈），
  要手工 `viewStack.push(view)` + 赋值 + `onEnter`（见 `openVillageMap`）。（2026-11-03，mine-wall-and-nav-icons）
- 「我的」页 `menus` 与顶部导航/首页宫格内容重复会显得冗长；删入口前先确认功能在别处可达。
  改 `menus` 时要顺带改掉与之重名的标题（如「我的印章墙」→「打卡集章」）。（2026-11-03，mine-wall-and-nav-icons）
- `village-map` 的点击热区绑在**根 `.vmap`** 上而不是 `.vmap-stage`：stage 按底图比例缩放后
  会比容器窄，两侧留白点不到。选点/取消统一走 `@pick` / `@unpick`。
  （2026-10-31，map-picking-and-ui-fixes）
- 编辑类 `el-dialog` 内容可能超过视口（实测 1141px），必须给 `.el-dialog__body` 限高
  `max-height:74vh; overflow-y:auto`，否则下半部分（如图集、地图）永远滚不到。
  （2026-10-31，map-picking-and-ui-fixes）
## 视觉资源

- `assets/img/art/` 下所有插画由 `tools/make-art.js` 生成，**不要手改生成的 SVG**
  （下次重跑会被覆盖）。要改构图或配色改生成器再重跑。（2026-10-31，agri-tourism-revamp）
- 主题四色 `red / cyan / dark / blue`，只覆盖设计令牌；`red` 是默认主题，
  `DTTheme.set('red')` 会把 `data-theme` 属性**移除**，这是正常行为不是 bug。
  （2026-10-31，agri-tourism-revamp）

- favicon 文件名即缓存键：只改内容不换路径，浏览器（尤其 `127.0.0.1` 这类 origin）
  可能几个月不刷新。换图标必须**同时换文件名**（现用 `favicon-datong.svg`）并同步
  `tools/make-art.js` 的 `write(...)` 行。（2026-10-31，map-picking-and-ui-fixes）
## 自检

- 顺序：`tools/build.ps1` → `smoke-test.js` → `browser-check.js` →
  `deploy-config-test.js` → `normalize-scripts.js --check`。自检失败禁止提交，
  不得为了让检查通过而删改断言。（2026-10-31，agri-tourism-revamp）
- `smoke-test.js` 会扫描静态资源里的图片引用存在性，**文档/占位符里写
  `/assets/img/art/xxx.svg` 会被当成真实引用**，写示例路径要指向确实存在的文件。
  （2026-10-31，agri-tourism-revamp）
- `browser-check.js` 会把截图写到 `docs/screenshots/`，改完 UI 可以直接看这些图复核。
  （2026-10-31，agri-tourism-revamp）
- 量顶部导航（`.nav-links`）的尺寸必须放在 **1440×900 桌面区块**：≤900px 时它 `display:none`，
  `getBoundingClientRect().width` 恒为 0，断言必假失败。（2026-11-03，mine-wall-and-nav-icons）
- 改 UI 结构时 `browser-check` 的断言要**换契约不降强度**：删旧元素就把断言改成
  「新元素在 + 旧元素不在」（如 `.kpi` 不存在、被删入口文案不出现）。（2026-11-03，mine-wall-and-nav-icons）

- 用 headless Chrome + CDP `Input.dispatchMouseEvent` 做真实点击才能验证地图选点；
  JS 合成 `MouseEvent` 能通不代表用户点得到（热区/遮挡/滚动位置都可能是真因）。
  （2026-10-31，map-picking-and-ui-fixes）
- 探测 admin `viewContent` 换 tab 必须调组件的 `switchTab()`，只改 `c.tab` 不会重新拉列表，
  会误判成「弹窗里没渲染」。（2026-10-31，map-picking-and-ui-fixes）
- 游客端「分类」字段有两种形态：列表接口给字符串（`category: 'goods'`），
  字典对象走 `normalizeCategory()`（返回 `{key,name,reasons}`）。**不要用
  `normalizeCategory(str) === 'goods'` 判断**，恒为 false；用 `catKey()`（2026-11-02，
  orders-and-navigation）。
- `/api/shop/orders` 列表项**没有** `productCategory`，只有 `category`；
  `productCategory` / `productMapX` / `productMapY` / `productImages` / `productDesc`
  只在订单详情 `/api/shop/orders/{id}` 里返回。（2026-11-02，orders-and-navigation）
- 活动预约写 `activityBookings` 表、不写 `orders` 表，列表走 `/api/tour/bookings`。
  「预约后看不到」优先怀疑列表入口缺失，而不是下单失败。（2026-11-02，orders-and-navigation）
- 订单列表排序键不能直接 `String.valueOf(createdAt)`：NULL 会变成 `"null"`，
  字典序比数字大，老订单永远置顶。先 `trim()` 再兜底。（2026-11-02，orders-and-navigation）
- 探针里调 `vm.buyNow()` 前必须设 `vm.address`，否则被 `toast('请填写收货地址')`
  静默拦下，后续断言会全落在旧数据上。（2026-11-02，orders-and-navigation）
## 踩坑

- `job_kill` 杀掉挂着的中转 job 会连带杀掉它管理的 java 进程，杀完必须复查
  `/api/health` 并重启服务。（2026-10-31，agri-tourism-revamp）
- 中文输出在 Git Bash 下会乱码（GBK 控制台），看日志用 grep 关键字而不是肉眼读。
  （2026-10-31，agri-tourism-revamp）
- 仓库远端是 https://github.com/spsCiallo/datong-ai-platform ，走代理 `127.0.0.1:7897`；
  首次推送用 `main` 作为默认分支。（2026-10-31，agri-tourism-revamp）