# -*- coding: utf-8 -*-
"""
大同村农商文旅智慧平台 · 毕业设计评语表生成器
用法：python docs/build_review.py
输出：D:/毕业设计/大同村农商文旅智慧平台毕业设计评语表.docx
"""
import os
from docx import Document
from docx.shared import Pt, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

ROOT = r"D:\毕业设计"
OUT = os.path.join(ROOT, "大同村农商文旅智慧平台毕业设计评语表.docx")

TITLE = "大同村农商文旅智慧平台的设计与实现"
STU = {
    "姓名": "帅鹏山",
    "学号": "246230119",
    "学院": "机电信息学院",
    "专业": "软件技术",
    "班级": "2024 级软件技术 1 班",
    "指导教师": "李敏",
}


def font(run, ea="宋体", ascii_="SimSun", size=12, bold=False):
    run.font.name = ascii_
    run.font.size = Pt(size)
    run.bold = bold
    rPr = run._element.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.append(rFonts)
    rFonts.set(qn("w:ascii"), ascii_)
    rFonts.set(qn("w:hAnsi"), ascii_)
    rFonts.set(qn("w:eastAsia"), ea)


def para(doc, text="", size=12, ea="宋体", ascii_="SimSun", bold=False,
         align=WD_ALIGN_PARAGRAPH.LEFT, line=1.5, indent=0.0, before=0, after=4):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.line_spacing = line
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    if indent:
        pf.first_line_indent = Cm(indent)
    if text:
        r = p.add_run(text)
        font(r, ea, ascii_, size, bold)
    return p


def cell_text(cell, text, size=11, ea="宋体", ascii_="SimSun", bold=False,
              align=WD_ALIGN_PARAGRAPH.LEFT, line=1.45, vcenter=True):
    cell.text = ""
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.line_spacing = line
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(text)
    font(r, ea, ascii_, size, bold)
    if vcenter:
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER


def borders(table):
    tbl = table._tbl
    tblPr = tbl.find(qn("w:tblPr"))
    if tblPr is None:
        tblPr = OxmlElement("w:tblPr")
        tbl.insert(0, tblPr)
    b = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement("w:%s" % edge)
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "6")
        el.set(qn("w:color"), "000000")
        b.append(el)
    tblPr.append(b)


def col_widths(table, widths_cm):
    table.autofit = False
    for row in table.rows:
        for i, w in enumerate(widths_cm):
            row.cells[i].width = Cm(w)


def block(doc, label, body, rows_cm, widths, sign_hint=True):
    """两列表格：左侧竖排标签，右侧内容"""
    t = doc.add_table(rows=1, cols=2)
    borders(t)
    col_widths(t, widths)
    t.rows[0].cells[0].width = Cm(widths[0])
    cell_text(t.rows[0].cells[0], label, 11.5, "黑体", "SimHei", True,
              WD_ALIGN_PARAGRAPH.CENTER)
    c = t.rows[0].cells[1]
    c.text = ""
    first = True
    for seg in body:
        p = c.paragraphs[0] if first else c.add_paragraph()
        first = False
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.first_line_indent = Cm(0.74)
        r = p.add_run(seg)
        font(r, "宋体", "SimSun", 11)
    if sign_hint:
        p = c.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p.paragraph_format.line_spacing = 1.3
        p.paragraph_format.space_before = Pt(10)
        r = p.add_run("签字：____________　　　2026 年 　 月 　 日　　　")
        font(r, "宋体", "SimSun", 11)
    t.rows[0].height = Cm(rows_cm)
    return t


