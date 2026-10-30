# 2026-10-31-农商文旅改造与虚拟地图

## 做了什么

按「大同村农商文旅」场景把平台整体改了一轮，覆盖三端 + 数据 + 视觉资源，共 12 项需求。
拆成四块：

1. **内容订正**：清掉全仓「火山」相关命名（"火山黄花""火山田园观景台""火山地质研学半日课"
   等），换成「黄花台地 / 桑干河湿地 / 古堡烽台」这套真实且贴合村域的场景词。
   改动落在 `seed.sql`、两个入口页的兜底标语、后台印章图标字典、`tools/make-art.js`
   生成物，以及 README / HANDOVER 的说明文字。图片资源同步重命名并重新生成
   （`goods-volcano-class*` → `goods-wetland-class*`，`spot-volcano*` → `spot-terrace*`）。
2. **位置与虚拟地图**：三张表加 `images` / `mapX` / `mapY`；新增 8 个商品把
   研学 / 民宿 / 农事体验三类填满；新写 `assets/js/village-map.js` 组件
   （1000×700 坐标系、缩放平移、标记反向缩放、`pickable` 选点模式）与配套样式；
   游客端加整页地图（48 个标记 + 7 个类别筛选 + 点标记看详情），点位详情与活动详情
   各内嵌一张小地图；商户端与管理员端在商品 / 点位 / 活动编辑弹窗里接入选点。
3. **游客端体验**：聊天从单栏改成两栏独立聊天页（左会话列表 + 右消息流，头像 + 时间，
   商品卡/订单卡可跳转）；「我的」页删掉「连接服务器」并把握题卡提到首屏；
   首页扇形图中间只留数字、进度文案移到圆环下方；AI 助手加返回按钮 + 输入框固定底部；
   点位打卡卡片与详情页加朱砂印章；活动详情加图集轮播与亮点板块；页面切换加过渡动画。
4. **管理员端**：修好「服务器管理」白屏与「个性化设置」点击无反应，并把个性化设置
   扩成真正的主题面板（四主题卡片 + 预览说明 + 恢复默认）。

## 为什么这么改

- **「火山」为什么必须改**：大同火山群是真实地理，但它不在大同村，也不属于本项目的
  农商文旅动线。景点名叫「火山田园观景台」会让游客以为要走火山线路，与实际点位
  （黄花田台地）对不上。保留 `docs/build_thesis.py` 里的「大同火山群南麓」——那是
  论文里的地理背景表述，不是景点命名，属正确用法。
- **地图为什么自己写组件而不是引地图库**：红线 5 禁止 CDN，红线 4 禁止 npm 依赖，
  而 Leaflet/OpenLayers 本地化后体积也不小，且项目是「虚拟手绘地图」而非真实地理坐标，
  用不上瓦片投影。所以用一个 1000×700 的虚拟坐标系 + 手绘底图 SVG，纯 Vue 组件实现，
  三端复用同一份 `village-map.js`。
- **聊天为什么不用重写后端**：`ChatService` 早就支持 `product` / `order` 两种消息类型，
  并且带归属校验（商品必须属于该商家、订单必须同时属于该商家与该买家）。
  「发送商品/订单不可用」的根因在前端：`openChatPicker` 只写了 `chatPicker`，
  没把 `chatPanel` 置 true，面板永远不显示。修一行就通了。
- **管理员两个空白页是同一个病根**：`viewServer` 的 `computed st()` 把 `server` 原样返回，
  接口失败时 `st.status` 是空对象，模板访问 `st.status.memory.usedMb` 直接抛异常，
  整个视图渲染失败 → 白屏；而 `themeMode` / `setTheme` 压根没定义，点主题按钮抛
  TypeError。所以修法是「补全默认值 + 补方法」，不是改模板。
- **图集第一张即封面**：三端都有「封面」字段，但列表、详情、地图都要图。与其维护两套
  数据，不如约定 `images[0] === cover`，后端 `ShopService.imagesOfBody()` 做兜底，
  前端保存时把第一张同步进 `cover`。这样老数据（只有 cover）也不会炸。

## 走过的死胡同

- **`deploy.ps1 reset` 会卡死**：它用 `Read-Host` 读确认，管道喂 `YES` 在
  `Start-Process` / 重定向下不能正常结束，进程一直挂着把命令超时耗光。
  正解是**绕开脚本直接重灌**：`mysql` 客户端 `DROP/CREATE DATABASE` + 依次导入
  `schema.sql`、`seed.sql`（必须带 `--default-character-set=utf8mb4`，否则中文乱码）。
- **手改 `config/application.yml` 的 `reset-on-start` 无效**：`deploy.ps1` 的
  `Write-LocalConfig` 每次启动都会重写该文件，手改在 java 启动前就被覆盖。
- **`java -jar` 直接启动全部失败**：nohup / `&` / `cmd start` / `Start-Process`
  都拉不起来，日志都不生成。只能用 `tools/deploy.ps1 start`。
- **改完前端忘了重新编译**：第一次跑 browser-check 报「首页 hasStamp:false」，
  查了半天以为是文案问题，实际是服务还在跑旧 jar（jar 里的 HTML 是旧的）。
  **前端改动也必须 rebuild**——静态资源是打进 jar 的，不是外挂目录。
- **`job_kill` 会连带杀掉 java**：杀掉挂着的中转 job 后服务跟着没了。
  杀完必须复查 `/api/health` 并重启。
- **管理员内容管理弹窗一度"看起来"没渲染图集与地图**：探针读不到 `.img-set-row` /
  `.vmap`，实际是 `mapPoints` 计算属性里 `.filter(function(){ ... this.form.id ... })`
  的回调 `this` 不是组件实例（脚本按严格模式解析），抛 TypeError 把整个弹窗渲染打断。
  改成先把 `form.id` 取到局部变量就好了。教训：Vue 2 里 `computed` 用普通函数做
  回调时别指望 `this`。

## 自检

- `tools/build.ps1` 通过，`dist/datong-cloud-server.jar` 24.5 MB。
- `node tools/smoke-test.js`：**通过 160 项，失败 0 项**。
- `node tools/browser-check.js`：**通过 72 项，失败 0 项**（截图落在 `docs/screenshots/`）。
- `node tools/deploy-config-test.js`：通过 36 项，失败 0 项。
- `node tools/normalize-scripts.js --check`：通过。
- 另用 headless Chrome 探针逐项复核（脚本是临时的，未入库）：管理员服务器/个性化设置
  两页有完整内容、商品/点位/活动弹窗图集与地图选点可交互、游客端地图 48 点 + 缩放 +
  筛选 + 跳转、聊天发商品/发订单成功且卡片可跳转、打卡后印章出现在卡片与详情、
  扇形图无重叠、AI 输入框贴底、页面切换动画生效。

## 遗留

- 演示数据重灌后订单会回到 45 笔；跑过 smoke-test 会再累加 7 笔测试订单（订单是交易
  凭证，后台不允许删除，属刻意设计）。正式演示前按 README「重置演示数据」恢复。
- 地图是虚拟坐标系（0–1000 / 0–700），不对应真实经纬度。若将来要接真实地图，
  需要给三张表加经纬度列并替换 `village-map.js` 的投影层，组件接口不用变。
- 商户端与管理端的图集选择器目前是「从固定 covers 列表里挑」，因为视觉资源由
  `tools/make-art.js` 生成、数量有限。将来若支持商家自行上传，需要接图片上传接口
  （当前 `ChatService` 的 dataURL 逻辑可复用）。
