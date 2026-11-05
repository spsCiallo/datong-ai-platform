#!/usr/bin/env node
/* ============================================================================
 *  大同村 · 视觉资源生成器（零 npm 依赖，裸 Node 运行）
 *
 *  点位 / 商品 / 活动的配图已换成真实照片（static/assets/img/photo/，由人工挑选并裁切），
 *  本脚本不再生成场景插画，只负责「程序化图形」资产与虚拟地图底图：
 *    assets/img/art/map-village.svg   虚拟地图底图（俯视手绘，1000×700，无文字）
 *    assets/img/logo.svg              平台标
 *    assets/img/favicon-datong.svg    站点图标（文件名带版本，绕开浏览器强缓存）
 *    assets/img/hero.svg              登录页主视觉
 *    assets/img/pattern.svg           纹样
 *    assets/img/seal.svg              印章
 *    assets/img/empty.svg             空状态
 *    assets/img/avatar-*.svg          三端默认头像
 *    assets/img/icons.svg             图标 sprite（<symbol>）
 *
 *  用法：node tools/make-art.js
 *  改了配色或构图，重跑一次即可整体重绘（幂等覆盖）。
 * ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ART = path.join(ROOT, 'server', 'src', 'main', 'resources', 'static', 'assets', 'img');
const ART_DIR = path.join(ART, 'art');

/* ------------------------------ 小工具 ------------------------------ */

function svg(w, h, body, extra) {
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '"'
    + (extra || ' width="' + w + '" height="' + h + '"') + '>\n' + body + '</svg>\n';
}

function lin(id, stops, x1, y1, x2, y2) {
  return '<linearGradient id="' + id + '" x1="' + (x1 || 0) + '" y1="' + (y1 || 0)
    + '" x2="' + (x2 === undefined ? 0 : x2) + '" y2="' + (y2 === undefined ? 1 : y2) + '">'
    + stops.map(function (s) {
      return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"'
        + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : '') + '/>';
    }).join('') + '</linearGradient>';
}

function rad(id, stops) {
  return '<radialGradient id="' + id + '">'
    + stops.map(function (s) {
      return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"'
        + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : '') + '/>';
    }).join('') + '</radialGradient>';
}

/* 场景三档光照：白昼 / 黄昏 / 暮色（图集 b / c 用） */
const LIGHT = {
  day: {
    sky: [['0%', '#8ED6E8'], ['55%', '#C8E8DE'], ['100%', '#F6EFE0']],
    sun: '#F7D774', sunOp: .95,
    far: '#B98A6B', mid: '#C0392B', near: '#8E5B3A',
    field: ['#E8B84B', '#D4972E', '#C77B1F'],
    water: '#7FC4C9', land: '#E4D4B8', roof: '#A62B20', wall: '#F0E4D6',
    tree: '#4E7A52', haze: .18
  },
  dusk: {
    sky: [['0%', '#F5B57A'], ['50%', '#E88A6A'], ['100%', '#C0392B']],
    sun: '#FBD9A0', sunOp: .9,
    far: '#8E5B4A', mid: '#7A1E14', near: '#5C3A28',
    field: ['#D4972E', '#B4761E', '#8E5B1A'],
    water: '#D98A6A', land: '#D8B896', roof: '#6E130E', wall: '#E8CBB4',
    tree: '#3A5A40', haze: .28
  },
  night: {
    sky: [['0%', '#1A2238'], ['60%', '#2A3A5C'], ['100%', '#4A3A5C']],
    sun: '#E8EEF6', sunOp: .9,
    far: '#2A2438', mid: '#3A2230', near: '#241C28',
    field: ['#3A4A2A', '#2A3A22', '#1E2A18'],
    water: '#3A5A6C', land: '#3A3028', roof: '#5C1A14', wall: '#4A3A30',
    tree: '#1E3226', haze: .4
  }
};

function defs(l, uid) {
  return '<defs>'
    + lin('sky' + uid, l.sky)
    + lin('water' + uid, [['0%', l.water], ['100%', l.water]])
    + rad('glow' + uid, [['0%', l.sun, .8], ['70%', l.sun, 0]])
    + '</defs>';
}

function sky(l, uid, sunX, sunY, sunR) {
  return '<rect width="800" height="600" fill="url(#sky' + uid + ')"/>'
    + '<circle cx="' + sunX + '" cy="' + sunY + '" r="' + (sunR * 2.4) + '" fill="url(#glow' + uid + ')"/>'
    + '<circle cx="' + sunX + '" cy="' + sunY + '" r="' + sunR + '" fill="' + l.sun + '" opacity="' + l.sunOp + '"/>';
}

function hills(l) {
  return '<path d="M0 360 Q160 300 320 340 T800 330 V600 H0 Z" fill="' + l.far + '" opacity=".8"/>'
    + '<path d="M0 400 Q200 340 400 380 T800 370 V600 H0 Z" fill="' + l.mid + '" opacity=".85"/>';
}

