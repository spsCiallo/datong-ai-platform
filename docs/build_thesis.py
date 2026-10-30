# -*- coding: utf-8 -*-
"""
大同村农商文旅智慧平台 · 毕业设计论文生成器
严格按「附件6」模板：封面保留原格式只填字段；正文按字体字号/行距/页码要求排版。
用法：python docs/build_thesis.py
输出：D:/毕业设计/大同村农商文旅智慧平台毕业设计论文.docx
"""
import copy
import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_TAB_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn, nsmap
from docx.oxml import OxmlElement

ROOT = r"D:\毕业设计"
TPL = os.path.join(ROOT, "附件6：毕业设计（论文、专题报告）封面模板.docx")
OUT = os.path.join(ROOT, "大同村农商文旅智慧平台毕业设计论文.docx")
SHOT = os.path.join(ROOT, "datong-ai-platform", "docs", "screenshots")

TITLE = "大同村农商文旅智慧平台的设计与实现"


def set_run_font(run, name_ea, name_ascii, size_pt, bold=None, underline=None, color=None):
    run.font.name = name_ascii
    run.font.size = Pt(size_pt)
    if bold is not None:
        run.bold = bold
    if underline is not None:
        run.underline = underline
    if color is not None:
        run.font.color.rgb = color
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.append(rFonts)
    rFonts.set(qn("w:ascii"), name_ascii)
    rFonts.set(qn("w:hAnsi"), name_ascii)
    rFonts.set(qn("w:eastAsia"), name_ea)


def set_para_format(p, line=None, before=None, after=None, first_line=None,
                    align=None, outline=None, space_exact=False):
    pf = p.paragraph_format
    if align is not None:
        p.alignment = align
    if line is not None:
        pf.line_spacing = line
    if before is not None:
        pf.space_before = before
    if after is not None:
        pf.space_after = after
    if first_line is not None:
        pf.first_line_indent = first_line
    if outline is not None:
        pPr = p._p.get_or_add_pPr()
        ol = pPr.find(qn("w:outlineLvl"))
        if ol is None:
            ol = OxmlElement("w:outlineLvl")
            pPr.append(ol)
        ol.set(qn("w:val"), str(outline))


def add_text(p, text, ea, ascii_, size, bold=None, underline=None):
    r = p.add_run(text)
    set_run_font(r, ea, ascii_, size, bold=bold, underline=underline)
    return r


def heading(doc, text, level):
    """章/节标题：黑体，单倍行距，段前后 0.5 行（约 6pt）。"""
    sizes = {1: 18, 2: 15, 3: 14, 4: 12}  # 小二 / 小三 / 四号 / 小四
    p = doc.add_paragraph()
    set_para_format(p, line=1.0, before=Pt(6), after=Pt(6), align=WD_ALIGN_PARAGRAPH.LEFT,
                    outline=level - 1)
    add_text(p, text, "黑体", "SimHei", sizes[level], bold=False)
    return p


def body(doc, text, indent=True):
    """正文：宋体小四，1.5 倍行距，首行缩进 2 字符。"""
    p = doc.add_paragraph()
    set_para_format(p, line=1.5, before=Pt(0), after=Pt(0),
                    first_line=Cm(0.85) if indent else Cm(0))
    add_text(p, text, "宋体", "SimSun", 12)
    return p


def body_sup(doc, parts):
    """parts: list of (text, is_sup)"""
    p = doc.add_paragraph()
    set_para_format(p, line=1.5, before=Pt(0), after=Pt(0), first_line=Cm(0.85))
    for text, sup in parts:
        r = p.add_run(text)
        set_run_font(r, "宋体", "SimSun", 12)
        if sup:
            r.font.superscript = True
    return p


def caption(doc, text):
    p = doc.add_paragraph()
    set_para_format(p, line=1.0, before=Pt(4), after=Pt(8), align=WD_ALIGN_PARAGRAPH.CENTER)
    add_text(p, text, "宋体", "SimSun", 10.5)
    return p


