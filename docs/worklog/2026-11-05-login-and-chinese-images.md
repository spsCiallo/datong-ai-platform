# 2026-11-05 登录页重设计与中国化配图

## 做了什么

1. **登录页重设计**：把 `static/visitor/index.html` 的登录区从「左图右表单」的松散布局改为有明确比例的
   `1.25 : 1` 栅格，表单卡片固定 `max-width: 396px`、内边距 30/32、圆角 20px；输入框统一 44px 高、
   按钮 46px；标签页按钮 40px。新增三档断点：
   - `≥1181px`：左图右表单，`minmax(0,1.25fr) / minmax(0,1fr)`
   - `901–1180px`：左右等分，卡片收窄到 368px
   - `≤900px`：图变顶部 190px 横幅 + 下方表单卡片（最大 460px）
2. **登录页左侧换成真实村庄照片**：`hero.svg`（程序化插画）替换为 `assets/img/photo/village-hero.jpg`
   （江西古村实景），并新增 `.auth-veil` 双层暖色渐变遮罩，保证白色标题与卖点文字在任何照片上都可读。
   同时删除了底部的「游客端 · 电脑手机共用一套界面 · 大同村农商文旅智慧平台」这行说明文字。
3. **全站配图中文化**：把 41 个图片主题（14 点位 + 24 商品 + 3 张登录页横幅）从原先「外国场景照片」
   换成中国村庄 / 农产品 / 农事 / 民俗的真实照片。数据来源为 Wikimedia Commons 的分类
   （Villages in China、Farms in China、Rice terraces in China、Agriculture in China、
   Hemerocallis citrina、Markets in China、Cuisine of Shanxi、Food of China、Chinese paper cutting 等）。
   每个主题仍是三张（主图 / -b / -c），统一裁切 4:3、1000×750、JPEG q82。

## 为什么这么改

- 原始登录页的左右比例是 1.15:1，卡片 `max-width: 400px` 但输入框没有固定高度，宽屏下表单显得又扁又长、
  窄屏下图占满一屏把表单挤到下面。改成固定比例的栅格 + 固定宽度卡片后，三档视口下输入框长度都落在
  320–396px 这个舒服区间。
- 左侧原来是 SVG 插画，和「大同村农商文旅」这个真实村落主题不匹配。换成实景照片更有说服力，但照片明暗
  不可控，所以必须叠一层遮罩，否则白色标题在浅色天空上会看不见。
- 上一轮虽然把配图从插画换成了照片，但选图时以「语义匹配」为主，没限制地域，结果抓到大量外国场景
  （英国农田、印度铜工坊、希腊磨石、塞内加尔小米、俄罗斯酒店、日本游客中心等）。答辩演示时这些
  一眼就能看出不是中国乡村，因此本轮按「必须是中国场景」重新选图。

## 死胡同

- **Commons 检索会命中 djvu/pdf 扫描书**：第一次按「黄花菜 田 中国」检索，返回的全是《建国方略》的
  扫描页（CADAL 系列），下载后 PIL 打不开。必须按 `imageinfo.mime` 只收 `image/jpeg`，并额外过滤
  `.djvu/.pdf/.svg/.tif` 后缀。
- **标题含地名不代表画面合格**：`goods-room` 抓到「重庆大厦廉价旅馆」、`goods-tiger` 抓到「佛山炖汤店招牌」、
  `spot-camp` 抓到 1894 年历史照片、`goods-suite` 抓到邓小平旧居与深圳博物馆天井、`goods-mill-class`
  抓到希腊/Celtic 磨石、`spot-copper` 抓到青铜兵器。必须逐张目检。
- **用关键词计分自动分派不可靠**：写了一个按正向/负向关键词打分的 `pick.py`，结果 `goods-farm`
  和 `goods-pick` 都指向同一组梯田、`goods-thresh` 指向澳洲 CSIRO 农场。最终改为按分类小池人工指定。
- **一次跑 30+ 主题必超时**：单次 `run_code` 上限 560 秒，Commons API 每次限速 0.2–0.3 秒，
  必须分批（每批 9–21 个 key）。
- **`tools/build.ps1` 报错但 build.log 为空**：脚本提示「检测到服务正在运行（进程号 xxx），先停止它以释放
  jar 文件」后失败，实际是它启动子进程的方式在当前执行环境里拿不到干净的 PATH。直接跑
  `mvn -o -f server/pom.xml clean package -DskipTests` 反而 11.7 秒就 BUILD SUCCESS。
- **`tools/deploy.ps1 start` 在本执行环境里找不到 Java**（报「没有找到 Java」并把浏览器打开到 Adoptium 下载页），
  因为执行环境的 `PATH` 不含 JDK。改为直接用 `Start-Process` 拉起
  `jdk-17.0.20.101-hotspot\bin\java.exe -jar dist\datong-cloud-server.jar` 即可，启动后 3 秒内 health 返回 UP。

## 自检

- `mvn -o -f server/pom.xml clean package -DskipTests`：BUILD SUCCESS，45 个源文件，产物 45,017,202 字节，
  已同步到 `dist/datong-cloud-server.jar`。
- `node tools/smoke-test.js 8080`：**160 项通过，0 失败**（含全部图片引用存在性校验）。
- `node tools/browser-check.js 8080`：**79 项通过，0 失败**，20 张截图重写 `docs/screenshots/`。
- `node tools/deploy-config-test.js`：**36 项通过，0 失败**。
- `node tools/normalize-scripts.js --check`：通过。
- 静态校验：源码中图片引用 **116 个，missing 0**；`node --check static/visitor/js/visitor.js` 通过。

## 遗留

- 照片来自 Wikimedia Commons，多数为 CC BY / CC BY-SA 授权。若答辩材料需要标注来源，
  应另附一份来源清单（当前仓库未内嵌版权声明文件）。
- `goods-bird`（白鹭）、`goods-millet`（谷穗）等少数主题的候选池较窄，只能保证「中国场景 + 品类正确」，
  构图不如其它主题讲究，后续可再替换。
- 登录页的实景图 `village-hero.jpg` 目前是从 `spot-courtyard.jpg`（江西古村）复制而来，
  如需更贴近大同村（黄花台地、桑干河）的构图，需另找素材。