function fieldRows(l, y0, colorIdx) {
  let s = '<rect x="0" y="' + y0 + '" width="800" height="' + (600 - y0) + '" fill="' + l.field[colorIdx] + '"/>';
  for (let i = 0; i < 8; i++) {
    const y = y0 + 18 + i * 22;
    s += '<path d="M0 ' + y + ' Q200 ' + (y - 8) + ' 400 ' + y + ' T800 ' + (y + 4)
      + '" stroke="' + l.field[(colorIdx + 1) % 3] + '" stroke-width="3" fill="none" opacity=".5"/>';
  }
  return s;
}

function river(l) {
  return '<path d="M0 470 Q200 440 400 470 T800 450 V600 H0 Z" fill="' + l.water + '" opacity=".9"/>'
    + '<path d="M40 500 Q220 480 400 500 T760 490" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".35"/>';
}

function cloud(x, y, s, op) {
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" opacity="' + (op || .8) + '">'
    + '<ellipse cx="0" cy="0" rx="46" ry="16" fill="#FFFFFF"/>'
    + '<ellipse cx="-24" cy="6" rx="28" ry="12" fill="#FFFFFF"/>'
    + '<ellipse cx="26" cy="4" rx="30" ry="13" fill="#FFFFFF"/></g>';
}

function bird(x, y, s) {
  return '<path d="M' + x + ' ' + y + ' q' + (6 * s) + ' -' + (6 * s) + ' ' + (12 * s) + ' 0 q' + (6 * s) + ' -' + (6 * s) + ' ' + (12 * s) + ' 0"'
    + ' stroke="#3A2A20" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/>';
}

function house(x, y, s, l) {
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">'
    + '<rect x="-34" y="0" width="68" height="42" fill="' + l.wall + '"/>'
    + '<path d="M-44 0 L0 -30 L44 0 Z" fill="' + l.roof + '"/>'
    + '<rect x="-10" y="14" width="20" height="28" fill="' + l.roof + '" opacity=".85"/>'
    + '<rect x="14" y="10" width="12" height="12" fill="' + l.sky ? l.wall : l.wall + '" opacity=".0"/>'
    + '</g>';
}

function tree(x, y, s, l) {
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">'
    + '<rect x="-4" y="0" width="8" height="26" fill="#6B4A32"/>'
    + '<circle cx="0" cy="-12" r="18" fill="' + l.tree + '"/>'
    + '<circle cx="-12" cy="-4" r="12" fill="' + l.tree + '" opacity=".85"/>'
    + '<circle cx="12" cy="-4" r="12" fill="' + l.tree + '" opacity=".85"/></g>';
}

function flower(x, y, s, color) {
  const c = color || '#F5C518';
  return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">'
    + '<line x1="0" y1="0" x2="0" y2="14" stroke="#4E7A3A" stroke-width="2"/>'
    + [0, 72, 144, 216, 288].map(function (a) {
      const r = a * Math.PI / 180;
      return '<circle cx="' + (Math.cos(r) * 5).toFixed(1) + '" cy="' + (-8 + Math.sin(r) * 5).toFixed(1)
        + '" r="3.4" fill="' + c + '"/>';
    }).join('')
    + '<circle cx="0" cy="-8" r="3" fill="#C77B1F"/></g>';
}

function star(x, y, r, op) {
  return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#FFFFFF" opacity="' + (op || .8) + '"/>';
}

function vignette() {
  return '<rect width="800" height="600" fill="url(#vig)" opacity=".18"/>'
    + '<defs>' + rad('vig', [['0%', '#000000', 0], ['78%', '#000000', 0], ['100%', '#000000', .55]]) + '</defs>';
}

function frame(title) {
  return '<g font-family="PingFang SC, Microsoft YaHei, sans-serif">'
    + '<rect x="18" y="18" width="120" height="30" rx="15" fill="#C0392B" opacity=".92"/>'
    + '<text x="78" y="38" text-anchor="middle" font-size="14" fill="#FFF" font-weight="600">' + title + '</text></g>';
}

/* ---------------------- 虚拟地图底图（俯视手绘） ---------------------- */

/* 1000×700 的村域底图：纸底 + 桑干河 + 黄花田格纹 + 村舍聚落 + 台地等高线
 * + 道路 + 树丛，右下角指北针与比例尺，左上角刻意留白给前端叠标题。
 * 不写任何文字：点位名由前端 HTML 按 x∈[0,1000]、y∈[0,700] 叠加。 */
function mHouse(x, y, s, rot) {
  return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')">'
    + '<rect x="-15" y="-11" width="30" height="22" rx="2" fill="#FBF6EC" stroke="#C8B49A" stroke-width="1.2"/>'
    + '<path d="M-19 -11 L0 -23 L19 -11 Z" fill="#B34A34"/>'
    + '<rect x="-5" y="1" width="10" height="10" fill="#8E5B1A" opacity=".5"/>'
    + '</g>';
}

