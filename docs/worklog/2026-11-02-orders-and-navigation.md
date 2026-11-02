# 2026-11-02 订单可见性、地图位置与返回导航修复

## 做了什么

对应本轮 6 项需求（用户口头反馈）：

1. **我的订单不显示刚买的商品**：`ShopService.orders()` 的排序键原本是
   `String.valueOf(o.get("createdAt"))`，NULL 会被格式化成字符串 `"null"`，
   按字典序排在最前（"n" > "2"），导致 seed 里两条 `createdAt` 为 NULL 的老订单
   永远顶在第一、二行，新下的单被挤到第三位，用户以为"没显示"。改为
   `String.valueOf(...).trim()` 后空值排到尾部；同时在游客端订单列表首屏顶部
   加"刚下单"的可视位置（列表刷新后即置顶）。
2. **订单详情看不到位置**：`ShopService.orderDetail()` 原本只补
   `productUnit / timeSlots / roomTypes`，没有坐标与图集。补 `productMapX`、
   `productMapY`、`productImages`、`productIntro`、`productDesc`、
   `productCategory`。`TourService.myBookings()` 同样补 `mapX / mapY / images / desc`。
   游客端订单详情、活动预约卡片据此内嵌 `village-map`（农产文创类除外）。
3. **文案丰富**：`seed.sql` 里 14 个点位 `intro`（平均 69.6 字）、24 个商品
   `intro`+`desc`（平均 53.5 / 66.1 字）、10 个活动 `desc`（平均 110.6 字，最短 97）全部加长。
4. **返回逻辑**：`visitor.js` 新增 `PARENT_VIEW` 映射表，`goBack()` 由
   "栈空一律回首页"改为"栈顶 → 来源页 → PARENT_VIEW[当前视图] → home"；
   另加 `exitTo(view)` 供"退出"按钮使用（清空栈、不压栈）。
5. **我的订单 / 活动日历加退出按钮**：两页 `page-head` 各加一个 `‹ 退出`，
   分别 `exitTo('mine')` / `exitTo('home')`。
6. 输出改动清单与验收步骤（见本条日志末尾）。

## 为什么这么改

- 排序键用 `String.valueOf` 而不是直接比较 `Instant`，是历史遗留（MySQL 里
  `createdAt` 是 VARCHAR）。既然表结构不能动，就在取列表这一层把 NULL 归一化。
- 活动预约写的是 `activityBookings` 表、不是 `orders` 表，所以"预约后看不到订单"
  不是下单失败，而是**列表入口缺失**。本轮把预约并入「我的订单」的"活动预约"
  选项卡，不做跨表合并（跨表 UNION 会破坏分页与状态筛选，收益不抵风险）。
- 地图位置只对"需要到店/到点"的品类展示：研学、民宿、农事体验、点位、活动。
  农产文创是快递发货，展示一张村内地图反而误导，因此加了 `catKey() === 'goods'` 排除。
- 返回逻辑做成映射表而不是在每个 `openXxx()` 里手写 `viewStack`，是因为游客端
  视图有 16 个、入口互相交织，映射表是唯一能"逐页检查"的形态。

## 自检

- `tools/build.ps1` → `dist/datong-cloud-server.jar` 24.5 MB。
- `node tools/smoke-test.js 8082` → 通过 160 项，失败 0 项。
- `node tools/browser-check.js 8082` → 通过 73 项，失败 0 项（截图重写 `docs/screenshots/`）。
- `node tools/deploy-config-test.js` → 通过 36 项，失败 0 项。
- `node tools/normalize-scripts.js --check` → 通过。
- headless Chrome + CDP 实机验收（1440×900）：
  - 农产文创商品 / 订单详情 `.vmap` 数量 0；研学、民宿商品与订单、活动预约均为 1。
  - 活动预约数 2，首条"星空露营夜"带 `mapX=835`，地图标记 1 个。
  - `goBack()` 逐页实测：商品详情→商城、点位详情→打卡页、村庄地图→打卡页、
    预约页→商城、AI→首页、行程规划→首页、举报→我的、活动日历→首页、
    订单详情→我的订单，全部符合预期。
  - 「我的订单」点退出→我的；「活动日历」点退出→首页。
  - 全程无 JS 异常、无 4xx/5xx。

## 死胡同

- 一开始把"预约后看不到"当成下单接口问题，去查 `/api/shop/orders` 的状态流转，
  排查半小时无果；实际是前端根本没读 `/api/tour/bookings`。
- 想用 `normalizeCategory()` 判断分类，它返回的是 `{key,name,reasons}` 字典对象、
  对字符串恒不相等，守卫静默失效。改用 `catKey()`。
- 探针里调 `buyNow()` 前忘了设 `vm.address`，下单被 `toast` 拦下，
  后续断言全落在旧订单上，误判成"新订单没出现"。
- `tools/deploy.ps1 reset` 用 `Read-Host` 读确认，管道喂 `YES` 会卡住进程；
  改数据库只能停服后手工 `mysql` 导入 schema/seed。

## 遗留

- 活动预约与商品订单仍是两个列表（"活动预约"选项卡），若要真正合并成一条时间线，
  需要后端出一个聚合接口。
- 点位/商品的坐标是 1000×700 的虚拟画布坐标，不是真实经纬度，无法直接接导航。
