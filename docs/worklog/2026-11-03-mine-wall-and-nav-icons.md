# 2026-11-03 我的页集章墙与顶部导航图标

## 做了什么

游客端（`server/src/main/resources/static/visitor/`）：

1. **「我的」删掉 4 个入口**：AI 文旅助手、AI 行程规划、活动日历、去逛商城。
   `visitor/js/visitor.js` 的 `menus` computed 从 7 项减到 3 项（我的订单 / 打卡集章 / 举报中心）。
   这四个功能并没有消失：AI 与行程规划仍在首页宫格，商城与活动日历在顶部导航。
   菜单里之所以要删，是因为它们和导航/宫格完全重复，「我的」页被撑得很长。

2. **三格数字换成「我的集章墙」**：「集章 / 订单 / 消费」三个 KPI 只给了数字，
   点不进去也看不出集了什么。换成直接渲染 `stamps` 数组的印章墙：
   每枚印章用与印章墙一致的 `.stamp.on` 样式（图标 + 印章名 + 点位名），
   右侧给「去打卡」按钮，空态给一句引导。数据源就是已有的 `stamps`，没有新接口。

3. **顶部导航加「村庄地图」**：`TOP_VIEWS` 从 4 项加到 5 项
   （`['home','spots','villageMap','shop','mine']`）。
   加进 TOP_VIEWS 是为了让导航切页像其它 Tab 一样清空返回栈 ——
   否则从地图点进某个点位再返回，会先回到地图再回到上一页，层级很怪。
   同时删掉点位打卡页头部的「村庄地图」按钮，入口统一到导航。

4. **手机端底部 Tab 补「地图」**：移动端没有顶部导航，删掉打卡页的按钮后
   手机上就没有地图入口了，所以底部 Tab 从 4 项变 5 项。

5. **电脑端导航图标**：每个 `.nav-links a` 前加一个 17×17 的 `<svg><use href="icons.svg#i-xxx">`，
   图标走 `currentColor` 跟着文字变色，hover/选中时透明度从 .82 提到 1。
   宽度 1080–901px 之间收紧 padding 和字号，避免 5 项把导航挤满。

## 为什么这么改

- **为什么用 `stamps` 而不是新写接口**：`GET /api/tour/stamps` 早就返回了已打卡点位的
  `stamp` / `stampIcon` / `spotName`，「我的」页原本就在用它算 `collected`。
  墙只是换个渲染方式，不需要动后端。
- **为什么 `openVillageMap()` 要手工压栈**：`villageMap` 现在是顶层视图，`go()` 会清栈；
  但点位/商品/订单详情里的「看全图」是「再进一层」，必须压栈，
  否则从详情看完全图按返回会掉到打卡页而不是回详情页。
  所以 `openVillageMap` 里改成 `viewStack.push('villageMap')` + 赋值 + `onEnter`。
- **为什么菜单项名改成「打卡集章」**：`menus` 里原本叫「我的印章墙」，
  与新增的「我的集章墙」卡片重名，进页面看到两个「印章墙」很困惑，
  改成动作向的「打卡集章 / 去点位打卡，集齐全部印章」。

## 自检

- `tools/build.ps1` → `dist/datong-cloud-server.jar` 24.5 MB
- `tools/deploy.ps1 restart`（后台 job）→ 服务 8082，health `{ok:true,status:"UP"}`
- `node tools/smoke-test.js 8082` → **160 通过 / 0 失败**
- `node tools/browser-check.js 8082` → **79 通过 / 0 失败**（截图 20 张重写 `docs/screenshots/`）
- `node tools/deploy-config-test.js` → 36 通过 / 0 失败
- `node tools/normalize-scripts.js --check` → 通过
- 临时探针（headless Chrome + CDP）实测：
  - 导航 5 项、每项 svg 17×17、gap 7px、x 坐标 191/274/357/469/552 间距均匀
  - `我的`：`hasWall=true, wallStamps=3, stamps=3, kpi=false, gone=[]`
  - 点导航「村庄地图」→ `view='villageMap'`、48 个标记、`viewStack=[]`；
    页面返回键 → `spots`（PARENT_VIEW 兜底）
  - 打卡页 `.spot-head-tools` 只剩「点位 / 印章墙」，`.spot-seal` 仍为 3
  - 无 JS 异常、无 4xx/5xx

`browser-check.js` 也同步更新了断言（**只换契约，没有降低强度**）：

- 「我的」页新增四条：集章墙存在且 `wallStamps === stamps`（读到数据并渲染成印章）、
  `.view-enter > .kpi` 不存在（三格已删）、四个被删入口文案不出现。
- 新增桌面导航断言：5 项且顺序为 首页/打卡/村庄地图/商城/我的、每项有 svg 且实测宽度 ≥12、
  点「村庄地图」后 `vm.view === 'villageMap'`。
- 新增「打卡页已移除村庄地图按钮」断言。

## 死胡同

- **导航图标断言一开始写在移动端 430×932 区块里，全部为 0**
  （`.nav-links` 在 ≤900px 是 `display:none`，`getBoundingClientRect().width` 恒为 0）。
  挪到 1440×900 的桌面区块才量到 17px。以后凡是量顶部导航的尺寸，必须放桌面视口。
- **试过用 sed 直接把 `_shot.js` 改成只截地图页**，正则把 `return` 干掉导致
  `SyntaxError: Unexpected token 'return'`。最后是读原文件、按 `const mapEntry` 切掉尾段、
  重新拼一份新探针才跑通。

## 遗留

- `orderCount` / `spent` 两个 computed 现在没有模板引用了（KPI 已删），
  保留是因为无害；后续若要清理可一并删掉。
- 集章墙当前一次全量展示（最多 14 枚），若将来点位数大幅增加，需要加分页或折叠。