function mTree(x, y, r) {
  return '<g transform="translate(' + x + ' ' + y + ')">'
    + '<circle cx="0" cy="0" r="' + r + '" fill="#4E7A52" opacity=".85"/>'
    + '<circle cx="' + (-r * .8).toFixed(1) + '" cy="' + (r * .5).toFixed(1) + '" r="' + (r * .7).toFixed(1) + '" fill="#4E7A52" opacity=".7"/>'
    + '<circle cx="' + (r * .85).toFixed(1) + '" cy="' + (r * .4).toFixed(1) + '" r="' + (r * .65).toFixed(1) + '" fill="#3F6644" opacity=".65"/>'
    + '</g>';
}

function mapVillageSvg() {
  const W = 1000, H = 700;
  let s = '';

  /* 纸底与版心：外圈留白用更沉的米色，版心才是可画区域 */
  s += '<rect width="' + W + '" height="' + H + '" fill="#EDE3D0"/>'
    + '<rect x="26" y="26" width="948" height="648" rx="10" fill="#F6EFE0"/>'
    + '<defs>'
    + '<clipPath id="paper"><rect x="26" y="26" width="948" height="648" rx="10"/></clipPath>'
    + '<pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">'
    + '<path d="M50 0 V50 M0 50 H50" stroke="#C77B1F" stroke-width="1" opacity=".12"/></pattern>'
    + '<pattern id="field" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(34)">'
    + '<rect width="20" height="20" fill="#E8B84B"/><rect width="10" height="20" fill="#EFC763"/></pattern>'
    + '<pattern id="field2" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)">'
    + '<rect width="16" height="16" fill="#E2AE3E"/><rect width="8" height="16" fill="#EBBE5C"/></pattern>'
    + lin('riv', [['0%', '#8FCBD2'], ['50%', '#A9DBE0'], ['100%', '#7FBDC6']], 0, 0, 1, 0)
    + '</defs>';

  s += '<g clip-path="url(#paper)">';

  /* 淡淡网格：整版铺一层，压住纸底显得像绘图纸 */
  s += '<rect x="26" y="26" width="948" height="648" fill="url(#grid)"/>';

  /* 台地等高线：三层细曲线，低透明度，只在上半部体现地势抬升 */
  s += '<g stroke="#C77B1F" fill="none" opacity=".22">'
    + '<path d="M-20 268 Q160 226 340 252 T700 214 T1020 238" stroke-width="2"/>'
    + '<path d="M-20 232 Q170 190 350 216 T710 178 T1020 202" stroke-width="1.6" opacity=".8"/>'
    + '<path d="M-20 196 Q180 156 360 182 T720 146 T1020 168" stroke-width="1.4" opacity=".6"/>'
    + '<path d="M-20 160 Q190 122 370 148 T730 114 T1020 136" stroke-width="1.2" opacity=".45"/>'
    + '</g>'
    + '<g stroke="#C77B1F" fill="none" opacity=".16">'
    + '<path d="M120 640 Q300 610 480 634 T860 600" stroke-width="1.6"/>'
    + '<path d="M140 674 Q320 644 500 668 T880 634" stroke-width="1.4"/>'
    + '</g>';

  /* 黄花田：六块斜纹地，角度各不相同，避免看起来是贴图 */
  s += '<g opacity=".92">'
    + '<rect x="20" y="210" width="260" height="180" fill="url(#field)" transform="rotate(-12 150 300)"/>'
    + '<rect x="360" y="120" width="220" height="140" fill="url(#field2)" transform="rotate(9 470 190)"/>'
    + '<rect x="512" y="96" width="220" height="150" fill="url(#field)" transform="rotate(-7 622 171)"/>'
    + '<rect x="770" y="136" width="180" height="170" fill="url(#field2)" transform="rotate(14 860 221)"/>'
    + '<rect x="580" y="490" width="240" height="140" fill="url(#field)" transform="rotate(-9 700 560)"/>'
    + '<rect x="150" y="585" width="200" height="110" fill="url(#field2)" transform="rotate(6 250 640)"/>'
    + '</g>'
    /* 田埂：每块地压两道深色细线，交代垄沟 */
    + '<g stroke="#C77B1F" stroke-width="2" fill="none" opacity=".35">'
    + '<path d="M30 262 Q150 244 268 262"/><path d="M28 316 Q150 298 272 316"/>'
    + '<path d="M372 158 Q470 142 572 160"/><path d="M366 206 Q470 190 578 208"/>'
    + '<path d="M600 516 Q700 498 812 516"/><path d="M596 560 Q700 542 816 560"/>'
    + '</g>';

  /* 道路：土黄粗线 + 中间一条浅色车辙，画在河与田之上、村舍之下 */
  /* 四条路都画到版心外再被 clipPath 裁掉，避免出现断头的“半截路” */
  const ROADS = [
    'M-20 692 Q240 638 420 606 T780 540 T1020 502',
    'M470 620 Q452 420 462 240 T436 -30',
    'M706 566 Q726 458 764 398 T806 -30',
    'M244 660 Q214 520 198 400 T164 20'
  ];
  s += '<g fill="none" stroke-linecap="round" stroke-linejoin="round">'
    + '<g stroke="#D8BC90" stroke-width="15">'
    + ROADS.map(function (d) { return '<path d="' + d + '"/>'; }).join('')
    + '</g>'
    + '<g stroke="#C9A26A" stroke-width="10">'
    + ROADS.map(function (d) { return '<path d="' + d + '"/>'; }).join('')
    + '</g>'
    /* 车辙只给主干两条，细虚线，太密会抢村舍的注意力 */
    + '<g stroke="#E6D3AE" stroke-width="2.6" stroke-dasharray="14 12" opacity=".85">'
    + '<path d="' + ROADS[0] + '"/><path d="' + ROADS[1] + '"/>'
    + '</g></g>';

  /* 桑干河：左下入画、向右上游收窄，宽度渐变靠上下两条边分开控制 */
  s += '<path d="M-30 540 Q120 498 224 522 T432 468 T624 428 T824 358 T1030 328'
    + ' L1030 382 T824 414 T624 484 T432 526 T224 578 T-30 596 Z" fill="url(#riv)" opacity=".95"/>'
    + '<path d="M-30 540 Q120 498 224 522 T432 468 T624 428 T824 358 T1030 328"'
    + ' stroke="#6FAEB8" stroke-width="2" fill="none" opacity=".45"/>'
    /* 河心波纹：三道细白线，越靠下游越长 */
    + '<g stroke="#FFFFFF" fill="none" opacity=".5">'
    + '<path d="M20 556 Q120 534 214 548" stroke-width="2.6"/>'
    + '<path d="M300 508 Q400 486 500 496" stroke-width="2.4"/>'
    + '<path d="M620 456 Q720 432 820 402" stroke-width="2.2"/>'
    + '<path d="M860 386 Q920 372 986 358" stroke-width="1.8"/>'
    + '</g>'
    /* 河滩浅色边，压出水面与岸的分界 */
    + '<path d="M-30 596 Q224 578 432 526 T624 484 T824 414 T1030 382"'
    + ' stroke="#E8DCC0" stroke-width="7" fill="none" opacity=".75"/>';

  /* 村舍聚落：五组团，共 28 栋，朝向略有旋转，成组而不是散点 */
  const CLUSTERS = [
    [[150, 224, 1, -8], [186, 210, .92, 6], [152, 262, .95, -4], [196, 252, .88, 10], [124, 190, .8, 0], [212, 226, .85, -6]],
    [[318, 296, .95, 7], [352, 282, .9, -5], [322, 334, .88, 3], [362, 320, .82, 8], [292, 322, .78, -3]],
    [[506, 296, .98, -6], [544, 284, .9, 5], [512, 338, .92, 4], [552, 326, .86, -8], [478, 330, .8, 2], [566, 302, .76, 6]],
    [[726, 214, .92, 8], [762, 202, .86, -4], [734, 256, .88, 2], [772, 244, .8, 7], [704, 248, .74, -2]],
    [[842, 596, .96, -5], [880, 584, .9, 6], [848, 638, .88, 3], [888, 626, .84, -7], [812, 618, .78, 4], [906, 604, .74, 0]]
  ];
  CLUSTERS.forEach(function (c) {
    c.forEach(function (h) { s += mHouse(h[0], h[1], h[2], h[3]); });
  });

  /* 树丛点缀：沿路、沿河、村口成簇，圆点堆叠出树冠 */
  const TREES = [
    [92, 470, 11], [118, 500, 9], [262, 180, 10], [288, 156, 8], [408, 262, 9],
    [438, 288, 11], [612, 350, 10], [640, 372, 8], [806, 268, 9], [834, 292, 11],
    [700, 646, 10], [668, 664, 8], [940, 452, 9], [962, 478, 8], [56, 340, 8],
    [478, 640, 9], [506, 660, 7], [906, 148, 9], [258, 560, 10], [352, 556, 8]
  ];
  TREES.forEach(function (t) { s += mTree(t[0], t[1], t[2]); });

  /* 左上角留白区：只给一块更亮的纸面，不写任何字，前端叠标题 */
  s += '<rect x="56" y="50" width="288" height="104" rx="8" fill="#FBF7EF" opacity=".78"/>'
    + '<rect x="56" y="50" width="288" height="104" rx="8" fill="none" stroke="#C77B1F"'
    + ' stroke-width="1.4" stroke-dasharray="9 8" opacity=".3"/>';

  /* 右下角装饰：指北针 + 比例尺 */
  s += '<g transform="translate(908 578)">'
    + '<circle cx="0" cy="0" r="38" fill="#FBF7EF" opacity=".85"/>'
    + '<circle cx="0" cy="0" r="38" fill="none" stroke="#8E5B1A" stroke-width="2" opacity=".55"/>'
    + '<circle cx="0" cy="0" r="29" fill="none" stroke="#C77B1F" stroke-width="1" opacity=".35"/>'
    + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) {
      const r = a * Math.PI / 180;
      return '<line x1="' + (Math.cos(r) * 33).toFixed(1) + '" y1="' + (Math.sin(r) * 33).toFixed(1)
        + '" x2="' + (Math.cos(r) * 37).toFixed(1) + '" y2="' + (Math.sin(r) * 37).toFixed(1)
        + '" stroke="#8E5B1A" stroke-width="1.6" opacity=".5"/>';
    }).join('')
    + '<path d="M0 -27 L9 0 L0 8 L-9 0 Z" fill="#B34A34"/>'
    + '<path d="M0 27 L9 0 L0 -8 L-9 0 Z" fill="#A8A29A" opacity=".8"/>'
    + '<circle cx="0" cy="0" r="3.4" fill="#FBF7EF" stroke="#8E5B1A" stroke-width="1.6"/>'
    + '</g>'
    /* 比例尺：四段黑白相间，两端加短竖线 */
    + '<g transform="translate(742 636)">'
    + [0, 1, 2, 3].map(function (i) {
      return '<rect x="' + (i * 26) + '" y="0" width="26" height="9" fill="' + (i % 2 ? '#FBF7EF' : '#8E5B1A') + '"'
        + ' stroke="#8E5B1A" stroke-width="1" opacity=".85"/>';
    }).join('')
    + '<path d="M0 -5 V14 M104 -5 V14" stroke="#8E5B1A" stroke-width="1.6" opacity=".7"/>'
    + '</g>';

  s += '</g>';

  /* 版心描边：手绘感的双线外框 */
  s += '<rect x="26" y="26" width="948" height="648" rx="10" fill="none" stroke="#C77B1F" stroke-width="2.4" opacity=".4"/>'
    + '<rect x="34" y="34" width="932" height="632" rx="7" fill="none" stroke="#C77B1F" stroke-width="1" opacity=".25"/>';

  return svg(W, H, s, ' width="1000" height="700" preserveAspectRatio="xMidYMid slice"');
}

