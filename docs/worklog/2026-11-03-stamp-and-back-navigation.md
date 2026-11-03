# 2026-11-03 印章显示与返回来源页

## 做了什么

1. **修「观山印章」不显示**
   - `db/schema.sql`：`stamps.stampIcon` 由 `VARCHAR(8)` 改为 `VARCHAR(32)`（与 `spots.stampIcon` 同宽）。
   - `db/DatabaseBootstrap.java`：新增 `ensureColumnWidth()`（只在列容量不足时 `ALTER ... MODIFY`，够宽则跳过）
     与 `repairTruncatedStampIcons()`（只把「严格前缀」的历史截断值用点位图标覆盖回来）。
   - `service/TourService.java`、`service/AdminService.java`：印章列表改为「点位图标优先」，印章行里的值只作兜底。
   - `static/assets/js/spot-icons.js`：`iconOf()` 增加 `isKnown()` 白名单校验，未知的 `i-xxx` 不再原样输出，
     继续走「单字 → 点位 id → 类型」的兜底链，避免再出现「指向不存在的 symbol」的空白图标。
2. **返回逻辑改为来源页优先**（`static/visitor/js/visitor.js`）
   - `go()` 下钻时若返回栈为空，先把**当前所在页**压栈当来源页，再压目标页；
     栈非空时不动（栈顶本就是来源页）。`PARENT_VIEW` 退化成「栈空兜底」。
   - `PARENT_VIEW.villageMap` 由 `spots` 改为 `home`：地图已是顶层 Tab，与其它 Tab 的兜底口径一致。
3. **扇形图完成态**
   - `visitor/index.html`：扇区改用 `.seg-on / .seg-off` class + `data-on` 属性；完成时给 `.ring`、`.ring-num`、`.ring-wrap` 加 `done`。
   - `visitor/js/visitor.js`：新增 `ringDone` computed（`collected >= total`）。
   - `visitor/css/visitor.css`：点亮段纯白、未点亮段半透明白；`.ring.done` 转金色 `#FFD46A` + 外发光 + 轻微呼吸；
     `prefers-reduced-motion` 下关掉呼吸动画。
   - `tools/browser-check.js`：扇形图「点亮段数」判定由读 `fill` 颜色改为读 `data-on="1"`，
     三条硬断言（段数=总数、点亮数=已打卡数、无退化路径且有尺寸）保持不变。

## 为什么这么改

- **印章空白不是前端渲染问题**：`GET /api/tour/stamps` 里 13 枚图标完整、只有 `sp3` 返回 `i-mounta`，
  而同一点位在 `GET /api/tour/spots` 里是完整的 `i-mountain` —— 差异只可能来自落库时的截断。
  查 `information_schema` 确认 `stamps.stampIcon` 是 `VARCHAR(8)`，而图标 key 长 10 个字符，MySQL 静默截断。
  只改 `schema.sql` 对已存在的表无效（`CREATE TABLE IF NOT EXISTS` 不会改列），所以补了幂等加宽 + 数据修复，
  老库升级后自动恢复，不需要手工执行 SQL。
- **返回目标必须跟着来路走**：旧实现只记「子页面链」，而顶层 Tab 一进入就清空栈，
  于是「地图 → 点位详情」这种从顶层页直接下钻的场景，栈里只剩一层，返回只能落到 `PARENT_VIEW` 的死规定
  （点位回打卡页），与用户来路不符。把来源页压进栈，等于让每条入口自动获得正确的返回目标，
  `PARENT_VIEW` 只剩兜底职责，不用给每个入口写分支。
- **「全打卡后全暗」是同色叠加造成的**：未打卡时未点亮段是浅灰 `surface-3`、点亮段是品牌色，
  在品牌色渐变底上浅灰反而更显眼；集满后整圈变成品牌色实心，和背景同色，视觉上就是「暗下去」。
  把点亮段改成白色、完成态转金色，等于给「进度」和「完成」各一套独立的视觉语言。

## 自检

- `tools/build.ps1`：成功，`dist/datong-cloud-server.jar` 24.5 MB。
- `tools/deploy.ps1 start`：重启成功，启动日志出现
  `[db] 已把 stamps . stampIcon 加宽到 32 字符`、`[db] 已修复 2 条被截断的印章图标`。
- `node tools/smoke-test.js 8080`：通过 160 项，失败 0 项。
- `node tools/browser-check.js 8080`：通过 79 项，失败 0 项，截图重写 `docs/screenshots/`（20 张）。
- `node tools/deploy-config-test.js`：通过 36 项，失败 0 项；`node tools/normalize-scripts.js --check`：通过。
- 实机探针（headless Chrome，1440×900，全程无 JS 异常、无 4xx/5xx）：
  - 印章墙 `stamps=14 / wallCards=14`，14 枚图标全部命中图标集，
    `观山印章 → i-mountain`，`<svg>` 实测 36×36 有实际尺寸（不再是空白）。
  - 返回：地图→点位 / 商品 / 活动详情 返回均为 `villageMap`；首页→商品返回 `home`；
    商城→商品返回 `shop`；打卡页→点位详情返回 `spots`；点位详情→看全图→返回 `spotDetail`。
  - 扇形图（14/14）：`segs=14 on=14 off=0`，`ringDone=true`，点亮段计算色 `rgb(255,212,106)`，
    `.ring/.ring-num/.ring-wrap` 都带 `done`，`.ring-note` 为「已集 14 枚 · 已集齐全部印章，恭喜通关」。

## 死胡同

- 探针一开始用 `--user-data-dir=logs/_p-profile`（相对路径）启动 Chrome，DevTools 拒绝：
  *"DevTools remote debugging requires a non-default data directory"*，一直连不上调试端口。
  必须传**绝对路径**（`path.join(ROOT, 'logs', '_p-profile')`）才起得来。
- 想过直接改 `schema.sql` 就完事，但 `CREATE TABLE IF NOT EXISTS` 不改已有表，
  演示库已经是 `VARCHAR(8)`，改脚本对现有环境零效果 —— 必须配 `DatabaseBootstrap` 的幂等迁移。
- 探针里想「临时把 stamps 清空」验证未完成态配色，但 Vue 2 对 computed 依赖的数组重新赋值后
  `ringSegments` 会重算，而本次只用来观察颜色，不影响结论；真正的未完成态配色由 browser-check
  的新账号（collected=0）截图确认。

## 遗留

- 印章图标白名单 `KNOWN` 是手写的：以后 `assets/img/icons.svg` 新增 symbol 时，
  要同步补进 `static/assets/js/spot-icons.js` 的 `KNOWN` 数组，否则新图标会被兜底链替换成 `i-stamp`。
- 返回栈只存在内存里，刷新页面后回到首页 —— 这是有意为之（项目没有前端路由），不打算改成 URL 路由。
