# -*- coding: utf-8 -*-
"""
大同村农商文旅智慧平台 · 毕业设计答辩 PPT 生成器
用法：python docs/build_slides.py
输出：D:/毕业设计/大同村农商文旅智慧平台答辩PPT.pptx
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from PIL import Image

ROOT = r"D:\毕业设计"
SHOT = os.path.join(ROOT, "datong-ai-platform", "docs", "screenshots")
OUT = os.path.join(ROOT, "大同村农商文旅智慧平台答辩PPT.pptx")

BRAND = RGBColor(0xC0, 0x39, 0x2B)
BRAND_D = RGBColor(0x8E, 0x25, 0x1B)
AMBER = RGBColor(0xC7, 0x7B, 0x1F)
TEAL = RGBColor(0x2E, 0x7D, 0x8F)
INK = RGBColor(0x2B, 0x23, 0x20)
GRAY = RGBColor(0x6B, 0x62, 0x59)
MUTED = RGBColor(0x9A, 0x90, 0x86)
LIGHT = RGBColor(0xF7, 0xF2, 0xEC)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LINE = RGBColor(0xE4, 0xDA, 0xD0)

FONT = "微软雅黑"
W, H = Inches(13.333), Inches(7.5)


def blank(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])


def rect(slide, x, y, w, h, fill=None, line=None, shape=MSO_SHAPE.RECTANGLE, radius=None):
    s = slide.shapes.add_shape(shape, x, y, w, h)
    if fill is None:
        s.fill.background()
    else:
        s.fill.solid()
        s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(1)
    s.shadow.inherit = False
    if radius is not None and shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = radius
    return s


def text(slide, s, x, y, w, h, size=18, color=INK, bold=False, align=PP_ALIGN.LEFT,
         anchor=MSO_ANCHOR.TOP, spacing=1.35, italic=False):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = spacing
    r = p.add_run()
    r.text = s
    r.font.name = FONT
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.italic = italic
    r.font.color.rgb = color
    return tb


def bullets(slide, items, x, y, w, h, size=17, color=INK, gap=0.16, bullet_color=BRAND):
    """items: list of str 或 (str, level)"""
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    tf.margin_bottom = 0
    first = True
    for it in items:
        txt, lvl = (it, 0) if isinstance(it, str) else it
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.line_spacing = 1.5
        p.space_after = Pt(gap * 72)
        p.level = lvl
        rb = p.add_run()
        rb.text = ("▪  " if lvl == 0 else "·  ")
        rb.font.name = FONT
        rb.font.size = Pt(size if lvl == 0 else size - 2)
        rb.font.color.rgb = bullet_color if lvl == 0 else MUTED
        r = p.add_run()
        r.text = txt
        r.font.name = FONT
        r.font.size = Pt(size if lvl == 0 else size - 2)
        r.font.color.rgb = color if lvl == 0 else GRAY
    return tb


def head(slide, kicker, title, sub=None):
    """内容页统一页头：左侧色条 + 小标 + 大标题"""
    rect(slide, Inches(0.9), Inches(0.62), Inches(0.09), Inches(1.02), fill=BRAND)
    text(slide, kicker, Inches(1.14), Inches(0.6), Inches(6), Inches(0.34), 13, BRAND, True)
    text(slide, title, Inches(1.14), Inches(0.92), Inches(10.6), Inches(0.72), 30, INK, True)
    if sub:
        text(slide, sub, Inches(1.16), Inches(1.62), Inches(10.4), Inches(0.34), 14, MUTED)
    rect(slide, Inches(0.9), Inches(7.0), Inches(11.53), Inches(0.012), fill=LINE)
    text(slide, "大同村农商文旅智慧平台", Inches(0.9), Inches(7.06), Inches(8), Inches(0.3), 11, MUTED)


def pic(slide, name, x, y, max_w, max_h, caption=None, border=True):
    path = os.path.join(SHOT, name)
    if not os.path.exists(path):
        return
    with Image.open(path) as im:
        iw, ih = im.size
    ratio = min(max_w / iw, max_h / ih)
    w, h = int(iw * ratio), int(ih * ratio)
    px = int(x + (max_w - w) / 2)
    py = int(y + (max_h - h) / 2)
    if border:
        pad = Inches(0.05)
        rect(slide, px - pad, py - pad, w + pad * 2, h + pad * 2, fill=WHITE, line=LINE)
    slide.shapes.add_picture(path, px, py, w, h)
    if caption:
        text(slide, caption, x, y + max_h + Inches(0.06), max_w, Inches(0.3), 11.5, MUTED, align=PP_ALIGN.CENTER)


def stat(slide, x, y, num, label, unit="", w=Inches(2.4)):
    rect(slide, x, y, w, Inches(1.42), fill=LIGHT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12)
    tb = slide.shapes.add_textbox(x, y + Inches(0.18), w, Inches(0.62))
    tf = tb.text_frame
    tf.margin_left = 0; tf.margin_right = 0; tf.margin_top = 0; tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r1 = p.add_run(); r1.text = num
    r1.font.name = FONT; r1.font.size = Pt(32); r1.font.bold = True; r1.font.color.rgb = BRAND
    if unit:
        r2 = p.add_run(); r2.text = " " + unit
        r2.font.name = FONT; r2.font.size = Pt(13); r2.font.color.rgb = GRAY
    text(slide, label, x, y + Inches(0.9), w, Inches(0.36), 12.5, GRAY, align=PP_ALIGN.CENTER)


def build():
    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H

    # ============ 1 封面 ============
    s = blank(prs)
    rect(s, 0, 0, W, H, fill=BRAND)
    rect(s, 0, 0, Inches(0.34), H, fill=BRAND_D)
    # 装饰
    rect(s, Inches(11.4), Inches(-1.2), Inches(3.4), Inches(3.4), fill=RGBColor(0xD0, 0x51, 0x42), shape=MSO_SHAPE.OVAL)
    rect(s, Inches(10.2), Inches(5.6), Inches(2.6), Inches(2.6), fill=RGBColor(0xCF, 0x4C, 0x3D), shape=MSO_SHAPE.OVAL)

    text(s, "2026 届毕业设计（论文）答辩", Inches(1.5), Inches(1.34), Inches(9), Inches(0.4), 15, RGBColor(0xF6, 0xC9, 0xC0), True)
    text(s, "大同村农商文旅", Inches(1.5), Inches(1.95), Inches(10), Inches(0.95), 46, WHITE, True)
    text(s, "智慧平台的设计与实现", Inches(1.5), Inches(2.85), Inches(10), Inches(0.95), 46, WHITE, True)
    rect(s, Inches(1.52), Inches(3.98), Inches(1.1), Inches(0.07), fill=RGBColor(0xF5, 0xC5, 0x18))
    text(s, "以「一台电脑当服务器」的方式，把点位打卡、农产商城、研学民宿预约、",
         Inches(1.5), Inches(4.28), Inches(9.6), Inches(0.36), 15, RGBColor(0xF9, 0xE2, 0xDC))
    text(s, "虚拟地图、客服聊天与 AI 导览装进一套可在村里落地的系统",
         Inches(1.5), Inches(4.66), Inches(9.6), Inches(0.36), 15, RGBColor(0xF9, 0xE2, 0xDC))

    info = [
        ("学院 / 专业", "机电信息学院 · 软件技术"),
        ("班级", "2024 级软件技术 1 班"),
        ("姓名 / 学号", "帅鹏山 / 246230119"),
        ("指导教师", "李敏"),
    ]
    yy = 5.5
    for i, (k, v) in enumerate(info):
        col = i // 2
        row = i % 2
        xx = Inches(1.5) + col * Inches(4.3)
        yv = Inches(yy) + row * Inches(0.52)
        text(s, k, xx, yv, Inches(1.7), Inches(0.3), 12, RGBColor(0xF2, 0xB8, 0xAD))
        text(s, v, xx + Inches(1.7), yv - Inches(0.045), Inches(2.5), Inches(0.34), 15, WHITE, True)
    text(s, "2026 年 10 月", Inches(1.5), Inches(6.62), Inches(4), Inches(0.3), 13, RGBColor(0xF2, 0xB8, 0xAD))

    # ============ 2 目录 ============
    s = blank(prs)
    head(s, "CONTENTS", "汇报提纲")
    items = [
        ("01", "选题背景与需求", "为什么做、给谁做、要做到什么程度"),
        ("02", "系统设计", "总体架构、技术选型、接口与数据模型"),
        ("03", "关键实现", "集章、混合结算、虚拟地图、聊天、AI"),
        ("04", "测试与部署", "三层自检体系与一键部署"),
        ("05", "总结与展望", "完成度、不足与后续迭代方向"),
    ]
    yy = Inches(1.95)
    for i, (no, t1, t2) in enumerate(items):
        y = yy + i * Inches(0.94)
        rect(s, Inches(1.0), y, Inches(0.86), Inches(0.78), fill=LIGHT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.14)
        text(s, no, Inches(1.0), y + Inches(0.17), Inches(0.86), Inches(0.5), 22, BRAND, True, align=PP_ALIGN.CENTER)
        text(s, t1, Inches(2.05), y + Inches(0.06), Inches(3.2), Inches(0.42), 21, INK, True)
        text(s, t2, Inches(2.05), y + Inches(0.48), Inches(8.4), Inches(0.32), 13, MUTED)
        if i < len(items) - 1:
            rect(s, Inches(2.05), y + Inches(0.88), Inches(9.6), Inches(0.008), fill=LINE)

    # ============ 3 背景 ============
    s = blank(prs)
    head(s, "01 / 选题背景", "村里缺的不是资源，是把资源串起来的那根线",
         "大同村：桑干河畔、黄花台地，14 个点位、6 家商户、10 场活动，资源分散在各自的本子里")
    bullets(s, [
        "纸质导览让点位讲解停留在牌子上，游客走一路、看不懂一路",
        "商品销售靠线下集市，研学与民宿靠电话登记，谁订了、订到哪天全靠人工记",
        "打卡、消费、评价之间没有沉淀，经营方看不到「谁来过、喜欢什么」",
        "村一级预算有限：不能长期付云服务费，也没有专职运维",
    ], Inches(1.0), Inches(2.25), Inches(5.6), Inches(3.4), 16.5)
    # 右侧对比卡
    rect(s, Inches(7.1), Inches(2.2), Inches(5.3), Inches(1.55), fill=LIGHT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
    text(s, "传统做法", Inches(7.45), Inches(2.42), Inches(4.6), Inches(0.32), 14, MUTED, True)
    text(s, "牌子 + 纸质手册 + 微信群 + 电话本", Inches(7.45), Inches(2.82), Inches(4.7), Inches(0.4), 19, INK, True)
    rect(s, Inches(7.1), Inches(4.0), Inches(5.3), Inches(1.9), fill=RGBColor(0xFB, 0xEE, 0xEB), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
    text(s, "本平台", Inches(7.45), Inches(4.2), Inches(4.6), Inches(0.32), 14, BRAND, True)
    text(s, "一套响应式页面 + 一张手绘地图", Inches(7.45), Inches(4.58), Inches(4.8), Inches(0.4), 19, INK, True)
    text(s, "双击一个脚本就能在本机跑起来", Inches(7.45), Inches(5.05), Inches(4.8), Inches(0.4), 15, GRAY)

    # ============ 4 需求 / 角色 ============
    s = blank(prs)
    head(s, "01 / 需求分析", "三类角色，三套入口，一套数据", "权限在拦截器与注解两层校验，会话落库而非存前端")
    roles = [
        ("游客 buyer", "/visitor/", "点位打卡 · 商城下单 · 预约 · AI · 聊天 · 举报", BRAND),
        ("商户 merchant", "/merchant/", "商品与图集 · 接单发货 · 入住办理 · 客服 · 营收", AMBER),
        ("管理员 admin", "/admin/", "账号 · 订单商品总览 · 内容与坐标 · 举报 · 服务器", TEAL),
    ]
    for i, (name, path, desc, color) in enumerate(roles):
        x = Inches(0.95) + i * Inches(3.95)
        rect(s, x, Inches(2.25), Inches(3.6), Inches(2.5), fill=WHITE, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.07)
        rect(s, x, Inches(2.25), Inches(3.6), Inches(0.11), fill=color)
        text(s, name, x + Inches(0.3), Inches(2.55), Inches(3.0), Inches(0.42), 20, INK, True)
        text(s, path, x + Inches(0.3), Inches(2.98), Inches(3.0), Inches(0.3), 12.5, MUTED)
        text(s, desc, x + Inches(0.3), Inches(3.4), Inches(3.0), Inches(1.2), 14, GRAY, spacing=1.6)
    text(s, "非功能要求：只依赖 JDK 17 + MySQL ｜ 前端零 CDN ｜ AI 可降级 ｜ 订单不可物理删除",
         Inches(0.95), Inches(5.05), Inches(11.5), Inches(0.36), 14.5, BRAND, True)
    text(s, "游客端是同一套代码：≥900px 顶部导航 + 多栏，<900px 底部 Tab + 单栏，不拆两套页面",
         Inches(0.95), Inches(5.48), Inches(11.5), Inches(0.36), 14.5, GRAY)

    # ============ 5 架构 ============
    s = blank(prs)
    head(s, "02 / 系统设计", "单体架构：一次部署，三端共用", "一个 Spring Boot 进程同时承担接口、静态托管、数据库自举与局域网发现")
    chain = ["浏览器", "AuthInterceptor", "Controller", "Service", "Db 门面", "MySQL"]
    x = Inches(0.95)
    for i, c in enumerate(chain):
        w = Inches(1.62) if i != 1 else Inches(2.0)
        rect(s, x, Inches(2.3), w, Inches(0.86), fill=WHITE if i % 2 else LIGHT, line=LINE,
             shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12)
        text(s, c, x, Inches(2.5), w, Inches(0.42), 13.5, INK, True, align=PP_ALIGN.CENTER)
        if i < len(chain) - 1:
            text(s, "›", x + w + Inches(0.02), Inches(2.4), Inches(0.24), Inches(0.5), 20, MUTED, align=PP_ALIGN.CENTER)
        x += w + Inches(0.28)
    cards = [
        ("为什么不做微服务", "功能边界清晰但耦合不重，多进程只增加部署与排障成本；单进程才有「一键部署 + 数据库自举」"),
        ("数据访问", "Spring JDBC + Db 门面统一生成 SQL，列名走 Tables 白名单，降低注入面"),
        ("会话", "落库 sessions 表而非 JWT，后台可立即吊销，默认 8 小时"),
        ("前端", "Vue 2.7 + Element UI 2.15 本地化，零构建，改完刷新即生效"),
    ]
    for i, (t1, t2) in enumerate(cards):
        col, row = i % 2, i // 2
        x = Inches(0.95) + col * Inches(5.9)
        y = Inches(3.65) + row * Inches(1.55)
        rect(s, x, y, Inches(5.5), Inches(1.34), fill=LIGHT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
        text(s, t1, x + Inches(0.28), y + Inches(0.18), Inches(4.9), Inches(0.34), 15, BRAND, True)
        text(s, t2, x + Inches(0.28), y + Inches(0.58), Inches(4.95), Inches(0.66), 12.5, GRAY, spacing=1.45)

    # ============ 6 技术选型 / 规模 ============
    s = blank(prs)
    head(s, "02 / 技术选型", "选型的标准是「能不能在村里稳定跑三年」")
    stat(s, Inches(0.95), Inches(2.2), "13", "个控制器", "个", Inches(2.5))
    stat(s, Inches(3.6), Inches(2.2), "105", "个接口端点", "个", Inches(2.5))
    stat(s, Inches(6.25), Inches(2.2), "18", "张数据表", "张", Inches(2.5))
    stat(s, Inches(8.9), Inches(2.2), "242", "个物理字段", "个", Inches(2.5))
    bullets(s, [
        "后端 Spring Boot 3.3.5 + Java 17，单 fat jar，端口由 PortGuard 锁定（防 SERVER_PORT 劫持）",
        "数据 MySQL 9.6，InnoDB + utf8mb4，无外键，引用完整性由业务层保证",
        "图表用原生 SVG 手写而非图表库：体积小，且能实时读 CSS 变量换色",
        "二维码 ZXing 本地生成；语音用浏览器 speechSynthesis，零成本、断网可用",
        "AI 为可选增强：未配密钥走本地知识库，调用失败回落原文，全程不向用户报错",
    ], Inches(0.95), Inches(4.0), Inches(11.4), Inches(2.7), 15)

    # ============ 7 数据模型 ============
    s = blank(prs)
    head(s, "02 / 数据模型", "18 张表：账号、文旅、交易、辅助四类",
         "字符串主键 + seq 自增序 + VARCHAR 时间 + 图片存相对路径")
    groups = [
        ("账号", ["users 游客", "merchants 商户", "admins 管理员", "sessions 会话"], BRAND),
        ("文旅", ["spots 点位", "stamps 打卡", "activities 活动", "activityBookings 报名"], AMBER),
        ("交易", ["products 商品", "orders 订单", "settlements 结算", "orderLogs 日志"], TEAL),
        ("辅助", ["chatMessages / chatTyping", "reports 举报", "notifications 通知", "knowledge / settings"], GRAY),
    ]
    for i, (name, rows, color) in enumerate(groups):
        x = Inches(0.95) + i * Inches(3.02)
        rect(s, x, Inches(2.18), Inches(2.75), Inches(2.85), fill=WHITE, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.07)
        rect(s, x, Inches(2.18), Inches(2.75), Inches(0.5), fill=color, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.07)
        text(s, name, x, Inches(2.27), Inches(2.75), Inches(0.32), 14, WHITE, True, align=PP_ALIGN.CENTER)
        tb = s.shapes.add_textbox(x + Inches(0.22), Inches(2.86), Inches(2.4), Inches(2.0))
        tf = tb.text_frame; tf.word_wrap = True
        tf.margin_left = 0; tf.margin_right = 0; tf.margin_top = 0; tf.margin_bottom = 0
        for j, r in enumerate(rows):
            p = tf.paragraphs[0] if j == 0 else tf.add_paragraph()
            p.line_spacing = 1.5
            run = p.add_run(); run.text = r
            run.font.name = FONT; run.font.size = Pt(12); run.font.color.rgb = GRAY
    rect(s, Inches(0.95), Inches(5.3), Inches(11.5), Inches(1.45), fill=LIGHT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.07)
    text(s, "两个刻意的取舍", Inches(1.25), Inches(5.48), Inches(4), Inches(0.32), 14, BRAND, True)
    text(s, "① orders 用 39 个扁平字段承载全流程状态机，不额外拆状态表——订单是交易凭证，字段多是确定的代价，可读性比第三范式更重要。",
         Inches(1.25), Inches(5.85), Inches(10.9), Inches(0.32), 13, GRAY)
    text(s, "② images 图集用 JSON 一列而不是图片表——只在详情页整体展示、不按图查询，一列换掉一张关联表，约定数组第一张即封面。",
         Inches(1.25), Inches(6.22), Inches(10.9), Inches(0.32), 13, GRAY)

    # ============ 8 订单状态机 ============
    s = blank(prs)
    head(s, "02 / 核心业务", "订单状态机：把「完成」和「结算」绑在一起", "商家与管理员无权把订单置为已完成，完成权只属于买家")
    flow = [("待确认", "pending"), ("已确认", "confirmed"), ("已发货", "shipped"), ("已完成", "completed")]
    x = Inches(0.95)
    for i, (t1, t2) in enumerate(flow):
        rect(s, x, Inches(2.2), Inches(2.3), Inches(1.0), fill=WHITE, line=BRAND if i == 3 else LINE,
             shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.12)
        text(s, t1, x, Inches(2.36), Inches(2.3), Inches(0.34), 16, INK, True, align=PP_ALIGN.CENTER)
        text(s, t2, x, Inches(2.74), Inches(2.3), Inches(0.28), 11, MUTED, align=PP_ALIGN.CENTER)
        if i < 3:
            text(s, "→", x + Inches(2.32), Inches(2.42), Inches(0.4), Inches(0.4), 18, MUTED, align=PP_ALIGN.CENTER)
        x += Inches(2.72)
    text(s, "民宿：确认后 → 已入住 checked_in　　研学 / 农事体验：确认后即可完成", Inches(0.95), Inches(3.4), Inches(11), Inches(0.32), 13, GRAY)
    bullets(s, [
        "商家拒绝不直接关单：写入拒绝原因并停在 pending，由买家选择同意关闭或继续协商",
        "完成订单的唯一入口是买家确认收货，完成与货款结算在同一动作内发生并保证幂等",
        "退款不回滚库存；已结算订单退款时追加负数流水，冲减商户已结算金额",
    ], Inches(0.95), Inches(3.95), Inches(11.2), Inches(1.6), 15)
    rect(s, Inches(0.95), Inches(5.7), Inches(11.5), Inches(0.95), fill=RGBColor(0xFB, 0xEE, 0xEB), shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
    text(s, "为什么这样设计：避免「订单已完成但没结算」和「已结算但订单被改」两种对账黑洞；状态迁移的每一次变化都写 orderLogs，事后可追溯。",
         Inches(1.25), Inches(5.95), Inches(10.9), Inches(0.5), 13.5, BRAND_D)

    # ============ 9 游客端：首页与集章 ============
    s = blank(prs)
    head(s, "03 / 关键实现", "集章：把「打卡」做成可积累的东西", "纯 SVG 扇形图，段数由服务端点位总数驱动")
    pic(s, "visitor-02-home.png", Inches(0.95), Inches(2.15), Inches(3.0), Inches(4.3), "首页：集章进度 + 功能宫格")
    pic(s, "visitor-03-spots.png", Inches(4.35), Inches(2.15), Inches(3.0), Inches(4.3), "点位卡片：已打卡盖朱砂印章")
    pic(s, "visitor-04-spot-detail.png", Inches(7.75), Inches(2.15), Inches(3.0), Inches(4.3), "详情：讲解 + 语音 + 内嵌地图")
    rect(s, Inches(0.95), Inches(6.5), Inches(11.4), Inches(0.42), fill=LIGHT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.2)
    text(s, "同一游客同一点位唯一键约束，重复打卡返回 repeated 而非报错 ｜ 点亮判定用点位自带 checked，扇区数用服务端总数",
         Inches(1.2), Inches(6.56), Inches(11.0), Inches(0.3), 11.5, GRAY)

    # ============ 10 商城与混合结算 ============
    s = blank(prs)
    head(s, "03 / 关键实现", "混合结算：购物车里既有实物又有预约", "一次提交允许部分成功，warnings 逐项提示失败原因")
    pic(s, "visitor-05-shop.png", Inches(0.95), Inches(2.1), Inches(2.75), Inches(3.9), "商城：分类筛选与加购")
    pic(s, "visitor-07-product-detail.png", Inches(3.95), Inches(2.1), Inches(2.75), Inches(3.9), "商品详情：图集 + 介绍段落")
    bullets(s, [
        "只有农产文创能进购物车；研学 / 民宿 / 农事体验必须走详情页预约，后端做同样的分类校验",
        "购物车按端与账号隔离存在本机，换账号不串车",
        "结算页按商品逐项出表单互不覆盖；民宿按晚数、预约按人数、实物按数量",
        "请求体 items 每项可带自己的 bookDate、people、roomType、bookingSlot、address",
    ], Inches(7.0), Inches(2.25), Inches(5.4), Inches(3.6), 14.5)
    rect(s, Inches(7.0), Inches(5.35), Inches(5.35), Inches(1.15), fill=LIGHT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
    text(s, "为什么要混合结算", Inches(7.28), Inches(5.5), Inches(4.8), Inches(0.3), 13, BRAND, True)
    text(s, "游客一次出行往往同时买特产、订民宿、约研学；分成三个流程会让人半路放弃。",
         Inches(7.28), Inches(5.82), Inches(4.9), Inches(0.55), 12.5, GRAY)

    # ============ 11 虚拟地图 ============
    s = blank(prs)
    head(s, "03 / 关键实现", "虚拟地图：抽象坐标，手绘底图，一处维护四处用",
         "不接真实经纬度、不依赖在线地图与密钥，村级场景反而更好用")
    pic(s, "visitor-19-village-map.png", Inches(0.95), Inches(2.05), Inches(7.4), Inches(4.4), "大同村虚拟地图：48 个位置 · 6 类筛选 · 可缩放拖拽")
    bullets(s, [
        "坐标系：村落俯视归一化为 1000×700，x 0–1000 / y 0–700 存库",
        "标记固定像素、按 1/scale 反向缩放——放大后不会被拉成巨幅图钉",
        "组件对外只暴露 pick / select / input 三个事件",
        ("游客端地图整页、点位详情内嵌小图、商户选点、管理端选点", 1),
        ("同一个组件四处复用，改一次全部生效", 1),
        "农产文创是快递发货，不用位置，界面也不显示地图",
    ], Inches(8.6), Inches(2.15), Inches(3.85), Inches(4.2), 13.5)

    # ============ 12 聊天 ============
    s = blank(prs)
    head(s, "03 / 关键实现", "客服聊天：卡片能被点开，归属由服务端守", "商品卡必须属于该商家，订单卡必须同时属于该商家与该买家")
    pic(s, "visitor-16-chat-style.png", Inches(0.95), Inches(2.1), Inches(6.6), Inches(3.7), "游客端独立聊天页：左侧会话列表，右侧带头像与时间的消息流")
    bullets(s, [
        "消息类型：文本 / 图片 / 商品卡 / 订单卡，图片前端压到 400KB 内再入库",
        "聊天页做成两栏，一个页面里能切换多个商家，不必反复退出重进",
        "服务端落库时补商品与订单快照，商品下架后历史卡片仍能显示",
        "输入中状态 4 秒有效，前端 2 秒最多上报一次，不做高频轮询",
        "举报闭环：提交 → 管理员处理 → 商家上诉 → 复核，结果走通知表",
    ], Inches(7.85), Inches(2.15), Inches(4.6), Inches(3.6), 14)

    # ============ 13 AI ============
    s = blank(prs)
    head(s, "03 / 关键实现", "AI 导览：宁可说「资料里没有」，也不编", "未配密钥时全部走本地知识库，调用失败自动回落原文")
    pic(s, "visitor-10-ai-ask.png", Inches(0.95), Inches(2.1), Inches(2.7), Inches(3.9), "知识库命中并标注来源")
    pic(s, "visitor-12-plan.png", Inches(3.85), Inches(2.1), Inches(2.7), Inches(3.9), "行程规划：时间轴 + 可预约项")
    bullets(s, [
        "检索：问题分词后在 knowledge 表做关键词匹配，取 Top-N 条目作为上下文",
        "未命中就明确说资料中没有，并把建议提问方向告诉用户",
        "命中时给出知识条目来源，可核对，不把模型输出当作事实",
        "行程规划按天数 / 人数 / 偏好生成时间轴、可预约项目与花费预估，项目可直接点进详情下单",
        "输入框固定在页面底部，长回答不把输入框顶出视口",
    ], Inches(6.9), Inches(2.15), Inches(5.5), Inches(3.8), 14)

    # ============ 14 商户端 & 管理端 ============
    s = blank(prs)
    head(s, "03 / 关键实现", "商户端与管理端：位置和图片都能自己改", "把「录入位置」这件事从开发者手里交给经营者")
    pic(s, "merchant-05-chat-layout.png", Inches(0.95), Inches(2.1), Inches(5.4), Inches(3.3), "商户端客服会话")
    pic(s, "admin-login.png", Inches(6.7), Inches(2.1), Inches(5.4), Inches(3.3), "管理后台")
    bullets(s, [
        "商户商品弹窗：图集编辑器（增删 / 上下移 / 从已有图挑，第一张即封面）",
        "地图选点：点一下确定、再点一下取消；同时画出本店其它商品与全村点位作参照",
        "管理端内容管理：点位与活动同样可改图集与坐标，可查看已有位置",
        "服务器管理页补齐：状态对象完整默认值 + 四主题卡片的可视化预览",
    ], Inches(0.95), Inches(5.75), Inches(11.3), Inches(1.2), 13.5)

    # ============ 15 视觉与主题 ============
    s = blank(prs)
    head(s, "03 / 关键实现", "视觉：真实照片 + 四套主题 + 一处设计令牌")
    pic(s, "visitor-18-dark-theme.png", Inches(0.95), Inches(2.1), Inches(6.4), Inches(3.5), "墨夜主题：卡片、弹窗、图表一起换装")
    bullets(s, [
        "点位 / 商品 / 活动配图换成 38 个主题的真实照片",
        ("每个主题三张同源不同景别，用于详情页图集", 1),
        ("统一裁切 4:3、1000×750，photo/ 与 art/ 目录分离", 1),
        "主题只覆盖 CSS 设计令牌：red / cyan / dark / blue",
        ("theme.js 在 head 同步引入，先打 data-theme 再渲染，防首屏白闪", 1),
        "图表实时读 CSS 变量，切主题自动重绘，不需要重绘逻辑",
        "自检脚本扫描源码所有图片引用逐条校验存在，换图不留死链",
    ], Inches(7.7), Inches(2.15), Inches(4.7), Inches(3.8), 13.5)

    # ============ 16 测试 ============
    s = blank(prs)
    head(s, "04 / 测试与部署", "三层自检，全部不依赖 npm，离线机器也能跑")
    stat(s, Inches(0.95), Inches(2.15), "160", "接口冒烟断言", "项", Inches(2.6))
    stat(s, Inches(3.75), Inches(2.15), "79", "浏览器实机断言", "项", Inches(2.6))
    stat(s, Inches(6.55), Inches(2.15), "36", "部署配置回归", "项", Inches(2.6))
    stat(s, Inches(9.35), Inches(2.15), "20", "关键截图产出", "张", Inches(2.6))
    rows = [
        ("接口层", "Node 内置模块按业务流程串行调真实接口，覆盖认证 / 四类下单 / 拒绝协商 / 物流结算 / 聊天卡片归属 / 举报上诉 / AI 防幻觉 / 权限矩阵"),
        ("界面层", "无头 Chrome + CDP 真跑三端页面，抓未捕获异常与 4xx/5xx，并断言尺寸与样式：气泡背景、头像宽度、图集张数、扇区点数"),
        ("部署层", "抽取 deploy.ps1 / deploy.sh 的配置读取函数体直接执行，守住「port 同名键导致第二次部署读错端口」的 P0"),
    ]
    for i, (k, v) in enumerate(rows):
        y = Inches(3.95) + i * Inches(0.78)
        rect(s, Inches(0.95), y, Inches(1.35), Inches(0.6), fill=LIGHT, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.14)
        text(s, k, Inches(0.95), y + Inches(0.12), Inches(1.35), Inches(0.36), 13, BRAND, True, align=PP_ALIGN.CENTER)
        text(s, v, Inches(2.5), y + Inches(0.02), Inches(9.9), Inches(0.62), 12.5, GRAY, spacing=1.3)
    text(s, "断言不只看元素在不在，还看尺寸和样式——「样式被覆盖」「资源没加载」这类不抛异常的问题全靠它们暴露。",
         Inches(0.95), Inches(6.45), Inches(11.4), Inches(0.34), 13, BRAND, True)

    # ============ 17 部署 ============
    s = blank(prs)
    head(s, "04 / 测试与部署", "一键部署：双击一个 bat，剩下的交给脚本", "部署机只要求 JDK 17 + MySQL，其余全在仓库里")
    steps = [
        ("① 环境检查", "Java / MySQL 是否可用"),
        ("② 探测口令", "依次试常见口令，写回配置"),
        ("③ 建库建表", "幂等脚本，不覆盖已有数据"),
        ("④ 灌演示数据", "14 点位 / 24 商品 / 10 活动"),
        ("⑤ 选空闲端口", "避开被占用的 8080"),
        ("⑥ 启动并打开", "后台跑 jar，浏览器自动打开"),
    ]
    for i, (k, v) in enumerate(steps):
        col, row = i % 3, i // 3
        x = Inches(0.95) + col * Inches(3.9)
        y = Inches(2.25) + row * Inches(1.5)
        rect(s, x, y, Inches(3.55), Inches(1.2), fill=WHITE, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.08)
        text(s, k, x + Inches(0.25), y + Inches(0.18), Inches(3.1), Inches(0.32), 15, INK, True)
        text(s, v, x + Inches(0.25), y + Inches(0.6), Inches(3.1), Inches(0.5), 12, GRAY)
    bullets(s, [
        "Windows 是 deploy.ps1，macOS / Linux 是行为对等的 deploy.sh，改一边必须同步另一边",
        "重置演示数据要显式输入 YES，完成后自动把开关拨回 false，避免每次启动都清库",
        "结构变更全部幂等：启动时读 information_schema 判断列在不在、宽度够不够，缺什么补什么",
    ], Inches(0.95), Inches(5.3), Inches(11.4), Inches(1.4), 14)

    # ============ 18 总结 ============
    s = blank(prs)
    rect(s, 0, 0, W, H, fill=RGBColor(0xFA, 0xF6, 0xF1))
    rect(s, 0, 0, Inches(0.34), H, fill=BRAND)
    text(s, "05 / 总结", Inches(1.3), Inches(0.85), Inches(6), Inches(0.34), 13, BRAND, True)
    text(s, "做完了什么，还差什么", Inches(1.3), Inches(1.2), Inches(10.5), Inches(0.72), 34, INK, True)
    rect(s, Inches(1.3), Inches(2.02), Inches(5.3), Inches(3.6), fill=WHITE, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
    text(s, "完成", Inches(1.62), Inches(2.24), Inches(4.6), Inches(0.34), 16, RGBColor(0x2E, 0x7D, 0x5B), True)
    bullets(s, [
        "三端可登录、可跑通核心业务闭环",
        "14 点位 / 24 商品 / 10 活动 / 45 订单演示数据",
        "虚拟地图 48 个位置，商户与管理员可自行标注",
        "三层自检全绿：160 / 79 / 36",
        "一键部署在陌生机器上可复现",
    ], Inches(1.62), Inches(2.68), Inches(4.7), Inches(2.7), 13.5, bullet_color=RGBColor(0x2E, 0x7D, 0x5B))
    rect(s, Inches(7.0), Inches(2.02), Inches(5.3), Inches(3.6), fill=WHITE, line=LINE, shape=MSO_SHAPE.ROUNDED_RECTANGLE, radius=0.06)
    text(s, "不足与下一步", Inches(7.32), Inches(2.24), Inches(4.6), Inches(0.34), 16, AMBER, True)
    bullets(s, [
        "口令仍是明文，应改加盐哈希",
        "主键为时间戳派生，建议改独立计数器表",
        "支付未接入，物流是模拟四节点",
        "虚拟地图是抽象坐标，接真实地理才能导航",
        "AI 可上向量检索，提升长文本问答质量",
    ], Inches(7.32), Inches(2.68), Inches(4.7), Inches(2.7), 13.5, bullet_color=AMBER)

    # ============ 19 致谢 ============
    s = blank(prs)
    rect(s, 0, 0, W, H, fill=BRAND)
    rect(s, 0, 0, Inches(0.34), H, fill=BRAND_D)
    rect(s, Inches(11.4), Inches(-1.2), Inches(3.4), Inches(3.4), fill=RGBColor(0xD0, 0x51, 0x42), shape=MSO_SHAPE.OVAL)
    rect(s, Inches(10.0), Inches(5.5), Inches(2.8), Inches(2.8), fill=RGBColor(0xCF, 0x4C, 0x3D), shape=MSO_SHAPE.OVAL)
    text(s, "感谢各位老师", Inches(1.5), Inches(2.55), Inches(10), Inches(0.95), 44, WHITE, True)
    text(s, "请批评指正", Inches(1.5), Inches(3.5), Inches(10), Inches(0.8), 36, RGBColor(0xF9, 0xE2, 0xDC))
    rect(s, Inches(1.52), Inches(4.55), Inches(1.1), Inches(0.07), fill=RGBColor(0xF5, 0xC5, 0x18))
    text(s, "大同村农商文旅智慧平台的设计与实现 · 帅鹏山 · 2026.10",
         Inches(1.5), Inches(4.92), Inches(10), Inches(0.36), 14, RGBColor(0xF2, 0xB8, 0xAD))

    prs.save(OUT)
    print("saved:", OUT)
    print("slides:", len(prs.slides))


if __name__ == "__main__":
    build()