/* ------------------------------ 品牌件 ------------------------------ */

function logoSvg() {
  return svg(96, 96,
    '<defs>' + lin('lg', [['0%', '#E74C3C'], ['100%', '#8E1E14']]) + '</defs>'
    + '<rect x="4" y="4" width="88" height="88" rx="22" fill="url(#lg)"/>'
    + '<path d="M28 30 H68 M48 30 V66 M36 66 H60" stroke="#FFF" stroke-width="7" stroke-linecap="round" fill="none"/>'
    + '<circle cx="70" cy="66" r="7" fill="#F5C518"/>'
    + '<path d="M22 78 Q48 70 74 78" stroke="#F5C518" stroke-width="4" fill="none" stroke-linecap="round"/>');
}

/* 站点图标：红底 + 白色「大」字 + 金色黄花点。
   文件名带 datong，是为了避开浏览器对旧站 favicon.svg 的强缓存——
   同名文件即使内容换了，Chrome 也可能几个月不重新请求。 */
function faviconSvg() {
  return svg(64, 64,
    '<rect width="64" height="64" rx="14" fill="#C0392B"/>'
    + '<path d="M18 20 H46 M32 20 V44 M22 44 H42" stroke="#FFF" stroke-width="5" stroke-linecap="round" fill="none"/>'
    + '<circle cx="46" cy="44" r="5" fill="#F5C518"/>');
}