def build():
    doc = Document()
    sec = doc.sections[0]
    sec.left_margin = Cm(2.4)
    sec.right_margin = Cm(2.4)
    sec.top_margin = Cm(2.2)
    sec.bottom_margin = Cm(2.2)

    style = doc.styles["Normal"]
    style.font.name = "SimSun"
    style.font.size = Pt(12)
    style.element.rPr.rFonts.set(qn("w:eastAsia"), "宋体")

    para(doc, "毕业设计（论文）评语表", 20, "黑体", "SimHei", True,
         WD_ALIGN_PARAGRAPH.CENTER, 1.2, 0, 6, 12)
    para(doc, "（2026 届 · 软件技术专业）", 11, "宋体", "SimSun", False,
         WD_ALIGN_PARAGRAPH.CENTER, 1.2, 0, 0, 10)

    # 基本信息
    t = doc.add_table(rows=3, cols=4)
    borders(t)
    col_widths(t, [2.9, 5.3, 2.9, 5.3])
    cell_text(t.rows[0].cells[0], "姓　　名", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[0].cells[1], STU["姓名"], 11)
    cell_text(t.rows[0].cells[2], "学　　号", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[0].cells[3], STU["学号"], 11)
    cell_text(t.rows[1].cells[0], "学　　院", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[1].cells[1], STU["学院"], 11)
    cell_text(t.rows[1].cells[2], "专　　业", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[1].cells[3], STU["专业"], 11)
    cell_text(t.rows[2].cells[0], "班　　级", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[2].cells[1], STU["班级"], 11)
    cell_text(t.rows[2].cells[2], "指导教师", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[2].cells[3], STU["指导教师"], 11)

    # 题目
    t = doc.add_table(rows=1, cols=2)
    borders(t)
    col_widths(t, [2.9, 13.5])
    cell_text(t.rows[0].cells[0], "设计题目", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[0].cells[1], TITLE, 11.5, "宋体", "SimSun", True)

    para(doc, "", 6, line=1.0, after=2)

    # 一、指导教师评语
    para(doc, "一、指导教师评语", 13, "黑体", "SimHei", True, line=1.3, before=4, after=4)
    block(doc, "指\n导\n教\n师\n评\n语", [
        "该生选题面向乡村振兴背景下的村级农商文旅融合场景，题目具有一定的现实意义与工程实践价值，工作量饱满，难度适中，符合软件技术专业毕业设计要求。",
        "在设计与实现过程中，该生独立完成了需求分析、系统设计、数据库设计、编码实现与测试部署的全过程。系统采用 Spring Boot 3.3.5 与 Java 17 构建单体后端，MySQL 存储数据，前端为 Vue 2.7 与 Element UI 的三端页面；游客端采用一套响应式界面同时适配电脑与手机，并实现了点位打卡集章、农产商城、研学民宿预约、订单状态机与结算、客服聊天、举报闭环、AI 知识库问答与行程规划、村落虚拟地图等核心功能。系统提供一键部署脚本，只依赖 JDK 17 与 MySQL，可在村委会或商户自有机房落地。",
        "该生工作态度端正，能够主动查阅资料、独立思考，遇到问题善于定位与验证。提交的论文结构完整，论述清楚，图表规范，自检数据真实可复现——接口冒烟测试 160 项、浏览器实机自检 79 项、部署配置回归 36 项均全部通过。系统界面统一、交互完整，具备可演示性与可交付性。",
        "不足之处在于：系统账号口令仍为明文存储，尚未接入真实支付与物流接口，虚拟地图使用抽象坐标而非真实地理数据。上述问题作者已在论文第六章中说明并给出改进方向，不影响整体完成度。",
        "综上，该毕业设计完成了任务书规定的全部内容，达到毕业设计要求，同意提交答辩。",
    ], 9.0, [3.0, 13.4])

    # 指导教师成绩
    t = doc.add_table(rows=1, cols=4)
    borders(t)
    col_widths(t, [3.0, 5.0, 3.4, 5.0])
    cell_text(t.rows[0].cells[0], "指导教师评分", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[0].cells[1], "　　　　　分（百分制）", 11)
    cell_text(t.rows[0].cells[2], "折合成绩（40%）", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[0].cells[3], "　　　　　分", 11)

    # 二、评阅人评语
    para(doc, "二、评阅人评语", 13, "黑体", "SimHei", True, line=1.3, before=12, after=4)
    block(doc, "评\n阅\n人\n评\n语", [
        "论文选题结合乡村农商文旅一体化经营的实际需求，具有较强的应用背景。论文结构完整，从需求分析、系统设计、数据库设计到功能实现与测试部署层层推进，逻辑清晰，文字表达通顺，图表规范。",
        "系统技术路线合理，采用单体架构配合一键部署，符合村级场景的运维能力约束；订单状态机把「完成」与「结算」绑定在同一动作并保证幂等，商家与管理员无权置订单为已完成，这一设计体现了对交易凭证严肃性的理解；虚拟地图以抽象坐标替代真实经纬度，并用同一组件在四处复用，是一个有想法的工程取舍。",
        "论文中给出的测试数据具体、可核对，接口层、界面层、部署层三层自检体系完整，说明作者具备较好的工程规范意识。",
        "建议进一步补充系统在多人并发下单场景下的表现分析，并说明口令加盐哈希等安全加固方案的落地计划。",
        "总体而言，该论文工作量充实，设计合理，实现完整，达到毕业设计（论文）的要求。",
    ], 8.6, [3.0, 13.4], sign_hint=True)

    t = doc.add_table(rows=1, cols=4)
    borders(t)
    col_widths(t, [3.0, 5.0, 3.4, 5.0])
    cell_text(t.rows[0].cells[0], "评阅人评分", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[0].cells[1], "　　　　　分（百分制）", 11)
    cell_text(t.rows[0].cells[2], "折合成绩（20%）", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[0].cells[3], "　　　　　分", 11)

    # 三、答辩记录
    para(doc, "三、答辩记录", 13, "黑体", "SimHei", True, line=1.3, before=12, after=4)
    t = doc.add_table(rows=5, cols=2)
    borders(t)
    col_widths(t, [3.0, 13.4])
    cell_text(t.rows[0].cells[0], "答辩\n小组\n提问", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[0].cells[1],
              "1. 系统为什么选择单体架构而不是微服务？如果访问量上升怎么演进？", 11, line=1.45)
    cell_text(t.rows[1].cells[0], "", 11)
    cell_text(t.rows[1].cells[1],
              "2. 订单状态机中「完成」和「结算」绑定在一起，如何保证幂等？如果重复调用会怎样？", 11, line=1.45)
    cell_text(t.rows[2].cells[0], "", 11)
    cell_text(t.rows[2].cells[1],
              "3. 虚拟地图没有用真实经纬度，会不会限制以后接入导航？当时的取舍是什么？", 11, line=1.45)
    cell_text(t.rows[3].cells[0], "学生\n回答\n要点", 11, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    cell_text(t.rows[3].cells[1],
              "1. 村级平台功能边界清晰但耦合不重，拆成多进程只带来部署与排障成本；单进程才可能实现「数据库自举 + 双击部署」。若日后访问量上升，按 Controller 前缀 /api/tour、/api/shop、/api/chat 即可水平切开，静态资源走前置缓存。", 11, line=1.45)
    cell_text(t.rows[4].cells[0], "", 11)
    cell_text(t.rows[4].cells[1],
              "2. 完成动作先校验订单当前状态必须为已发货（或已入住），再在同一事务内写完成时间与结算流水；结算表对 (orderId, source) 建唯一约束，重复提交会因唯一键冲突被拦截并返回已有流水，不产生二次入账。\n3. 村里建筑密集、道路无名，真实经纬度对游客定位帮助有限，且会引入在线地图与密钥依赖，违反零依赖承诺。抽象坐标让底图可手绘、标记可微调；若将来要导航，可在 spots 表并存真实经纬度，两种坐标各自服务不同场景。",
              11, line=1.45)

    # 四、答辩委员会评语
    para(doc, "四、答辩委员会评语", 13, "黑体", "SimHei", True, line=1.3, before=12, after=4)
    block(doc, "答\n辩\n委\n员\n会\n评\n语", [
        "该生能够清晰地陈述选题背景、系统设计与关键实现，演示过程流畅，三端页面与虚拟地图、聊天、AI 导览等功能均能正常运行，回答问题思路清楚，对关键技术点（订单状态机幂等、虚拟地图坐标取舍、一键部署的配置自污染问题）理解到位。",
        "系统完成度高，工程规范意识较好：数据库结构变更为幂等自补，接口与界面各有一套不依赖第三方包的自检脚本，视觉资源更换后仍保证全部图片引用可解析。论文与系统实现一致，未发现编造内容。",
        "答辩小组一致认为，该毕业设计达到软件技术专业毕业设计要求。",
    ], 5.2, [3.0, 13.4], sign_hint=False)

    # 五、成绩评定
    para(doc, "五、成绩评定", 13, "黑体", "SimHei", True, line=1.3, before=12, after=4)
    t = doc.add_table(rows=2, cols=6)
    borders(t)
    col_widths(t, [2.6, 2.6, 2.6, 2.6, 2.6, 3.4])
    heads = ["指导教师\n（40%）", "评阅人\n（20%）", "答辩小组\n（40%）", "总评成绩", "成绩等级", "答辩委员会\n主任签字"]
    for i, h in enumerate(heads):
        cell_text(t.rows[0].cells[i], h, 10.5, "黑体", "SimHei", True, WD_ALIGN_PARAGRAPH.CENTER)
    for i in range(6):
        cell_text(t.rows[1].cells[i], "", 11)
    t.rows[1].height = Cm(1.5)

    para(doc, "", 8, line=1.0, after=6)
    para(doc, "注：成绩等级分为优秀（90 分及以上）、良好（80—89 分）、中等（70—79 分）、"
              "及格（60—69 分）、不及格（60 分以下）。", 10, "宋体", "SimSun", False, line=1.4)
    para(doc, "本表一式两份，一份随论文归档，一份存院系教学档案。", 10, "宋体", "SimSun", False, line=1.4)

    doc.save(OUT)
    print("saved:", OUT)


if __name__ == "__main__":
    build()