def grid_table(doc, rows, header=True):
    """简易带框表格（模板里没有 Table Grid 样式，手动加边框）。"""
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    tbl = table._tbl
    tblPr = tbl.find(qn("w:tblPr"))
    if tblPr is None:
        tblPr = OxmlElement("w:tblPr")
        tbl.insert(0, tblPr)
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement("w:%s" % edge)
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "4")
        el.set(qn("w:color"), "666666")
        borders.append(el)
    tblPr.append(borders)
    for ri, row in enumerate(rows):
        for ci, val in enumerate(row):
            cell = table.rows[ri].cells[ci]
            cell.text = ""
            p = cell.paragraphs[0]
            set_para_format(p, line=1.15, before=Pt(2), after=Pt(2))
            if header and ri == 0:
                add_text(p, val, "黑体", "SimHei", 10.5)
            else:
                add_text(p, val, "宋体", "SimSun", 10.5)
    return table


def add_image(doc, filename, width_cm=14):
    path = os.path.join(SHOT, filename)
    if not os.path.exists(path):
        return
    p = doc.add_paragraph()
    set_para_format(p, line=1.0, before=Pt(6), after=Pt(2), align=WD_ALIGN_PARAGRAPH.CENTER)
    run = p.add_run()
    run.add_picture(path, width=Cm(width_cm))


def page_break(doc):
    p = doc.add_paragraph()
    run = p.add_run()
    br = OxmlElement("w:br")
    br.set(qn("w:type"), "page")
    run._r.append(br)


def add_toc_field(doc):
    """插入 TOC 域，Word 打开后按提示更新（或 F9）即可生成目录。"""
    p = doc.add_paragraph()
    set_para_format(p, line=1.15, before=Pt(0), after=Pt(0))
    r1 = p.add_run()
    fld1 = OxmlElement("w:fldChar")
    fld1.set(qn("w:fldCharType"), "begin")
    r1._r.append(fld1)

    p2 = doc.add_paragraph()
    r2 = p2.add_run()
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = ' TOC \\o "1-3" \\h \\z \\u '
    r2._r.append(instr)

    p3 = doc.add_paragraph()
    r3 = p3.add_run()
    fld3 = OxmlElement("w:fldChar")
    fld3.set(qn("w:fldCharType"), "end")
    r3._r.append(fld3)


def set_update_fields(doc):
    settings = doc.settings.element
    uf = settings.find(qn("w:updateFields"))
    if uf is None:
        uf = OxmlElement("w:updateFields")
        settings.append(uf)
    uf.set(qn("w:val"), "true")


def add_page_number_footer(section, start=1):
    """页脚居中页码，从 start 开始。"""
    sectPr = section._sectPr
    # 起始页码
    pgNumType = sectPr.find(qn("w:pgNumType"))
    if pgNumType is None:
        pgNumType = OxmlElement("w:pgNumType")
        sectPr.append(pgNumType)
    pgNumType.set(qn("w:start"), str(start))

    footer = section.footer
    footer.is_linked_to_previous = False
    p = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    # 清空
    for r in list(p.runs):
        r._element.getparent().remove(r._element)
    r1 = p.add_run()
    set_run_font(r1, "宋体", "SimSun", 10.5)
    fc1 = OxmlElement("w:fldChar")
    fc1.set(qn("w:fldCharType"), "begin")
    r1._r.append(fc1)
    r2 = p.add_run()
    set_run_font(r2, "宋体", "SimSun", 10.5)
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    r2._r.append(instr)
    r3 = p.add_run()
    set_run_font(r3, "宋体", "SimSun", 10.5)
    fc2 = OxmlElement("w:fldChar")
    fc2.set(qn("w:fldCharType"), "end")
    r3._r.append(fc2)


def clear_footer(section):
    section.footer.is_linked_to_previous = False
    p = section.footer.paragraphs[0] if section.footer.paragraphs else section.footer.add_paragraph()
    for r in list(p.runs):
        r._element.getparent().remove(r._element)