function heroSvg() {
  const l = LIGHT.dusk, u = 'h';
  return svg(1200, 640,
    '<defs>' + lin('skyh', l.sky) + rad('glowh', [['0%', l.sun, .85], ['70%', l.sun, 0]])
    + rad('vigh', [['0%', '#000', 0], ['75%', '#000', 0], ['100%', '#000', .5]]) + '</defs>'
    + '<rect width="1200" height="640" fill="url(#skyh)"/>'
    + '<circle cx="880" cy="160" r="120" fill="url(#glowh)"/>'
    + '<circle cx="880" cy="160" r="46" fill="' + l.sun + '"/>'
    + cloud(240, 140, 1.4, .8) + cloud(520, 100, 1.1, .7)
    + '<path d="M0 380 Q200 300 400 340 T800 320 T1200 350 V640 H0 Z" fill="' + l.far + '" opacity=".85"/>'
    + '<path d="M0 440 Q240 370 480 410 T1200 400 V640 H0 Z" fill="' + l.mid + '" opacity=".9"/>'
    + '<g transform="translate(280 360)">'
    + '<rect x="-70" y="0" width="140" height="80" rx="8" fill="' + l.wall + '"/>'
    + '<path d="M-84 0 L0 -48 L84 0 Z" fill="' + l.roof + '"/>'
    + '<rect x="-14" y="30" width="28" height="50" fill="' + l.roof + '"/>'
    + '</g>'
    + '<g transform="translate(520 380)">'
    + '<rect x="-50" y="0" width="100" height="60" rx="6" fill="' + l.wall + '"/>'
    + '<path d="M-60 0 L0 -36 L60 0 Z" fill="' + l.roof + '"/>'
    + '</g>'
    + tree(760, 440, 1.6, l) + tree(980, 460, 1.3, l)
    + fieldRows(l, 470, 0)
    + river(l)
    + flower(140, 560, 1.4) + flower(220, 580, 1.2) + flower(1040, 570, 1.3) + flower(1120, 590, 1.1)
    + bird(400, 200, 1.4) + bird(460, 170, 1.1) + bird(340, 240, .9)
    + '<rect width="1200" height="640" fill="url(#vigh)" opacity=".22"/>');
}

