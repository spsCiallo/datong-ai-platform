# 2026-11-05 真实照片与论文答辩材料

## 做了什么

1. **配图从程序化插画换成真实照片**：`static/assets/img/photo/` 新增 114 张 JPEG（38 个主题 × 3 张），
   覆盖 14 个点位、24 个商品、10 个活动的封面与图集。`tools/make-art.js` 删掉 SPOTS / GOODS 两套场景定义，
   只保留虚拟地图底图与品牌图形，并会把 `art/` 下旧的 `spot-*.svg` / `goods-*.svg` 自动清掉。
2. **引用批量改写**：`db/seed.sql`（237 处）、`db/schema.sql`（1 处）、`admin/index.html`（2 处）、
   `admin/js/admin.js`（14 处）、`merchant/js/merchant.js`（24 处）、`visitor/js/visitor.js`（5 处）、
   `tools/smoke-test.js`（1 处）里的 `/assets/img/art/<base>[-b|-c].svg` 全部指向 `/assets/img/photo/<base>[-b|-c].jpg`。
   `ShopService.DEFAULT_COVER` 同步改为 photo 路径。
3. **文档口径同步**：AGENTS.md（后端约定与前端「视觉资源分两类」）、HANDOVER.md、docs/交付清单.md、
   docs/agent-memory.md、seed.sql 头注释、admin 提示文案全部改为 photo / art 两套目录。
4. **论文扩写**：`docs/build_thesis.py` 从 531 行扩到 634 行，正文从 21 页 5114 字扩到 35 页 11022 字，
   插图从 11 张增到 20 张，新增虚拟地图、位置标注、数据结构演进等章节，并订正了全部过期数字。
5. **答辩材料**：新增 `docs/build_slides.py`（19 页 16:9 答辩 PPT）与 `docs/build_review.py`
   （4 页毕业设计评语表，含指导教师评语、评阅人评语、答辩记录、成绩评定）。

## 为什么这么改

- 早期配图是脚本参数化生成的 SVG 场景插画，风格统一但和真实村落差距大，答辩演示时说服力不足。
  换成公开图库筛选后统一裁切 4:3 的真实照片，同主题三张同源不同景别，正好撑起详情页图集。
- 图集第一张即封面的约定不变，所以换图只需替换路径，不用改任何业务逻辑。
- 论文里的自检数字（73 / 16 件商品 / 235 字段 / 22 项回归）在最近几轮迭代后都已过期，
  交付前必须与实测对齐，否则答辩时一对不上就是硬伤。
- 评语表学校没有下发模板，按常规答辩材料结构自拟，字段与成绩比例可按院系要求再调。

## 死胡同

- 直接从 Wikimedia Commons 批量下载时有 21 个文件是 djvu / svg 误命中，PIL 打不开；
  必须先用 `Image.verify()` 全量筛一遍再进入裁切流程。
- Word 打开着论文时 python-docx 保存会报 `PermissionError: [Errno 13] Permission denied`，
  必须先关掉 Word 进程。
- 统计 docx 页数时 Word COM 对中文路径会报「文档可能已损坏」，要先把文件复制到纯 ASCII 路径。
- PowerShell 脚本（含中文路径）必须带 UTF-8 BOM，否则 `-File` 执行时报 FileNotFoundException。

## 自检

- `node tools/smoke-test.js 8080` → 160 项通过，0 失败（含 114 个图片引用存在性校验）。
- `node tools/browser-check.js 8080` → 79 项通过，0 失败，20 张截图重写 `docs/screenshots/`。
- `node tools/deploy-config-test.js` → 36 项通过，0 失败。
- `node tools/normalize-scripts.js --check` → 通过。
- 引用交叉校验：referenced 114 / on disk 114 / missing 0 / unused 0。
- 数据库重灌后计数：spots=14 products=24 activities=10 orders=45 users=12，四表 `/art/` 引用为 0。

## 遗留

- 照片来自公开图库（Wikimedia Commons 等），若论文或答辩材料需要标注来源，
  可在交付说明里附一份来源清单；当前仓库内未内嵌版权声明文件。
- 虚拟地图用的是抽象坐标（0–1000 / 0–700），不是真实经纬度，接入导航需另存一套坐标。
- 评语表按通用结构自拟，正式提交前请按院系模板核对栏目与成绩比例。