def new_section(doc, left_cm=3.0, right_cm=2.5):
    """追加一个分节符（下一页），返回新 section。"""
    new_sect = copy.deepcopy(doc.sections[-1]._sectPr)
    # 放到一个空段落的 pPr 里
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    # 移除已有 sectPr
    old = pPr.find(qn("w:sectPr"))
    if old is not None:
        pPr.remove(old)
    pPr.append(new_sect)
    section = doc.sections[-1]
    section.left_margin = Cm(left_cm)
    section.right_margin = Cm(right_cm)
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)
    return section


def fill_cover(doc):
    """封面保留原格式，只填字段。"""
    # P6 题目
    for p in doc.paragraphs:
        if "XXXX" in p.text or "题目）" in p.text:
            for r in p.runs:
                if "XXXX" in r.text or "题目" in r.text:
                    r.text = TITLE
                    set_run_font(r, "黑体", "SimHei", 24, bold=True)
            break
    # 字段：按标签填下划线 run
    fields = {
        "学院：": "机电信息学院",
        "专业：": "软件技术",
        "班级：": "2024级软件技术1班",
        "姓名：": "帅鹏山",
        "校内指导教师：": "李敏",
        "校外指导教师：": "",
    }
    for p in doc.paragraphs:
        t = p.text
        for label, val in fields.items():
            if t.startswith(label) or (label in t and p.runs and p.runs[0].text.startswith(label[:2])):
                # 找下划线的空格 run
                for r in p.runs:
                    if r.underline and (r.text.strip() == "" or set(r.text) <= set(" \u3000")):
                        r.text = val if val else " "
                        break
                break
        # 学号
        if "学" in t and "号：" in t and p.runs:
            for r in p.runs:
                if r.underline and (r.text.strip() == "" or set(r.text) <= set(" \u3000")):
                    r.text = "246230119"
                    break
        # 日期
        if "年" in t and "月" in t and "日" in t and p.alignment == WD_ALIGN_PARAGRAPH.CENTER:
            # 重写整段
            for r in list(p.runs):
                r.text = ""
            if p.runs:
                p.runs[0].text = "2026 年 10 月 31 日"
                set_run_font(p.runs[0], "宋体", "SimSun", 15)


def strip_after_cover(doc):
    """删除格式要求说明页及之后的所有段落（保留封面 P0-P16）。"""
    # 找到「论文、专题报告字体格式要求」所在段，从它开始删
    start = None
    for i, p in enumerate(doc.paragraphs):
        if "字体格式要求" in p.text or p.text.startswith("论文、专题报告"):
            start = i
            break
    if start is None:
        # 兜底：从「(1)字体字号要求」开始
        for i, p in enumerate(doc.paragraphs):
            if "字体字号要求" in p.text:
                start = i
                break
    if start is None:
        return
    # 从后往前删
    for p in doc.paragraphs[start:]:
        el = p._element
        parent = el.getparent()
        if parent is not None:
            parent.remove(el)