function patternSvg() {
  let s = '<defs><pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse">'
    + '<rect width="80" height="80" fill="none"/>'
    + '<path d="M40 12 Q48 28 40 40 Q32 28 40 12 Z" fill="#C0392B" opacity=".16"/>'
    + '<circle cx="14" cy="64" r="5" fill="#C77B1F" opacity=".18"/>'
    + '<circle cx="66" cy="20" r="4" fill="#C0392B" opacity=".14"/>'
    + '<path d="M8 40 H24 M56 56 H72" stroke="#C77B1F" stroke-width="2" opacity=".15"/>'
    + '</pattern></defs><rect width="240" height="240" fill="url(#p)"/>';
  return svg(240, 240, s, ' width="240" height="240"');
}

function sealSvg() {
  return svg(120, 120,
    '<circle cx="60" cy="60" r="54" fill="none" stroke="#C0392B" stroke-width="6"/>'
    + '<circle cx="60" cy="60" r="42" fill="#C0392B"/>'
    + '<text x="60" y="72" text-anchor="middle" font-size="34" fill="#FFF" font-family="KaiTi, STKaiti, serif" font-weight="700">同</text>'
    + '<path d="M60 8 V16 M60 104 V112 M8 60 H16 M104 60 H112" stroke="#C0392B" stroke-width="5"/>');
}

function emptySvg() {
  return svg(160, 140,
    '<ellipse cx="80" cy="118" rx="52" ry="10" fill="#C0392B" opacity=".12"/>'
    + '<rect x="46" y="56" width="68" height="52" rx="8" fill="#F5C6C0"/>'
    + '<path d="M46 56 L80 30 L114 56 Z" fill="#C0392B"/>'
    + '<rect x="72" y="80" width="16" height="28" rx="4" fill="#8E1E14"/>'
    + '<circle cx="120" cy="40" r="14" fill="#F5C518" opacity=".8"/>'
    + '<path d="M28 44 q6 -8 12 0" stroke="#C77B1F" stroke-width="3" fill="none"/>');
}

function avatarSvg(kind) {
  /* 三款扁平头像：管理员（制服+帽）/ 商户（围裙）/ 游客（草帽） */
  const skin = '#F5D0B0', bg = kind === 'admin' ? '#1D4ED8' : kind === 'merchant' ? '#C0392B' : '#C77B1F';
  let extra = '';
  if (kind === 'admin') {
    extra = '<path d="M32 52 Q48 40 64 52 L64 70 H32 Z" fill="#1D4ED8"/>'
      + '<rect x="30" y="34" width="36" height="10" rx="5" fill="#153AA8"/>'
      + '<circle cx="48" cy="26" r="14" fill="' + skin + '"/>';
  } else if (kind === 'merchant') {
    extra = '<path d="M30 54 Q48 42 66 54 L66 72 H30 Z" fill="#FDECEA"/>'
      + '<path d="M42 54 L48 72 L54 54 Z" fill="#C0392B"/>'
      + '<circle cx="48" cy="28" r="15" fill="' + skin + '"/>'
      + '<path d="M34 24 Q48 14 62 24" stroke="#2A2018" stroke-width="4" fill="none"/>';
  } else {
    extra = '<path d="M28 56 Q48 44 68 56 L68 72 H28 Z" fill="#E8D4A8"/>'
      + '<ellipse cx="48" cy="22" rx="26" ry="8" fill="#D4B896"/>'
      + '<circle cx="48" cy="28" r="14" fill="' + skin + '"/>'
      + '<path d="M36 20 Q48 10 60 20" stroke="#C77B1F" stroke-width="4" fill="none"/>';
  }
  return svg(96, 96,
    '<defs>' + lin('av' + kind, [['0%', bg], ['100%', '#8E1E14']]) + '</defs>'
    + '<rect width="96" height="96" rx="48" fill="url(#av' + kind + ')"/>'
    + extra);
}

/* ------------------------------ 图标 sprite ------------------------------ */

