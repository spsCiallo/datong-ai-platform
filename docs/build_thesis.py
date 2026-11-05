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
        "平台覆盖点位打卡集章、农产文创商城、研学民宿预约、订单履约与结算、商家客服、举报处理、AI 知识库问答与行程规划、村落虚拟地图等核心业务。系统提供一键部署脚本，双击即可完成环境检查、建库建表、灌入演示数据与服务启动。经接口冒烟测试 160 项、浏览器实机自检 79 项与部署配置解析回归 36 项全部通过，平台可运行、可部署、可演示，能够满足村落农商文旅一体化管理的基本需要。",
    ]:
        p = doc.add_paragraph()
        set_para_format(p, line=1.5, before=Pt(0), after=Pt(0), align=WD_ALIGN_PARAGRAPH.CENTER)
        add_text(p, para, "宋体", "SimSun", 10.5)

    p = doc.add_paragraph()
    set_para_format(p, line=1.5, before=Pt(8), after=Pt(0))
    add_text(p, "关键词", "黑体", "SimHei", 10.5, bold=True)
    add_text(p, "农商文旅；Spring Boot；Vue；响应式设计；虚拟地图；乡村振兴", "宋体", "SimSun", 10.5)

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
    body(doc, "大同村地处桑干河畔、大同火山群南麓，拥有千亩黄花田、古堡烽台遗址、铜艺传习所等文旅资源，以及黄花菜、富硒小米、胡麻油、铜火锅等特色农产品与手工艺品。传统经营方式下，点位介绍依赖纸质导览，商品销售依赖线下集市，研学与民宿预约依赖电话登记，信息分散、效率不高，游客的游览体验与商户的经营效率都受到制约。")
    body(doc, "近年来乡村旅游的消费结构发生了变化：游客不再满足于「到一个点、拍一张照」，而是希望在一次出行中同时完成看景、吃东西、买特产、住一晚、带孩子上一次研学课。这类需求天然要求「农、商、文、旅」四类资源在同一个信息平台上打通，而不是各自维护一套互不相通的账本。另一方面，村一级的经营主体规模小、预算有限，既没有能力长期承担公有云的运维成本，也缺少专职的信息化人员，因此平台必须做到「一台电脑当服务器、双击就能跑起来」。")
    body(doc, "为改善这一状况，本文设计并实现大同村农商文旅智慧平台。平台以「一台电脑当服务器」为部署形态，管理员、商户与游客通过浏览器即可完成内容管理、商品销售、预约核销与游览导览，不依赖公网云服务，适合在村委会或商户自有机房落地。平台同时承担「窗口」和「账本」两种角色：对游客是浏览与下单的窗口，对经营主体是订单、结算与统计的账本。")

    heading(doc, "1.2  用户与角色", 2)
    body(doc, "平台共有三类角色，权限由后端会话拦截器与注解统一校验，如表 1-1 所示。三类角色登录后进入各自独立的前端入口，会话保存在数据库 sessions 表中而非浏览器本地，避免前端伪造身份；接口层再按角色做一次校验，形成「两次判定」的防护。")
    caption(doc, "表 1-1  平台角色与主要权限")
    grid_table(doc, [
        ["角色", "使用端", "主要权限"],
        ["游客（buyer）", "游客端 /visitor/", "浏览点位、打卡集章、下单预约、AI 问答、联系商家、举报"],
        ["商户（merchant）", "商户工作台 /merchant/", "商品管理、接单发货、办理入住、客服、查看营收、上诉"],
        ["管理员（admin）", "管理后台 /admin/", "账号管理、订单商品总览、内容维护、举报处理、服务器与 AI 配置"],
    ])

    heading(doc, "1.3  功能需求", 2)
    body(doc, "功能需求按角色拆解。为避免「需求写完却落不了地」，本节只描述已经在系统中实现并有测试断言覆盖的功能，未实现的能力不写入需求。")
    heading(doc, "1.3.1  游客端功能需求", 3)
    body(doc, "游客端需要提供：账号注册登录；14 个点位的图文浏览、语音讲解与打卡集章；农产文创的浏览、搜索、加购与下单；研学课程、民宿住宿、农事体验的按日期场次预约；订单状态跟踪、取消、商家拒绝后的协商以及确认收货结算；村内活动日历与预约；基于本地知识库的 AI 问答与 1 至 3 天行程规划；与商家的即时聊天；对违规商家的举报。")
    body(doc, "此外，游客端还需要一个把「点位、商品、活动」三类位置放在一张图上的村落虚拟地图，支持缩放、拖拽与按类别筛选，并能从地图上的标记直接跳到对应的详情页——这是「找得到、走得通」的直观入口。个人中心需要展示已经收集到的点位印章，让打卡行为有可积累的成就感。")
    heading(doc, "1.3.2  商户端功能需求", 3)
    body(doc, "商户端需要提供：店铺资料维护；商品上下架与编辑，编辑时可选配图集与标注位置；订单接单、拒绝（需填原因）、发货与办理入住；与买家的会话；针对自家店铺的举报查看与上诉；营收与近 7 日走势查看。商户不需要也不允许参与订单完成动作，完成权在买家手里。")
    heading(doc, "1.3.3  管理端功能需求", 3)
    body(doc, "管理端需要提供：商家与买家账号的全生命周期管理；全平台订单与商品总览；点位、活动与知识库维护，并能为点位与活动编辑图集和地图坐标；举报处理与复核；服务器状态、局域网地址与二维码、界面主题与 AI 密钥设置。管理端不参与聊天，也不能把订单置为已完成。")

    heading(doc, "1.4  非功能需求", 2)
    body(doc, "部署性：部署机只需 JDK 17 与 MySQL，不依赖公网与第三方中间件，不引入 Maven 之外的构建期依赖，前端不引 CDN，所有前端库本地化到 vendors 目录，保证内网与断网环境可用。")
    body(doc, "可用性：AI 未配置大模型时必须可降级为本地知识库回答，调用失败要自动回落而不是向用户报错；图片加载失败要退回占位图；语音朗读在浏览器不支持时自动展开文稿。")
    body(doc, "兼容性：游客端在同一套代码下同时适配手机与电脑，以 900 像素为断点切换顶部导航与底部标签栏；四套主题只覆盖 CSS 设计令牌，不得出现只改了一半的组件。")
    body(doc, "数据安全：订单作为交易凭证不提供物理删除；口令只通过配置或环境变量注入，不写入代码与文档；聊天图片在前端压缩后再入库，单条体积设上限。")

    heading(doc, "1.5  可行性分析", 2)
    body(doc, "技术可行性：Spring Boot 单体应用足以承载村级规模的并发，MySQL 单实例即可满足数据量需求，Vue 2.7 的零构建用法让三端页面不需要打包工具，改完刷新即生效，适合人手有限的维护场景。")
    body(doc, "经济可行性：全部依赖开源且部署在本地机器上，除硬件外没有持续性支出；AI 能力做成可选增强，不配置密钥时用本地知识库兜底，不产生调用费用。")
    body(doc, "操作可行性：三端都是浏览器页面，游客扫码即用，商户与管理员用账号密码登录；部署步骤收敛为双击一个批处理文件，即使没有运维经验也能完成。")

    # ---------- 第 2 章 ----------
    heading(doc, "2  系统设计", 1)
    heading(doc, "2.1  总体架构", 2)
    body(doc, "系统采用单体架构，一个 Spring Boot 进程同时承担 REST 接口、静态页面托管、数据库自举与局域网发现。请求链路为：浏览器 → AuthInterceptor 会话鉴权 → Controller → Service → Db 门面 → JdbcTemplate → MySQL。静态资源由内嵌 Tomcat 直接返回，三端页面均为零构建的手写 Vue 2.7 应用，vendors 目录本地化 Vue 与 Element UI，保证内网离线可用。")
    body(doc, "选择单体而不是微服务，是权衡后的结果：村级平台的功能边界清晰但耦合不重，拆成多个进程只会带来部署与排障成本；单进程还让「数据库自举 + 一键部署」这类便利设计成为可能。若日后业务量上升，按 Controller 前缀即可沿 /api/tour、/api/shop、/api/chat 切开。")
    add_image(doc, "entry.png", 13)
    caption(doc, "图 2-1  平台统一入口页")

    heading(doc, "2.2  技术选型", 2)
    body(doc, "后端选用 Spring Boot 3.3.5 与 Java 17，数据访问使用 Spring JDBC 而非 MyBatis 或 JPA，SQL 集中在 Db 门面一处生成，列名走 Tables 白名单，降低注入风险。会话采用数据库 sessions 表而非 JWT，默认有效期 8 小时，好处是后台可以立刻吊销。二维码由后端 ZXing 本地生成，不依赖外部服务。")
    body(doc, "前端管理端与商户端使用 Vue 2.7 加 Element UI 2.15，游客端为自研响应式组件，不依赖 UI 框架，便于控制移动端体积与视觉一致性。图表用原生 SVG 手写，不引入图表库：一是避免额外体积，二是可以实时读取 CSS 变量，切换主题时无需重绘逻辑即可换色。")

    heading(doc, "2.3  模块划分", 2)
    body(doc, "后端按包划分为 config（配置与端口守卫）、auth（会话与角色）、common（统一响应与异常）、db（数据访问与自举）、controller（13 个控制器、105 个接口端点）、service（旅游、商城、聊天、举报、结算、AI、统计等）。端口由 PortGuard 锁定，优先级为命令行参数、环境变量 DT_PORT、配置文件 app.port、兜底 8080，避免 SERVER_PORT 等环境变量劫持。")
    body(doc, "前端按端划分：admin、merchant、visitor 三个目录各有独立的 html、js、css，共用 assets 下的设计令牌、图标 sprite、主题脚本、格式化工具与虚拟地图组件。共用层的存在保证了三端的颜色、圆角、阴影与图标风格一致，也避免同一段逻辑写三遍。")

    heading(doc, "2.4  接口设计", 2)
    body(doc, "所有 REST 接口统一返回 { ok, ... } 结构，业务错误抛出 ApiException 由全局异常处理器转换为中文提示，HTTP 状态码统一为 200 加业务码，前端只需判断 ok 字段。权限通过 @RequireRole 注解声明，方法级注解优先于类级，未标注的接口默认拒绝非白名单角色访问。接口按前缀分组，如表 2-1 所示。")
    caption(doc, "表 2-1  接口分组与职责")
    grid_table(doc, [
        ["前缀", "职责", "典型端点"],
        ["/api/auth", "注册、登录、改密、退出", "POST /login、POST /register"],
        ["/api/tour", "点位、打卡、活动、报名", "GET /spots、POST /spots/{id}/checkin"],
        ["/api/shop", "商品、购物车订单、订单状态流转", "POST /orders、POST /orders/{id}/receive"],
        ["/api/chat", "会话列表、消息、输入中状态", "GET /threads、POST /messages"],
        ["/api/reports", "举报、申诉、复核", "POST /reports、POST /reports/{id}/appeal"],
        ["/api/ai", "知识库问答、行程规划", "POST /ask、POST /plan"],
        ["/api/stat", "经营看板与统计", "GET /merchant/summary"],
        ["/api/admin", "账号、订单、商品、内容、服务器", "GET /data-overview、PUT /products/{id}"],
        ["/api/server", "健康检查、局域网地址、二维码", "GET /health、GET /qrcode"],
    ])
    body(doc, "下单接口 POST /api/shop/orders 支持混合结算：请求体 items 数组中每个元素可携带各自的 bookDate、people、checkOutDate、roomType、bookingSlot 与 address，后端按商品逐项校验并逐项生成订单，一次提交允许部分成功并通过 warnings 提示。这个设计解决的是「购物车里既有实物又有预约」时的表单冲突问题。")

    heading(doc, "2.5  主题与视觉设计", 2)
    body(doc, "游客端不做独立手机版，而是一套响应式界面：视口不小于 900 像素时显示顶部导航与多栏网格，窄屏自动收起为底部标签栏与单栏布局。全站以朱砂红为主色，提供朱砂、青瓷、墨夜、靛蓝四种主题。主题实现只覆盖 CSS 设计令牌，卡片、弹窗、表格、输入框与 Element UI 组件一起换装；图表组件实时读取 CSS 变量，切换主题时自动重绘。")
    body(doc, "主题脚本在 head 中同步引入，先给 html 打上 data-theme 再渲染首屏，避免深色主题下出现白闪。默认主题不写属性、其余主题写属性，这样未选择主题的老用户行为不变。")
    add_image(doc, "visitor-18-dark-theme.png", 7)
    caption(doc, "图 2-2  墨夜主题下的游客端")

    heading(doc, "2.6  虚拟地图设计", 2)
    body(doc, "虚拟地图是本平台区别于普通商城页面的部分。村里的真实经纬度对游客帮助有限（建筑密集、道路无名称），因此设计了一套抽象坐标系：把村落俯视图归一化为 1000×700 的画布，所有点位、商品、活动都以 0 至 1000 的横坐标与 0 至 700 的纵坐标记录，而不是存真实经纬度。这样地图底图可以手绘，标记可以任意微调，且不依赖任何在线地图服务与密钥。")
    body(doc, "地图被封装成一个可复用的 Vue 组件：接受点位数组、当前选中项、是否可选点、选点坐标等属性，对外抛出 pick（选点）、select（点标记）、input（选中变化）三类事件。组件内部负责缩放、平移、边界约束与标记反向缩放——标记用固定像素尺寸、按 1/scale 抵消画布缩放，保证放大后标记不会被拉成巨幅图钉。同一个组件被用在四个地方：游客端地图整页、点位详情内嵌小图、商户端商品选点、管理端商品与内容选点，实现一处维护、四处受益。")

    # ---------- 第 3 章 ----------
    heading(doc, "3  数据库设计", 1)
    heading(doc, "3.1  设计原则", 2)
    body(doc, "数据库默认库名 datong_cloud，共 18 张表、242 个物理字段，全部使用 InnoDB 与 utf8mb4。每张表都有字符串逻辑主键 id 与自增写入顺序号 seq，列表查询显式按 seq 排序。建表脚本只使用 CREATE TABLE IF NOT EXISTS，种子数据只使用 INSERT IGNORE，保证反复启动不覆盖已有数据。系统不声明外键，引用完整性由业务层保证；图片只存相对路径，不存二进制。时间字段统一使用 VARCHAR 存储 ISO 文本而不是 DATETIME，理由是演示数据需要用相对时间生成、导出与跨库迁移都不必处理时区。")

    heading(doc, "3.2  主要数据表", 2)
    body(doc, "账号类表包括 users、merchants、admins，分别存储游客、商户与管理员，密码在演示实现中为明文，生产环境应改为加盐哈希。文旅类表包括 spots（点位）、stamps（打卡）、activities（活动）、activityBookings（活动报名）。交易类表包括 products、orders、settlements，其中 orders 字段最多（39 个业务字段），承载商品订单与商品预约订单。辅助表包括 knowledge、sessions、settings、chatMessages、chatTyping、reports、orderLogs、notifications。")
    caption(doc, "表 3-1  核心数据表一览")
    grid_table(doc, [
        ["表名", "作用", "关键约束"],
        ["users / merchants / admins", "三类账号", "account 唯一；头像存 dataURL"],
        ["spots / stamps", "点位与打卡", "(userId, spotId) 唯一；images 为 JSON 图集"],
        ["products / orders", "商品与订单", "订单存商品快照；状态机流转"],
        ["activities / activityBookings", "活动与报名", "与商城订单分离；容量控制"],
        ["settlements", "结算流水", "(orderId, source) 唯一，正数入账负数冲减"],
        ["chatMessages / chatTyping", "客服聊天", "(merchantId, buyerId) 组成会话；消息带商品/订单引用"],
        ["reports / notifications", "举报与通知", "举报-处理-上诉同表闭环"],
        ["knowledge / sessions / settings", "AI、会话与配置", "会话过期由应用判断"],
    ])
    body(doc, "spots、products、activities 三张表都带有 images（JSON 数组）与 mapX、mapY（0 至 1000 / 0 至 700）列。图集用 JSON 而不是单独的图片表，是因为图集只在详情页整体展示、不需要按图查询，用一列换掉一张关联表在村级规模下更划算；约定数组第一张即封面，前端与后端都按这个口径取值，避免封面与图集不同步。")

    heading(doc, "3.3  订单状态机", 2)
    body(doc, "订单状态分为待确认 pending、已确认 confirmed、已发货 shipped、已入住 checked_in、已完成 completed、已取消 cancelled、已退款 refunded，历史状态 used 仅作只读兼容。实物订单流转为 pending、confirmed、shipped、completed；民宿订单在确认后进入 checked_in；研学与农事体验在确认后即可完成。商家拒绝不再直接关单，而是写入拒绝原因并停在 pending，由买家选择同意关闭或继续协商。")
    body(doc, "完成订单的唯一入口是买家确认收货接口 POST /api/shop/orders/{id}/receive，完成与货款结算发生在同一动作并保证幂等；商家与管理员均无权把订单置为已完成。退款不回滚库存，已结算订单退款时追加负数流水并冲减商户已结算金额。把「完成权」和「结算」绑在一起，是为了避免出现「订单完成但没结算」或「结算了但订单被改」的对账黑洞。")

    heading(doc, "3.4  演示数据", 2)
    body(doc, "种子数据围绕大同村虚构但自洽的内容展开：14 个点位、6 家商户、24 件商品（含研学课程、民宿住宿、农事体验三类）、10 场活动、40 条知识库、45 笔覆盖全部状态的订单以及配套的打卡、聊天、举报与预约记录。订单与打卡日期使用 MySQL 的 CURDATE 与 NOW 相对生成，无论哪天重置演示数据，运营看板的近 7 日与近 30 日走势都有内容。")

    heading(doc, "3.5  数据结构演进与幂等迁移", 2)
    body(doc, "项目在迭代中给 spots、products、activities 追加了 images、mapX、mapY 三列，也给 stamps 的图标列加宽过。这类变更不能要求使用者手工改表，因此数据库自举模块在启动时会读 information_schema 判断列是否存在、宽度是否足够，缺什么补什么；列宽不足时执行 ALTER MODIFY，并在修正后把历史上被静默截断的值按点位重新回填。")
    body(doc, "这套「自检 + 补齐」的策略让老库可以原地升级，同时也带来一个约束：所有结构变更必须写成幂等的，重复执行不能报错、不能丢数据。也正因如此，建表脚本禁止出现 DROP TABLE 之类的语句，需要清库时只能走显式的「重置演示数据」流程。")

    # ---------- 第 4 章 ----------
    heading(doc, "4  功能实现", 1)
    heading(doc, "4.1  游客端实现", 2)
    heading(doc, "4.1.1  登录与集章", 3)
    body(doc, "登录页初始不展示任何账号，只有成功登录过至少一次的账号才会出现在快捷登录卡片中。点位打卡接口对同一游客同一点位做唯一键约束，重复打卡返回 repeated 标记而不报错。集章进度使用纯 SVG 扇形图渲染，段数以服务端下发的点位总数为准，点亮判定优先使用点位自带的 checked 字段，避免数字与图形脱节。")
    body(doc, "扇形图最初把「再集 N 枚即可通关」的提示压在圆环中央，字号一大就与扇区重叠；改版后中央只保留「已集 / 总数」两行，进度提示移到圆环下方。集满全部点位时扇区由白色转为金色并轻微呼吸，完成态一眼可辨——此前的写法是把亮色画在亮色底上，全打卡后反而整圈看不出点亮。")
    add_image(doc, "visitor-01-login.png", 6.5)
    caption(doc, "图 4-1  游客端登录页")
    add_image(doc, "visitor-02-home.png", 6.5)
    caption(doc, "图 4-2  游客端首页与集章进度")

    heading(doc, "4.1.2  点位浏览与语音讲解", 3)
    body(doc, "点位列表按「点位卡片」与「印章墙」两种视图切换。卡片展示封面、名称、类型与打卡状态，已打卡的卡片右上角盖上一枚朱砂印章，印章用旋转 -8 度加缩放动画落章，与实体印章的观感一致。印章墙则只展示已获得的印章，作为集章成果的总览。")
    body(doc, "点位详情包含图集轮播、位置与建议游览时长、讲解介绍、语音朗读与讲解文稿。语音讲解使用浏览器自带的 speechSynthesis，零成本、断网可用；不支持朗读的环境自动展开文稿。详情页底部内嵌一张小地图，标出该点位在村里的位置，并给出「看全图」入口跳到虚拟地图整页。")
    add_image(doc, "visitor-03-spots.png", 6.5)
    caption(doc, "图 4-3  点位打卡页与已获得的印章")
    add_image(doc, "visitor-04-spot-detail.png", 6.5)
    caption(doc, "图 4-4  点位详情与内嵌位置地图")

    heading(doc, "4.1.3  商城与混合结算", 3)
    body(doc, "只有农产文创类商品可以加入购物车，研学、民宿与农事体验必须进入详情页预约，后端在下单时做同样的分类校验。购物车保存在本机并按端与账号隔离。结算页按商品逐项出表单，互不覆盖；民宿按晚数计价、预约类按人数计价、实物按数量计价。")
    body(doc, "商品详情展示图集轮播、规格信息、销量库存、标签与介绍段落。图集与封面共用同一份 images 数据，第一张即封面，详情页可翻页查看其余图片；介绍段落与短描述分开存储，前者用于详情、后者用于列表，避免列表被大段文字撑破。")
    add_image(doc, "visitor-05-shop.png", 6.5)
    caption(doc, "图 4-5  商城页")
    add_image(doc, "visitor-07-product-detail.png", 6.5)
    caption(doc, "图 4-6  商品详情与预约表单")

    heading(doc, "4.1.4  虚拟地图与位置标注", 3)
    body(doc, "虚拟地图整页把点位打卡、农产文创、研学课程、民宿住宿、农事体验与村内活动共 48 个位置画在同一张手绘底图上，顶部按类别筛选并显示各类数量。地图支持滚轮与双指缩放、拖拽平移、按钮放大缩小与一键复位；点击标记后底部浮出详情卡，按类型给出「去打卡 / 看活动 / 看商品」的跳转按钮。")
    body(doc, "位置数据的录入端分散在商户端与管理端：商户新增或编辑商品时可在地图上点选位置，管理端可以给商品、点位、活动标注与修改坐标。为了让选点不迷失方向，编辑弹窗里的地图会同时画出「本店其它已标注商品」和「全村的点位」作为参照，选中的位置以脉冲准星显示；再点同一个点或点准星即可取消标注。农产文创这类快递发货的实物商品不要求位置，界面上也不显示地图，避免把「产地」误解成「自提点」。")
    add_image(doc, "visitor-19-village-map.png", 14)
    caption(doc, "图 4-7  大同村虚拟地图（48 个位置，六类筛选）")

    heading(doc, "4.1.5  即时聊天与举报", 3)
    body(doc, "游客与商户的会话按 (merchantId, buyerId) 组织，消息支持文本、图片、商品卡与订单卡，图片在前端压缩到 400KB 以内再入库。聊天页做成独立两栏：左侧是会话列表，可在一个页面内切换多个商家；右侧是消息流，每条消息都带双方头像与发送时间，商品卡与订单卡可直接点击跳到对应详情。输入中状态 4 秒有效，前端 2 秒最多上报一次。")
    body(doc, "商品卡与订单卡的关键在于服务端在落库时同时校验归属：商品必须属于该商家，订单必须同时属于该商家与该买家，避免把别人的订单卡片发进会话。消息装饰阶段会补上商品与订单的快照字段，前端因此不必再单独请求详情，即使商品下架也能显示历史卡片。")
    body(doc, "举报流程为提交、管理员处理、商家上诉、管理员复核，处理结果通过通知表触达买家。举报与订单、商品可以关联，管理员处理时能看到上下文，不必再去别处翻记录。")
    add_image(doc, "visitor-16-chat-style.png", 6.5)
    caption(doc, "图 4-8  独立聊天页（会话列表 + 带头像与时间的消息流）")

    heading(doc, "4.1.6  AI 助手与行程规划", 3)
    body(doc, "AI 助手默认检索本地知识库，未命中时明确说明资料中没有，不编造答案；配置大模型后对命中内容润色，调用失败回落本地原文。回答下方附带命中的知识条目来源，便于核对。界面把输入框固定在页面底部，消息区独立滚动，长回答不会把输入框顶出视口；左上角提供返回按钮，与其它页面的返回位置一致。")
    body(doc, "行程规划按天数、人数与偏好生成时间轴、可预约项目与花费预估。规划结果里的项目可以直接点进对应的商品或点位详情继续下单，把「看攻略」和「下单」串成一条路径。")
    add_image(doc, "visitor-10-ai-ask.png", 6.5)
    caption(doc, "图 4-9  AI 助手问答")
    add_image(doc, "visitor-12-plan.png", 6.5)
    caption(doc, "图 4-10  AI 行程规划")

    heading(doc, "4.1.7  个人中心与主题", 3)
    body(doc, "个人中心顶部是「我的集章墙」，直接展示已经收集到的点位印章与集章进度，并给出「去打卡」入口；下方是界面主题与功能菜单。主题卡片上移到首屏可见位置，四套配色以实心色点呈现，点击即生效并持久化。底部只保留修改密码与退出登录，两个按钮之间留出间距，不再贴在一起。")
    body(doc, "返回逻辑按「从哪进入返回哪」的原则实现：页面栈记录来源，商品详情退出回商城、点位详情回打卡页、订单详情回我的订单、举报回我的页；从地图点开的详情返回回地图。若无来源可循，则按视图的父级兜底，最后一层才回首页——这条规则替代了早期「一律回首页」的做法。")
    add_image(doc, "visitor-13-mine.png", 6.5)
    caption(doc, "图 4-11  我的集章墙与主题设置")

    heading(doc, "4.2  商户端实现", 2)
    body(doc, "商户工作台提供营收统计、待处理订单、近 7 日营收曲线与商品概览。订单管理仅保留接单、拒绝、发货与办理入住，完成动作已移交买家。商品文案工具在本地生成朴实、文艺、简洁三种风格，不调用大模型，既省调用成本也保证断网可用。")
    body(doc, "商品编辑弹窗在原有字段之外增加了图集编辑器与地图选点：图集支持增删、上下移动与从已有图中挑选，第一张即封面；地图选点会画出本店其它已标注商品与全村点位作为参照，点一下确定、再点一下取消。这样商户不必理解坐标数值，也能把研学课、民宿、农事体验放到村里的正确位置上。")
    add_image(doc, "merchant-login.png", 11)
    caption(doc, "图 4-12  商户工作台登录页")
    add_image(doc, "merchant-05-chat-layout.png", 11)
    caption(doc, "图 4-13  商户端客服会话")

    heading(doc, "4.3  管理端实现", 2)
    body(doc, "管理后台使用 Element UI 表格与弹窗承载商家、买家、订单、商品、内容与服务器管理。服务器管理页可查看端口、Java 版本、内存、各表记录数，并生成手机端访问二维码。AI 设置支持一键测试连接，密钥只存于 settings 表，公开接口会过滤密钥字段。")
    body(doc, "服务器管理页早期存在两个缺陷：接口异常时状态对象缺默认值导致整页白屏，以及「个性化设置」标签页引用了视图组件里并不存在的主题方法，点击无反应。修复方式是给状态对象补齐完整默认值，并把主题状态与切换方法下沉到视图组件内，同时提供四个主题卡片的可视化预览，让「设置」这件事本身也有反馈。")
    body(doc, "内容管理覆盖点位、活动与知识库三类内容，点位与活动的编辑弹窗同样带图集编辑器与地图选点，管理员可以查看并修改已有位置。订单与商品总览只读为主，商品允许改价改库存与上下架，订单不提供删除入口——订单是交易凭证，这一条写进了项目的长期约束。")
    add_image(doc, "admin-login.png", 11)
    caption(doc, "图 4-14  管理后台登录页")

    heading(doc, "4.4  关键技术点", 2)
    body(doc, "端口守卫解决运行环境 SERVER_PORT 变量劫持导致页面打不开的问题；数据库自举先连不带库名的地址执行 CREATE DATABASE，再执行幂等脚本；口令自动探测依次尝试常见口令，试通后写回配置对象。这三件事决定了一键部署能否在陌生机器上一次成功。")
    body(doc, "图片资源经历过一次治理：早期点位与商品配图是脚本参数化生成的 SVG 场景插画，风格统一但与真实村落差距较大。改版时把 38 个主题的配图换成了从公开图库筛选并统一裁切为 4:3 的真实照片（每个主题三张同源不同景别，用于详情页图集），生成器只负责保留虚拟地图底图与品牌图形。资源目录分离为 photo 与 art 两个，自检脚本会扫描源码里所有图片引用并逐条校验文件存在，避免换图后留下死链。")
    body(doc, "前端状态管理上有两个容易踩的坑：Vue 2 对后来新增的对象属性不做响应式，选点后准星不刷新，需要用 $set 或整体替换；计算属性里用普通函数回调时 this 不是组件实例，一旦在回调里读 this.form 就会抛错并让整个弹窗渲染中断。两处都在迭代中修正并写进了团队记忆。")

    # ---------- 第 5 章 ----------
    heading(doc, "5  测试与部署", 1)
    heading(doc, "5.1  部署方案", 2)
    body(doc, "Windows 下双击一键部署.bat，脚本依次检查 Java 与 MySQL、探测数据库口令、写入本机配置、选择空闲端口、后台启动 fat jar 并打开浏览器。macOS 与 Linux 提供行为对等的 deploy.sh。两个脚本的配置解析逻辑由同一套回归测试守护，避免两边行为漂移。")
    body(doc, "重置演示数据需显式输入 YES，完成后自动把重置开关拨回 false，避免之后每次启动都清库。配置解析有个隐蔽的坑：配置文件里 port 这个键在 app 与 database 两个块下各有一个，早期按关键字全文件匹配导致第二次部署读到数据库端口，页面打不开。现在要求按块解析，并有专门的回归用例。")

    heading(doc, "5.2  测试方法与环境", 2)
    body(doc, "测试分三层：接口层用 Node 内置模块写的冒烟脚本，按业务流程串行调用真实接口并断言返回；界面层用本机 Chrome 无头模式与 Chrome DevTools Protocol 真跑三端页面，抓未捕获异常、控制台错误与 4xx/5xx 请求，并对关键 DOM 做断言；部署层用抽取脚本函数体的方式回归配置解析。三层都不依赖 npm 包，保证在离线机器上可跑。")
    body(doc, "测试环境为本机 Windows、JDK 17、MySQL 9.6、Chrome 155，服务以 fat jar 形式运行在 8080 端口，数据库为按种子脚本初始化的干净库。每轮测试开始前重置演示数据，测试产生的订单与测试账号在结束后清理。")

    heading(doc, "5.3  接口冒烟测试", 2)
    body(doc, "冒烟脚本覆盖认证、打卡、四类商品下单、库存不足、缺地址、商家拒绝协商、发货物流、研学与民宿流程、聊天收发商品卡与订单卡、举报与上诉、退款结算、AI 问答与防幻觉、权限矩阵、服务器管理与数据总览，共 160 项断言。脚本同时校验源码中所有图片引用是否指向真实文件，把「换图留死链」这类问题挡在提交之前。")
    caption(doc, "表 5-1  接口冒烟测试覆盖矩阵")
    grid_table(doc, [
        ["测试域", "覆盖要点", "断言数"],
        ["认证与会话", "注册、登录、改密、过期令牌、角色越权", "22"],
        ["点位与打卡", "列表、详情、打卡、重复打卡、印章结构", "16"],
        ["商城与订单", "加购、四类下单、库存与地址校验、状态流转", "38"],
        ["拒绝与协商", "商家拒绝填原因、买家同意或继续协商", "9"],
        ["物流与结算", "发货四节点、确认收货、结算流水幂等", "12"],
        ["聊天与举报", "会话、文本、商品卡、订单卡归属校验、上诉复核", "18"],
        ["AI 能力", "知识库命中、未命中不编造、降级", "8"],
        ["管理端", "账号、订单、商品、内容、服务器、二维码", "29"],
        ["资源与权限", "图片引用存在性、权限矩阵", "8"],
    ])

    heading(doc, "5.4  浏览器实机测试", 2)
    body(doc, "浏览器实机自检用无头 Chrome 把三端页面真的跑一遍，覆盖登录、首页集章扇图、点位打卡与详情、商城与商品详情、预约页、活动日历与详情、订单与订单详情、聊天、我的页、AI 助手、行程规划、村庄地图与地图选点、主题切换、过期令牌退回登录页等路径，同时对桌面 1440×900 与手机 430×932 两种视口分别验证布局，共 79 项断言。")
    body(doc, "界面断言不只判断元素存在，还校验尺寸与样式：聊天气泡必须有背景色与内边距、头像尺寸必须在这个区间内、图集必须有三张且有翻页控件、扇形图的点亮段数必须等于已打卡数、桌面导航每项必须真的渲染出图标宽度。这类断言能把「样式被覆盖」「资源没加载」这类不会抛异常的问题暴露出来。测试过程顺带产出 20 张关键页面截图，作为论文插图与交付材料。")
    add_image(doc, "visitor-09-activities.png", 6.5)
    caption(doc, "图 5-1  活动日历")
    add_image(doc, "visitor-06-orders.png", 6.5)
    caption(doc, "图 5-2  我的订单")
    add_image(doc, "visitor-08-booking.png", 6.5)
    caption(doc, "图 5-3  研学与民宿预约")
    add_image(doc, "visitor-17-gallery.png", 6.5)
    caption(doc, "图 5-4  商品详情图集")

    heading(doc, "5.5  部署配置回归与脚本自检", 2)
    body(doc, "部署配置解析回归从 deploy.ps1 与 deploy.sh 中抽取配置读取函数体直接执行，用多种配置文件样本验证取到的是 app 块下的端口而不是 database 块下的端口，共 36 项断言。脚本自检则检查批处理的 CRLF 与纯 ASCII、PowerShell 的 UTF-8 BOM、shell 脚本的 LF 与 shebang 与可执行位，保证跨平台交付不因编码问题失败。")

    heading(doc, "5.6  验收结论", 2)
    body(doc, "平台可启动、可部署；三端均可登录并完成核心流程；四种主题切换生效；游客端在电脑与手机浏览器下自适应正常；前后端接口、字段、权限与订单状态无错配；点位、商品与活动均具备三张以上图集，研学、民宿、农事体验与活动在详情页可看到位置地图，农产文创不显示位置图；虚拟地图覆盖 48 个位置并支持缩放与选点编辑。论文所描述的功能均以实际实现为依据，未编造未实现内容。")
    caption(doc, "表 5-2  自检结果汇总")
    grid_table(doc, [
        ["项目", "用例数", "结果"],
        ["接口冒烟测试", "160 项断言", "全部通过"],
        ["浏览器实机自检", "79 项断言", "全部通过"],
        ["部署配置解析回归", "36 项断言", "全部通过"],
        ["脚本编码自检", "6 个 bat / 2 个 ps1 / 6 个 sh", "全部通过"],
    ])

    # ---------- 第 6 章 ----------
    heading(doc, "6  总结", 1)
    body(doc, "本文完成大同村农商文旅智慧平台的设计与实现。平台沿用经过实机验证的单体后端架构与 18 表数据模型，保证接口兼容与数据一致性；游客端合并为一套响应式界面并以朱砂红为主色提供四主题切换；点位、商品与活动的配图统一替换为真实照片并补齐三张图集；新增的村落虚拟地图把点位、商品与活动放进同一张可缩放的手绘图上，商户与管理员都能直接在地图上标注位置。")
    body(doc, "在工程层面，本文更关注「能不能稳定交付」而不是「功能堆得多不多」：数据库结构变更做成幂等自补，部署脚本的配置解析有专门的回归用例，接口与界面各有一套不依赖 npm 的自检脚本，订单完成与结算绑定并保证幂等，视觉资源换过一轮后仍保证所有图片引用可解析。这些约束让平台在多次迭代后依然能一键部署、一键验收。")
    body(doc, "受时间与篇幅限制，系统仍有改进空间：账号密码应改为加盐哈希；主键生成可引入独立计数器表避免删除后复用；物流信息可接入真实快递查询；支付可对接微信或支付宝沙箱；虚拟地图目前是抽象坐标，若接入真实地理数据可支持导航；AI 可扩展向量检索以提升长文本问答质量。这些将作为后续学习和迭代的重点。")

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