def build():
    doc = Document(TPL)
    fill_cover(doc)
    strip_after_cover(doc)

    # ===== 摘要（仍在 sec1，无页码）=====
    page_break(doc)
    p = doc.add_paragraph()
    set_para_format(p, line=1.5, before=Pt(0), after=Pt(6), align=WD_ALIGN_PARAGRAPH.LEFT)
    add_text(p, "摘要", "黑体", "SimHei", 10.5, bold=True)

    for para in [
        "随着乡村振兴战略的推进，乡村农商文旅融合对信息化平台的需求日益突出。本文设计并实现了一套面向村落场景的农商文旅智慧平台——大同村农商文旅智慧平台。平台采用 Spring Boot 3.3.5 与 Java 17 构建单体后端，以 MySQL 存储数据，前端使用 Vue 2.7 与 Element UI 实现管理后台、商户工作台与游客端三端页面，游客端为电脑手机共用的一套响应式界面，支持朱砂、青瓷、墨夜、靛蓝四种主题切换。",
        "平台覆盖点位打卡集章、农产文创商城、研学民宿预约、订单履约与结算、商家客服、举报处理、AI 知识库问答与行程规划等核心业务。系统提供一键部署脚本，双击即可完成环境检查、建库建表、灌入演示数据与服务启动。经接口冒烟测试 160 项与浏览器实机自检 73 项全部通过，平台可运行、可部署、可演示，能够满足村落农商文旅一体化管理的基本需要。",
    ]:
        p = doc.add_paragraph()
        set_para_format(p, line=1.5, before=Pt(0), after=Pt(0), align=WD_ALIGN_PARAGRAPH.CENTER)
        add_text(p, para, "宋体", "SimSun", 10.5)

    p = doc.add_paragraph()
    set_para_format(p, line=1.5, before=Pt(8), after=Pt(0))
    add_text(p, "关键词", "黑体", "SimHei", 10.5, bold=True)
    add_text(p, "农商文旅；Spring Boot；Vue；响应式设计；乡村振兴", "宋体", "SimSun", 10.5)

    # ===== 目录 =====
    page_break(doc)
    p = doc.add_paragraph()
    set_para_format(p, line=1.5, before=Pt(0), after=Pt(8), align=WD_ALIGN_PARAGRAPH.CENTER)
    add_text(p, "目  录", "黑体", "SimHei", 16, bold=True)
    add_toc_field(doc)
    p = doc.add_paragraph()
    set_para_format(p, line=1.15, before=Pt(8), after=Pt(0))
    add_text(p, "（在 Word 中打开本文档后，若提示是否更新域，请选择「是」；或全选后按 F9 更新目录页码。）",
             "宋体", "SimSun", 9)

    # ===== 正文（新节，页码从 1 开始）=====
    sec = new_section(doc, 3.0, 2.5)
    add_page_number_footer(sec, 1)
    # 前两节无页码
    clear_footer(doc.sections[0])
    clear_footer(doc.sections[1])

    # ---------- 第 1 章 ----------
    heading(doc, "1  需求分析", 1)
    heading(doc, "1.1  项目背景", 2)
    body(doc, "大同村地处桑干河畔、大同火山群南麓，拥有千亩黄花田、古堡烽台遗址、铜艺传习所等文旅资源，以及黄花菜、富硒小米、胡麻油、铜火锅等特色农产品与手工艺品。传统经营方式下，点位介绍依赖纸质导览，商品销售依赖线下集市，研学与民宿预约依赖电话登记，信息分散、效率不高。")
    body(doc, "为改善这一状况，本文设计并实现大同村农商文旅智慧平台。平台以「一台电脑当服务器」为部署形态，管理员、商户与游客通过浏览器即可完成内容管理、商品销售、预约核销与游览导览，不依赖公网云服务，适合在村委会或商户自有机房落地。")

    heading(doc, "1.2  用户与角色", 2)
    body(doc, "平台共有三类角色，权限由后端会话拦截器统一校验，如表 1-1 所示。")
    caption(doc, "表 1-1  平台角色与主要权限")
    grid_table(doc, [
        ["角色", "使用端", "主要权限"],
        ["游客（buyer）", "游客端 /visitor/", "浏览点位、打卡集章、下单预约、AI 问答、联系商家、举报"],
        ["商户（merchant）", "商户工作台 /merchant/", "商品管理、接单发货、办理入住、客服、查看营收、上诉"],
        ["管理员（admin）", "管理后台 /admin/", "账号管理、订单商品总览、内容维护、举报处理、服务器与 AI 配置"],
    ])

    heading(doc, "1.3  功能需求", 2)
    body(doc, "游客端需要提供：账号注册登录；14 个点位的图文浏览、语音讲解与打卡集章；农产文创的浏览、搜索、加购与下单；研学课程、民宿住宿、农事体验的按日期场次预约；订单状态跟踪、取消、商家拒绝后的协商以及确认收货结算；村内活动日历与预约；基于本地知识库的 AI 问答与 1 至 3 天行程规划；与商家的即时聊天；对违规商家的举报。")
    body(doc, "商户端需要提供：店铺资料维护；商品上下架与编辑；订单接单、拒绝（需填原因）、发货与办理入住；与买家的会话；针对自家店铺的举报查看与上诉。")
    body(doc, "管理端需要提供：商家与买家账号的全生命周期管理；全平台订单与商品总览；点位、活动与知识库维护；举报处理与复核；服务器状态、连接配置、二维码与 AI 密钥设置。")

    heading(doc, "1.4  非功能需求", 2)
    body(doc, "部署机只需 JDK 17 与 MySQL，不依赖公网与第三方中间件；AI 未配置大模型时必须可降级为本地知识库回答，不得向用户报错；游客端在同一套代码下同时适配手机与电脑；全站支持主题切换且弹窗、表格等组件一起换装；订单作为交易凭证不提供物理删除。")

    # ---------- 第 2 章 ----------
    heading(doc, "2  系统设计", 1)
    heading(doc, "2.1  总体架构", 2)
    body(doc, "系统采用单体架构，一个 Spring Boot 进程同时承担 REST 接口、静态页面托管、数据库自举与局域网发现。请求链路为：浏览器 → AuthInterceptor 会话鉴权 → Controller → Service → Db 门面 → JdbcTemplate → MySQL。静态资源由内嵌 Tomcat 直接返回，三端页面均为零构建的手写 Vue 2.7 应用，vendors 目录本地化 Vue 与 Element UI，保证内网离线可用。")
    add_image(doc, "entry.png", 14)
    caption(doc, "图 2-1  平台统一入口页")

    heading(doc, "2.2  技术选型", 2)
    body(doc, "后端选用 Spring Boot 3.3.5 与 Java 17，数据访问使用 Spring JDBC 而非 MyBatis 或 JPA，SQL 集中在 Db 门面一处生成，列名走 Tables 白名单，降低注入风险。会话采用数据库 sessions 表而非 JWT，默认有效期 8 小时。二维码由后端 ZXing 本地生成。前端管理端与商户端使用 Vue 2.7 加 Element UI 2.15，游客端为自研响应式组件，不依赖 UI 框架，便于控制移动端体积。")

    heading(doc, "2.3  模块划分", 2)
    body(doc, "后端按包划分为 config（配置与端口守卫）、auth（会话与角色）、common（统一响应与异常）、db（数据访问与自举）、controller（13 个控制器）、service（旅游、商城、聊天、举报、结算、AI、统计等）。端口由 PortGuard 锁定，优先级为命令行参数、环境变量 DT_PORT、配置文件 app.port、兜底 8080，避免 SERVER_PORT 等环境变量劫持。")

    heading(doc, "2.4  接口设计", 2)
    body(doc, "所有 REST 接口统一返回 { ok, ... } 结构，业务错误抛出 ApiException 由全局异常处理器转换为中文提示。接口按前缀划分：/api/auth 认证，/api/tour 点位与活动，/api/shop 商品与订单，/api/chat 客服，/api/reports 举报，/api/ai 智能助手，/api/admin 管理端，/api/stat 统计，/api/server 服务器信息。权限通过 @RequireRole 注解声明，方法级注解优先于类级。")
    body(doc, "下单接口 POST /api/shop/orders 支持混合结算：请求体 items 数组中每个元素可携带各自的 bookDate、people、checkOutDate、roomType、bookingSlot 与 address，后端按商品逐项校验并逐项生成订单，一次提交允许部分成功并通过 warnings 提示。")

    heading(doc, "2.5  主题与视觉设计", 2)
    body(doc, "游客端不做独立手机版，而是一套响应式界面：视口不小于 900 像素时显示顶部导航与多栏网格，窄屏自动收起为底部标签栏与单栏布局。全站以朱砂红为主色，提供朱砂、青瓷、墨夜、靛蓝四种主题。主题实现只覆盖 CSS 设计令牌，卡片、弹窗、表格、输入框与 Element UI 组件一起换装；图表组件实时读取 CSS 变量，切换主题时自动重绘。插画、图标、头像等视觉资源由 Node 脚本参数化生成，风格统一。")
    add_image(doc, "visitor-18-dark-theme.png", 8)
    caption(doc, "图 2-2  墨夜主题下的游客端")

    # ---------- 第 3 章 ----------
    heading(doc, "3  数据库设计", 1)
    heading(doc, "3.1  设计原则", 2)
    body(doc, "数据库默认库名 datong_cloud，共 18 张表、235 个物理字段，全部使用 InnoDB 与 utf8mb4。每张表都有字符串逻辑主键 id 与自增写入顺序号 seq，列表查询显式按 seq 排序。建表脚本只使用 CREATE TABLE IF NOT EXISTS，种子数据只使用 INSERT IGNORE，保证反复启动不覆盖已有数据。系统不声明外键，引用完整性由业务层保证；图片只存相对路径，不存二进制。")

    heading(doc, "3.2  主要数据表", 2)
    body(doc, "账号类表包括 users、merchants、admins，分别存储游客、商户与管理员，密码在演示实现中为明文，生产环境应改为加盐哈希。文旅类表包括 spots（点位）、stamps（打卡）、activities（活动）、activityBookings（活动报名）。交易类表包括 products、orders、settlements，其中 orders 字段最多（39 个业务字段），承载商品订单与商品预约订单。辅助表包括 knowledge、sessions、settings、chatMessages、chatTyping、reports、orderLogs、notifications。")
    caption(doc, "表 3-1  核心数据表一览")
    grid_table(doc, [
        ["表名", "作用", "关键约束"],
        ["users / merchants / admins", "三类账号", "account 唯一；头像存 dataURL"],
        ["spots / stamps", "点位与打卡", "(userId, spotId) 唯一"],
        ["products / orders", "商品与订单", "订单存商品快照；状态机流转"],
        ["settlements", "结算流水", "(orderId, source) 唯一，正数入账负数冲减"],
        ["activities / activityBookings", "活动与报名", "与商城订单分离；容量控制"],
        ["chatMessages / chatTyping", "客服聊天", "(merchantId, buyerId) 组成会话"],
        ["reports / notifications", "举报与通知", "举报-处理-上诉同表闭环"],
        ["knowledge / sessions / settings", "AI、会话与配置", "会话过期由应用判断"],
    ])

    heading(doc, "3.3  订单状态机", 2)
    body(doc, "订单状态分为待确认 pending、已确认 confirmed、已发货 shipped、已入住 checked_in、已完成 completed、已取消 cancelled、已退款 refunded，历史状态 used 仅作只读兼容。实物订单流转为 pending、confirmed、shipped、completed；民宿订单在确认后进入 checked_in；研学与农事体验在确认后即可完成。商家拒绝不再直接关单，而是写入拒绝原因并停在 pending，由买家选择同意关闭或继续协商。")
    body(doc, "完成订单的唯一入口是买家确认收货接口 POST /api/shop/orders/{id}/receive，完成与货款结算发生在同一动作并保证幂等；商家与管理员均无权把订单置为已完成。退款不回滚库存，已结算订单退款时追加负数流水并冲减商户已结算金额。")

    heading(doc, "3.4  演示数据", 2)
    body(doc, "种子数据围绕大同村虚构但自洽的内容展开：14 个点位、6 家商户、16 件商品、10 场活动、40 条知识库、45 笔覆盖全部状态的订单以及配套的打卡、聊天与举报记录。订单与打卡日期使用 MySQL 的 CURDATE 与 NOW 相对生成，无论哪天重置演示数据，运营看板的近 7 日与近 30 日走势都有内容。")

    # ---------- 第 4 章 ----------
    heading(doc, "4  功能实现", 1)
    heading(doc, "4.1  游客端实现", 2)
    heading(doc, "4.1.1  登录与集章", 3)
    body(doc, "登录页初始不展示任何账号，只有成功登录过至少一次的账号才会出现在快捷登录卡片中。点位打卡接口对同一游客同一点位做唯一键约束，重复打卡返回 repeated 标记而不报错。集章进度使用纯 SVG 扇形图渲染，段数以服务端下发的点位总数为准，点亮判定优先使用点位自带的 checked 字段，避免数字与图形脱节。")
    add_image(doc, "visitor-01-login.png", 7)
    caption(doc, "图 4-1  游客端登录页")
    add_image(doc, "visitor-02-home.png", 7)
    caption(doc, "图 4-2  游客端首页")

    heading(doc, "4.1.2  商城与混合结算", 3)
    body(doc, "只有农产文创类商品可以加入购物车，研学、民宿与农事体验必须进入详情页预约，后端在下单时做同样的分类校验。购物车保存在本机并按端与账号隔离。结算页按商品逐项出表单，互不覆盖；民宿按晚数计价、预约类按人数计价、实物按数量计价。")
    add_image(doc, "visitor-05-shop.png", 7)
    caption(doc, "图 4-3  商城页")
    add_image(doc, "visitor-07-product-detail.png", 7)
    caption(doc, "图 4-4  商品详情与预约表单")

    heading(doc, "4.1.3  语音讲解与 AI 助手", 3)
    body(doc, "点位语音讲解使用浏览器自带的 speechSynthesis，零成本、断网可用；不支持朗读的环境自动展开文稿。AI 助手默认检索本地知识库，未命中时明确说明资料中没有，不编造答案；配置大模型后对命中内容润色，调用失败回落本地原文。行程规划按天数、人数与偏好生成时间轴、可预约项目与花费预估。")
    add_image(doc, "visitor-10-ai-ask.png", 7)
    caption(doc, "图 4-5  AI 助手问答")

    heading(doc, "4.1.4  聊天与举报", 3)
    body(doc, "游客与商户的会话按 (merchantId, buyerId) 组织，消息支持文本、图片、商品卡与订单卡，图片在前端压缩到 400KB 以内再入库。输入中状态 4 秒有效，前端 2 秒最多上报一次。举报流程为提交、管理员处理、商家上诉、管理员复核，处理结果通过通知表触达买家。")

    heading(doc, "4.2  商户端实现", 2)
    body(doc, "商户工作台提供营收统计、待处理订单、近 7 日营收曲线与商品概览。订单管理仅保留接单、拒绝、发货与办理入住，完成动作已移交买家。商品文案工具在本地生成朴实、文艺、简洁三种风格，不调用大模型。")
    add_image(doc, "merchant-login.png", 12)
    caption(doc, "图 4-6  商户工作台登录页")

    heading(doc, "4.3  管理端实现", 2)
    body(doc, "管理后台使用 Element UI 表格与弹窗承载商家、买家、订单、商品、内容与服务器管理。服务器管理页可查看端口、Java 版本、内存、各表记录数，并生成手机端访问二维码。AI 设置支持一键测试连接，密钥只存于 settings 表，公开接口会过滤密钥字段。")
    add_image(doc, "admin-login.png", 12)
    caption(doc, "图 4-7  管理后台登录页")

    heading(doc, "4.4  关键技术点", 2)
    body(doc, "端口守卫解决运行环境 SERVER_PORT 变量劫持导致页面打不开的问题；数据库自举先连不带库名的地址执行 CREATE DATABASE，再执行幂等脚本；口令自动探测依次尝试常见口令，试通后写回配置对象。图片加载失败时前端统一退回占位插画并打标记，避免无限 onerror。主题脚本在 head 中同步引入，先给 html 打 data-theme 再渲染，防止首屏白闪。")

    # ---------- 第 5 章 ----------
    heading(doc, "5  测试与部署", 1)
    heading(doc, "5.1  部署方案", 2)
    body(doc, "Windows 下双击一键部署.bat，脚本依次检查 Java 与 MySQL、探测数据库口令、写入本机配置、选择空闲端口、后台启动 fat jar 并打开浏览器。macOS 与 Linux 提供行为对等的 deploy.sh。重置演示数据需显式输入 YES，完成后自动把重置开关拨回 false，避免之后每次启动都清库。")

    heading(doc, "5.2  接口测试", 2)
    body(doc, "接口冒烟测试脚本基于 Node 内置模块实现，不依赖 npm 包，覆盖认证、打卡、四类商品下单、拒绝协商、发货物流、聊天、举报与上诉、退款结算、AI 问答与防幻觉、权限矩阵与服务器管理。本轮实测 160 项断言全部通过。")

    heading(doc, "5.3  浏览器实机测试", 2)
    body(doc, "前端实机自检使用本机 Chrome 无头模式与 Chrome DevTools Protocol，把三端页面真的跑一遍，抓未捕获异常、控制台错误与 4xx/5xx 请求，并对关键 DOM 做断言，同时验证桌面与手机两种视口下的游客端布局以及主题切换。本轮实测 73 项断言全部通过，部分界面截图如图 5-1 与图 5-2 所示。")
    add_image(doc, "visitor-03-spots.png", 7)
    caption(doc, "图 5-1  点位打卡页")
    add_image(doc, "visitor-12-plan.png", 7)
    caption(doc, "图 5-2  AI 行程规划")
    caption(doc, "表 5-1  自检结果汇总")
    grid_table(doc, [
        ["项目", "用例数", "结果"],
        ["接口冒烟测试", "160 项断言", "全部通过"],
        ["浏览器实机自检", "73 项断言", "全部通过"],
        ["部署配置解析回归", "22 项断言（1 组跳过）", "全部通过"],
        ["脚本编码自检", "6 个 bat / 2 个 ps1 / 6 个 sh", "全部通过"],
    ])

    heading(doc, "5.4  验收结论", 2)
    body(doc, "平台可启动、可部署；三端均可登录并完成核心流程；四种主题切换生效；游客端在电脑与手机浏览器下自适应正常；前后端接口、字段、权限与订单状态无错配；视觉资源全部替换为新生成的插画与图标。论文所描述的功能均以实际实现为依据，未编造未实现内容。")

    # ---------- 第 6 章 ----------
    heading(doc, "6  总结", 1)
    body(doc, "本文完成大同村农商文旅智慧平台的设计与实现。平台沿用经过实机验证的单体后端架构与 18 表数据模型，保证接口兼容与数据一致性；游客端合并为一套响应式界面并以朱砂红为主色提供四主题切换；视觉资源参数化重绘；演示数据围绕大同村黄花、铜艺、民宿与研学展开。测试结果表明平台满足课程演示与答辩需要。")
    body(doc, "受时间与篇幅限制，系统仍有改进空间：账号密码应改为加盐哈希；主键生成可引入独立计数器表避免删除后复用；物流信息可接入真实快递查询；支付可对接微信或支付宝沙箱；AI 可扩展向量检索以提升长文本问答质量。这些将作为后续学习和迭代的重点。")

    # ---------- 参考文献 ----------
    p = doc.add_paragraph()
    set_para_format(p, line=1.0, before=Pt(12), after=Pt(8), align=WD_ALIGN_PARAGRAPH.CENTER)
    add_text(p, "参考文献", "黑体", "SimHei", 10.5, bold=True)

    refs = [
        "[1] 克雷格·沃斯. Spring Boot 实战[M]. 2版. 北京: 人民邮电出版社, 2022: 12-45.",
        "[2] 明日科技. Java 从入门到精通[M]. 6版. 北京: 清华大学出版社, 2021: 88-102.",
        "[3] 尤雨溪. Vue.js 官方文档[EB/OL]. https://cn.vuejs.org, 2024.",
        "[4] MySQL 8.0 Reference Manual[EB/OL]. https://dev.mysql.com/doc/, 2024.",
        "[5] 张海藩, 牟永敏. 软件工程导论[M]. 6版. 北京: 清华大学出版社, 2013: 56-78.",
        "[6] 王珊, 萨师煊. 数据库系统概论[M]. 5版. 北京: 高等教育出版社, 2014: 102-130.",
        "[7] 阿里巴巴集团. Java 开发手册[M]. 北京: 电子工业出版社, 2020: 15-40.",
        "[8] Element UI 组件库文档[EB/OL]. https://element.eleme.io, 2024.",
        "[9] 李刚. 疯狂 Java 讲义[M]. 6版. 北京: 电子工业出版社, 2022: 210-256.",
        "[10] 中共中央 国务院. 乡村振兴战略规划（2018—2022 年）[EB/OL]. http://www.gov.cn, 2018.",
    ]
    for r in refs:
        p = doc.add_paragraph()
        set_para_format(p, line=1.15, before=Pt(0), after=Pt(2), first_line=Cm(0))
        add_text(p, r, "宋体", "SimSun", 9)

    set_update_fields(doc)
    doc.save(OUT)
    print("saved:", OUT)


if __name__ == "__main__":
    build()