/* 24×24 线性图标，stroke 用 currentColor，页面按需着色 */
const ICONS = {
  'i-info': '<circle cx="12" cy="12" r="9"/><path d="M12 11 v5 M12 8 v.5"/>',
  'i-flower': '<circle cx="12" cy="12" r="3"/>'
    + [0, 72, 144, 216, 288].map(function (a) {
      const r = a * Math.PI / 180;
      return '<circle cx="' + (12 + Math.cos(r) * 6).toFixed(1) + '" cy="' + (12 + Math.sin(r) * 6).toFixed(1) + '" r="2.6"/>';
    }).join(''),
  'i-mountain': '<path d="M3 18 L9 8 L13 14 L16 10 L21 18 Z"/><circle cx="17" cy="6" r="2"/>',
  'i-river': '<path d="M3 8 q4 -3 8 0 t8 0 M3 13 q4 -3 8 0 t8 0 M3 18 q4 -3 8 0 t8 0"/>',
  'i-fort': '<path d="M5 20 V9 L8 6 L11 9 V20 M13 20 V9 L16 6 L19 9 V20 M3 20 H21"/>',
  'i-museum': '<path d="M4 10 L12 4 L20 10 M6 10 V18 M10 10 V18 M14 10 V18 M18 10 V18 M4 20 H20"/>',
  'i-book': '<path d="M4 5 H10 Q12 5 12 7 V19 Q12 17 10 17 H4 Z M20 5 H14 Q12 5 12 7 V19 Q12 17 14 17 H20 Z"/>',
  'i-jar': '<path d="M8 4 H16 M9 4 V8 Q6 10 6 14 Q6 20 12 20 Q18 20 18 14 Q18 10 15 8 V4"/>',
  'i-noodle': '<path d="M4 8 H20 M4 12 H20 M6 16 Q12 20 18 16"/><path d="M8 4 V8 M12 4 V8 M16 4 V8"/>',
  'i-home': '<path d="M4 12 L12 5 L20 12 M6 11 V20 H18 V11"/><path d="M10 20 V14 H14 V20"/>',
  'i-market': '<path d="M4 8 L6 4 H18 L20 8 Q20 11 17 11 Q14 11 14 8 Q14 11 12 11 Q10 11 10 8 Q10 11 7 11 Q4 11 4 8 Z"/><path d="M6 12 V20 H18 V12 M10 20 V15 H14 V20"/>',
  'i-tea': '<path d="M5 10 H17 V16 Q17 20 12 20 Q7 20 7 16 Z M17 11 Q21 11 20 15"/><path d="M9 6 Q10 4 12 5"/>',
  'i-craft': '<path d="M12 3 L14 9 L20 9 L15 13 L17 19 L12 15 L7 19 L9 13 L4 9 L10 9 Z"/>',
  'i-star': '<path d="M12 3 L14.5 9 L21 9.5 L16 13.5 L18 20 L12 16 L6 20 L8 13.5 L3 9.5 L9.5 9 Z"/>',
  'i-stamp': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2 V4 M12 20 V22 M2 12 H4 M20 12 H22"/>',
  'i-ai': '<rect x="5" y="5" width="14" height="14" rx="4"/><path d="M9 10 v4 M12 9 v6 M15 10 v4"/>',
  'i-bed': '<path d="M3 8 V18 M3 14 H21 V18 M3 11 H21 V14"/><circle cx="7" cy="11" r="1.6"/>',
  'i-calendar': '<rect x="4" y="6" width="16" height="15" rx="2"/><path d="M4 10 H20 M8 3 V7 M16 3 V7"/>',
  'i-ticket': '<path d="M4 8 Q6 10 4 12 Q6 14 4 16 V20 H20 V16 Q18 14 20 12 Q18 10 20 8 V4 H4 Z"/>',
  'i-map': '<path d="M9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 V6 Z M9 4 V18 M15 6 V20"/>',
  'i-shop': '<path d="M4 8 L6 4 H18 L20 8 Q20 11 17 11 Q14 11 14 8 Q14 11 12 11 Q10 11 10 8 Q10 11 7 11 Q4 11 4 8 Z"/><path d="M6 12 V20 H18 V12"/>',
  'i-shield': '<path d="M12 3 L20 6 V12 Q20 18 12 21 Q4 18 4 12 V6 Z"/><path d="M9 12 L11 14 L15 10"/>',
  'i-user': '<circle cx="12" cy="8" r="4"/><path d="M4 20 Q4 14 12 14 Q20 14 20 20"/>',
  'i-cart': '<circle cx="9" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/><path d="M3 4 H6 L8 14 H18 L21 7 H7"/>',
  'i-search': '<circle cx="11" cy="11" r="6"/><path d="M15.5 15.5 L20 20"/>',
  'i-close': '<path d="M6 6 L18 18 M18 6 L6 18"/>',
  'i-check': '<path d="M5 12 L10 17 L19 7"/>',
  'i-plus': '<path d="M12 5 V19 M5 12 H19"/>',
  'i-minus': '<path d="M5 12 H19"/>',
  'i-play': '<path d="M8 5 L18 12 L8 19 Z"/>',
  'i-pause': '<path d="M8 5 V19 M16 5 V19"/>',
  'i-mic': '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11 Q5 17 12 17 Q19 17 19 11 M12 17 V21"/>',
  'i-camera': '<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13" r="4"/><path d="M8 7 L10 4 H14 L16 7"/>',
  'i-phone': '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18 H13"/>',
  'i-location': '<path d="M12 21 Q5 14 5 9 A7 7 0 0 1 19 9 Q19 14 12 21 Z"/><circle cx="12" cy="9" r="2.5"/>',
  'i-clock': '<circle cx="12" cy="12" r="8"/><path d="M12 7 V12 L15 14"/>',
  'i-moon': '<path d="M20 14 A8 8 0 1 1 10 4 A7 7 0 0 0 20 14 Z"/>',
  'i-sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M4.5 4.5 L6.5 6.5 M17.5 17.5 L19.5 19.5 M4.5 19.5 L6.5 17.5 M17.5 6.5 L19.5 4.5"/>',
  'i-heart': '<path d="M12 20 Q4 14 4 9 Q4 5 8 5 Q11 5 12 8 Q13 5 16 5 Q20 5 20 9 Q20 14 12 20 Z"/>',
  'i-gift': '<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M4 10 H20 M12 10 V20 M12 10 Q8 10 7 7 Q7 4 10 5 Q12 6 12 10 Q12 6 14 5 Q17 4 17 7 Q16 10 12 10"/>',
  'i-send': '<path d="M4 12 L20 4 L16 20 L12 13 Z M12 13 L20 4"/>',
  'i-image': '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17 L10 12 L14 16 L17 13 L19 15"/>',
  'i-chat': '<path d="M4 6 Q4 4 6 4 H18 Q20 4 20 6 V14 Q20 16 18 16 H10 L5 20 V16 Q4 16 4 14 Z"/>',
  'i-logout': '<path d="M10 4 H6 Q4 4 4 6 V18 Q4 20 6 20 H10 M14 8 L18 12 L14 16 M18 12 H9"/>',
  'i-arrow-right': '<path d="M4 12 H19 M13 6 L19 12 L13 18"/>',
  'i-theme': '<circle cx="12" cy="12" r="8"/><path d="M12 4 A8 8 0 0 0 12 20 Z" fill="currentColor"/>',
  'i-refresh': '<path d="M4 12 A8 8 0 1 1 6.5 17.5 M4 12 V7 M4 12 H9"/>',
  'i-lock': '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11 V8 Q8 4 12 4 Q16 4 16 8 V11"/>',
  'i-mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7 L12 13 L21 7"/>',
  'i-rice': '<path d="M12 20 V10 M12 10 Q7 8 6 3 Q11 4 12 10 Q13 4 18 3 Q17 8 12 10"/>',
  'i-leaf': '<path d="M6 18 Q6 6 18 6 Q18 18 6 18 Z M6 18 L16 8"/>',
  'i-radish': '<circle cx="12" cy="14" r="6"/><path d="M12 8 V4 M10 4 Q12 6 14 4"/>',
  'i-bamboo': '<path d="M9 3 V21 M15 3 V21 M9 8 H15 M9 14 H15"/>',
  'i-path': '<path d="M4 20 Q8 12 12 12 Q16 12 16 8 Q16 4 20 4"/>',
  'i-bed2': '<path d="M3 8 V18 M3 14 H21 V18"/>'
};

function iconsSvg() {
  let body = '';
  Object.keys(ICONS).forEach(function (k) {
    body += '<symbol id="' + k + '" viewBox="0 0 24 24">'
      + '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
      + ICONS[k] + '</g></symbol>\n';
  });
  return svg(0, 0, body, ' width="0" height="0" style="display:none"');
}

/* ------------------------------ 落盘 ------------------------------ */

function write(rel, content) {
  const p = path.join(ART, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

/* 清理历史遗留产物：本次有两个场景改名（spot-volcano → spot-terrace、
   goods-volcano-class → goods-wetland-class），旧的三档图集不会自动消失，
   会在 art/ 下留成孤儿文件。生成前按名单删一遍，保证重跑即可收敛。
   只删本生成器自己写出的文件名，不递归、不碰其它资源。 */
/* 场景插画已改为真实照片，art/ 下残留的 spot-*.svg / goods-*.svg 属于历史产物，
   生成前统一清掉，保证重跑即可收敛（只删本目录下的这两类文件）。 */
const staleScenes = fs.readdirSync(ART_DIR).filter(function (f) {
  return /^(spot|goods)-[A-Za-z0-9-]+(-b|-c)?\.svg$/.test(f);
});
staleScenes.forEach(function (f) {
  fs.unlinkSync(path.join(ART_DIR, f));
  console.log('  - 清理旧场景插画', f);
});

console.log('[make-art] 生成虚拟地图底图…');
write('art/map-village.svg', mapVillageSvg());

console.log('[make-art] 生成品牌件…');
write('logo.svg', logoSvg());
write('favicon-datong.svg', faviconSvg());
write('hero.svg', heroSvg());
write('pattern.svg', patternSvg());
write('seal.svg', sealSvg());
write('empty.svg', emptySvg());
write('avatar-admin.svg', avatarSvg('admin'));
write('avatar-merchant.svg', avatarSvg('merchant'));
write('avatar-visitor.svg', avatarSvg('visitor'));
write('icons.svg', iconsSvg());
console.log('[make-art] 完成。输出目录：', ART);
