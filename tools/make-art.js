#!/usr/bin/env node
/* ============================================================================
 *  大同村 · 视觉资源生成器（零 npm 依赖，裸 Node 运行）
 *
 *  产出全部替换旧版照片/插画：
 *    assets/img/art/spot-*.svg        14 个点位 × 3 张图集
 *    assets/img/art/goods-*.svg       24 个商品 × 3 张图集
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

/* --------------------------- 14 个点位场景 --------------------------- */

const SPOTS = {
  'spot-service': function (l, u) {
    return sky(l, u, 620, 120, 36) + cloud(180, 110, 1, .85) + cloud(420, 80, .8, .7) + hills(l)
      + fieldRows(l, 420, 0) + river(l)
      + '<g transform="translate(400 300)">'
      + '<rect x="-90" y="0" width="180" height="90" rx="8" fill="' + l.wall + '"/>'
      + '<path d="M-104 0 L0 -52 L104 0 Z" fill="' + l.roof + '"/>'
      + '<rect x="-16" y="34" width="32" height="56" fill="' + l.roof + '"/>'
      + '<rect x="-70" y="18" width="36" height="26" rx="4" fill="#8ED6E8"/>'
      + '<rect x="34" y="18" width="36" height="26" rx="4" fill="#8ED6E8"/>'
      + '<rect x="-8" y="-46" width="16" height="10" fill="#C0392B"/>'
      + '</g>'
      + tree(180, 430, 1.2, l) + tree(640, 440, 1, l)
      + flower(120, 520, 1.2) + flower(680, 530, 1.1) + flower(280, 540, .9)
      + bird(260, 160, 1) + bird(300, 140, .8);
  },
  'spot-huanghua': function (l, u) {
    let s = sky(l, u, 400, 110, 40) + cloud(200, 90, 1.1, .8) + hills(l);
    // 花田主体：成片黄花 + 田埂
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 12; c++) {
        s += flower(30 + c * 66 + (r % 2) * 30, 360 + r * 48, 1.15 - r * .04, r % 2 ? '#F5C518' : '#FFD84D');
      }
    }
    s += '<path d="M0 560 H800" stroke="#4E7A3A" stroke-width="6" opacity=".4"/>';
    return s;
  },
  'spot-terrace': function (l, u) {
    // 黄花台地观景台：远景桑干河与对岸村舍，近景三级退台缓坡与成片黄花，
    // 右前侧设木栈道观景平台。刻意不画山锥——这里是台地地貌，不是山体。
    let s = sky(l, u, 620, 116, 34) + cloud(200, 96, 1.05, .8) + hills(l);
    // 桑干河：横贯远景的一条水带，两端收窄，两道波纹线示意流向
    s += '<path d="M-20 318 Q180 306 400 320 T820 310 V352 Q600 362 400 354 T-20 360 Z" fill="' + l.water + '" opacity=".88"/>'
      + '<path d="M40 332 Q220 324 400 336 T760 328" stroke="#FFFFFF" stroke-width="2.6" fill="none" opacity=".42"/>'
      + '<path d="M60 346 Q240 338 420 348 T740 342" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".3"/>';
    // 对岸村舍：小尺度红顶白墙，分三组团，越远越小
    [[120, 300, .5], [176, 296, .42], [232, 302, .46],
      [470, 300, .48], [520, 296, .4], [690, 302, .5], [742, 298, .42]]
      .forEach(function (h) { s += house(h[0], h[1], h[2], l); });
    // 三级台地：缓坡色带 + 台坎细线，近处更亮、台坎更实，形成层层退台的纵深感
    const TIERS = [
      { y: 356, h: 44, f: 2, op: .5 },
      { y: 396, h: 52, f: 1, op: .72 },
      { y: 444, h: 62, f: 0, op: .92 }
    ];
    TIERS.forEach(function (t, i) {
      s += '<path d="M-20 ' + t.y + ' Q200 ' + (t.y - 12) + ' 420 ' + t.y + ' T820 ' + (t.y + 10)
        + ' V' + (t.y + t.h) + ' H-20 Z" fill="' + l.field[t.f] + '" opacity="' + t.op + '"/>'
        + '<path d="M-20 ' + t.y + ' Q200 ' + (t.y - 12) + ' 420 ' + t.y + ' T820 ' + (t.y + 10)
        + '" stroke="#C77B1F" stroke-width="2.2" fill="none" opacity="' + (.3 + i * .12) + '"/>';
    });
    // 台地上的黄花田：四排花簇，近大远小，两色交替拉开层次
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 14; c++) {
        s += flower(22 + c * 58 + (r % 2) * 27, 376 + r * 42, 1.05 - r * .12, r % 2 ? '#F5C518' : '#FFD84D');
      }
    }
    // 台坎上的田埂与排水浅沟
    s += '<path d="M0 512 Q200 502 400 512 T800 506" stroke="#8E5B1A" stroke-width="4" fill="none" opacity=".35"/>'
      + '<rect x="-20" y="520" width="840" height="90" fill="' + l.field[2] + '" opacity=".85"/>';
    // 右前侧木栈道观景平台：铺板 + 立柱 + 栏杆，交代「观景台」的场所感
    s += '<g transform="translate(556 496)">'
      + '<path d="M-148 48 L148 26 L148 62 L-148 84 Z" fill="#B98A5A"/>'
      + '<path d="M-148 48 L148 26" stroke="#8E5B1A" stroke-width="4" fill="none"/>'
      + [0, 1, 2, 3, 4, 5].map(function (i) {
        return '<rect x="' + (-140 + i * 56) + '" y="' + (44 - i * 3.4).toFixed(1) + '" width="7" height="36" fill="#8E5B1A"/>';
      }).join('')
      + '<path d="M-146 30 L146 8" stroke="#6B4A32" stroke-width="5" fill="none" stroke-linecap="round"/>'
      + '<path d="M-146 20 L146 -2" stroke="#6B4A32" stroke-width="3" fill="none" stroke-linecap="round"/>'
      + '</g>'
      + tree(96, 468, 1.15, l) + tree(690, 528, 1.3, l) + tree(250, 540, 1, l)
      + bird(430, 190, 1.1) + bird(482, 168, .85) + bird(390, 214, .7);
    return s;
  },
  'spot-river': function (l, u) {
    return sky(l, u, 640, 140, 30) + cloud(220, 90, 1, .8) + hills(l)
      + '<rect x="0" y="380" width="800" height="220" fill="' + l.water + '" opacity=".92"/>'
      + '<g stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".4">'
      + '<path d="M60 430 Q180 418 300 430"/><path d="M420 470 Q560 458 700 470"/><path d="M100 530 Q260 516 420 530"/>'
      + '</g>'
      + '<g transform="translate(0 400)">'
      + '<rect x="0" y="0" width="800" height="10" fill="#8A6A4A"/>'
      + '<rect x="40" y="10" width="10" height="70" fill="#6B4A32"/>'
      + '<rect x="200" y="10" width="10" height="80" fill="#6B4A32"/>'
      + '<rect x="380" y="10" width="10" height="76" fill="#6B4A32"/>'
      + '<rect x="560" y="10" width="10" height="82" fill="#6B4A32"/>'
      + '<rect x="720" y="10" width="10" height="70" fill="#6B4A32"/>'
      + '</g>'
      + tree(140, 380, 1.1, l) + tree(680, 370, 1.2, l)
      + bird(300, 200, 1.2) + bird(360, 180, .9) + bird(250, 230, .7)
      + '<ellipse cx="400" cy="520" rx="26" ry="8" fill="#FFFFFF" opacity=".3"/>'
      + '<ellipse cx="360" cy="540" rx="20" ry="6" fill="#FFFFFF" opacity=".25"/>';
  },
  'spot-fort': function (l, u) {
    return sky(l, u, 200, 120, 28) + cloud(500, 100, .9, .6)
      + '<path d="M0 420 L200 300 L360 380 L520 280 L800 400 V600 H0 Z" fill="' + l.far + '"/>'
      + '<g transform="translate(400 250)">'
      + '<rect x="-140" y="40" width="280" height="90" fill="' + l.wall + '" opacity=".9"/>'
      + '<rect x="-140" y="20" width="280" height="24" fill="' + l.wall + '"/>'
      + '<rect x="-120" y="0" width="18" height="24" fill="' + l.wall + '"/>'
      + '<rect x="-70" y="0" width="18" height="24" fill="' + l.wall + '"/>'
      + '<rect x="-20" y="0" width="18" height="24" fill="' + l.wall + '"/>'
      + '<rect x="30" y="0" width="18" height="24" fill="' + l.wall + '"/>'
      + '<rect x="80" y="0" width="18" height="24" fill="' + l.wall + '"/>'
      + '<rect x="-30" y="-80" width="60" height="90" fill="' + l.wall + '"/>'
      + '<path d="M-36 -80 L0 -110 L36 -80 Z" fill="' + l.roof + '"/>'
      + '</g>'
      + fieldRows(l, 500, 2) + tree(160, 500, 1, l) + tree(660, 510, .9, l)
      + bird(280, 170, 1);
  },
  'spot-museum': function (l, u) {
    return sky(l, u, 580, 110, 30) + cloud(200, 100, 1, .8) + hills(l)
      + '<g transform="translate(400 280)">'
      + '<rect x="-120" y="0" width="240" height="110" rx="6" fill="' + l.wall + '"/>'
      + '<path d="M-136 0 L0 -46 L136 0 Z" fill="' + l.roof + '"/>'
      + '<rect x="-14" y="40" width="28" height="70" fill="' + l.roof + '"/>'
      + '<rect x="-90" y="20" width="40" height="32" rx="4" fill="#8ED6E8"/>'
      + '<rect x="50" y="20" width="40" height="32" rx="4" fill="#8ED6E8"/>'
      + '<circle cx="0" cy="-20" r="14" fill="#C0392B"/>'
      + '<text x="0" y="-14" text-anchor="middle" font-size="16" fill="#FFF" font-weight="700">史</text>'
      + '</g>'
      + fieldRows(l, 440, 0) + tree(170, 450, 1.1, l) + tree(640, 460, 1, l)
      + flower(240, 540, 1) + flower(560, 545, 1.1);
  },
  'spot-study': function (l, u) {
    return sky(l, u, 300, 110, 34) + cloud(540, 90, 1, .8) + hills(l)
      + fieldRows(l, 400, 0)
      + '<g transform="translate(250 380)">'
      + '<ellipse cx="0" cy="40" rx="70" ry="18" fill="#4E7A3A" opacity=".5"/>'
      + '<rect x="-50" y="-10" width="100" height="40" rx="8" fill="#4E7A3A"/>'
      + '<rect x="-50" y="-18" width="100" height="12" rx="6" fill="#3A5A2A"/>'
      + '</g>'
      + '<g transform="translate(520 360)">'
      + '<path d="M-40 40 Q0 -10 40 40 Z" fill="#C0392B"/>'
      + '<rect x="-6" y="0" width="12" height="50" fill="#6B4A32"/>'
      + '</g>'
      + tree(140, 430, 1.2, l) + tree(680, 440, 1, l)
      + flower(200, 540, 1.2) + flower(320, 550, 1) + flower(600, 535, 1.1)
      + bird(420, 170, 1);
  },
  'spot-oil': function (l, u) {
    return sky(l, u, 200, 120, 30) + cloud(480, 90, .9, .7) + hills(l)
      + '<g transform="translate(400 300)">'
      + '<rect x="-110" y="0" width="220" height="100" rx="6" fill="' + l.wall + '"/>'
      + '<path d="M-124 0 L0 -48 L124 0 Z" fill="' + l.roof + '"/>'
      + '<rect x="-12" y="40" width="24" height="60" fill="' + l.roof + '"/>'
      + '<circle cx="0" cy="-24" r="16" fill="#C0392B"/>'
      + '<text x="0" y="-18" text-anchor="middle" font-size="14" fill="#FFF" font-weight="700">油</text>'
      + '</g>'
      + '<g transform="translate(280 470)">'
      + '<ellipse cx="0" cy="30" rx="36" ry="10" fill="#00000022"/>'
      + '<path d="M-22 -10 Q-26 20 0 24 Q26 20 22 -10 Q12 -22 0 -22 Q-12 -22 -22 -10 Z" fill="#C77B1F"/>'
      + '<rect x="-8" y="-34" width="16" height="16" rx="3" fill="#8E5B1A"/>'
      + '</g>'
      + '<g transform="translate(520 480)">'
      + '<ellipse cx="0" cy="24" rx="30" ry="8" fill="#00000022"/>'
      + '<rect x="-20" y="-16" width="40" height="40" rx="8" fill="#A0522D"/>'
      + '<circle cx="0" cy="-16" r="8" fill="#6B4A32"/>'
      + '</g>'
      + fieldRows(l, 520, 1) + tree(150, 440, 1, l);
  },
  'spot-noodle': function (l, u) {
    return sky(l, u, 620, 120, 28) + cloud(240, 90, 1, .8) + hills(l)
      + '<g transform="translate(400 290)">'
      + '<rect x="-100" y="0" width="200" height="96" rx="8" fill="' + l.wall + '"/>'
      + '<path d="M-114 0 L0 -50 L114 0 Z" fill="' + l.roof + '"/>'
      + '<rect x="-14" y="36" width="28" height="60" fill="#8B4513"/>'
      + '<circle cx="-50" cy="24" r="12" fill="#F0E4D6"/>'
      + '<circle cx="50" cy="24" r="12" fill="#F0E4D6"/>'
      + '</g>'
      + '<g transform="translate(400 470)">'
      + '<ellipse cx="0" cy="36" rx="80" ry="14" fill="#00000018"/>'
      + '<path d="M-70 20 Q0 60 70 20 L60 0 Q0 30 -60 0 Z" fill="#F5EBD6"/>'
      + '<path d="M-50 8 Q0 36 50 8" stroke="#C77B1F" stroke-width="4" fill="none"/>'
      + '</g>'
      + fieldRows(l, 500, 0) + tree(170, 440, 1.1, l) + tree(650, 450, .9, l);
  },
  'spot-courtyard': function (l, u) {
    return sky(l, u, 160, 110, 26) + cloud(480, 90, 1, .75) + hills(l)
      + '<g transform="translate(400 280)">'
      + '<rect x="-150" y="20" width="300" height="90" fill="' + l.wall + '"/>'
      + '<path d="M-160 20 L-80 -40 L0 20 Z" fill="' + l.roof + '"/>'
      + '<path d="M0 20 L80 -40 L160 20 Z" fill="' + l.roof + '"/>'
      + '<rect x="-14" y="50" width="28" height="60" fill="' + l.roof + '"/>'
      + '<rect x="-110" y="50" width="28" height="24" rx="3" fill="#8ED6E8"/>'
      + '<rect x="82" y="50" width="28" height="24" rx="3" fill="#8ED6E8"/>'
      + '</g>'
      + tree(220, 420, 1.3, l) + tree(590, 430, 1.15, l)
      + '<circle cx="220" cy="392" r="6" fill="#F5C518"/>'
      + '<circle cx="232" cy="400" r="5" fill="#F5C518"/>'
      + fieldRows(l, 500, 1) + flower(320, 545, 1) + flower(480, 550, 1.1);
  },
  'spot-market': function (l, u) {
    return sky(l, u, 400, 100, 32) + cloud(180, 90, 1, .8) + cloud(600, 110, .8, .7) + hills(l)
      + '<g transform="translate(180 320)">'
      + '<path d="M-70 0 Q0 -50 70 0 Z" fill="#C0392B"/>'
      + '<rect x="-60" y="0" width="120" height="12" fill="#8E1E14"/>'
      + '<rect x="-50" y="12" width="14" height="80" fill="#8B4513"/>'
      + '<rect x="36" y="12" width="14" height="80" fill="#8B4513"/>'
      + '</g>'
      + '<g transform="translate(560 330)">'
      + '<path d="M-80 0 Q0 -56 80 0 Z" fill="#C77B1F"/>'
      + '<rect x="-70" y="0" width="140" height="12" fill="#8E5B1A"/>'
      + '<rect x="-58" y="12" width="14" height="84" fill="#8B4513"/>'
      + '<rect x="44" y="12" width="14" height="84" fill="#8B4513"/>'
      + '</g>'
      + '<g transform="translate(380 430)">'
      + '<rect x="-80" y="0" width="160" height="14" rx="4" fill="#8B4513"/>'
      + '<circle cx="-40" cy="-10" r="12" fill="#E74C3C"/>'
      + '<circle cx="0" cy="-14" r="14" fill="#F5C518"/>'
      + '<circle cx="40" cy="-10" r="12" fill="#4E7A52"/>'
      + '</g>'
      + fieldRows(l, 500, 0) + tree(120, 450, 1, l) + tree(700, 460, .9, l);
  },
  'spot-tea': function (l, u) {
    return sky(l, u, 640, 110, 26) + cloud(220, 90, 1, .8) + hills(l)
      + '<g transform="translate(400 300)">'
      + '<rect x="-120" y="0" width="240" height="96" rx="10" fill="' + l.wall + '"/>'
      + '<path d="M-134 0 L0 -50 L134 0 Z" fill="' + l.roof + '"/>'
      + '<rect x="-14" y="36" width="28" height="60" fill="' + l.roof + '"/>'
      + '<rect x="-88" y="22" width="44" height="30" rx="4" fill="#C0392B" opacity=".8"/>'
      + '<rect x="44" y="22" width="44" height="30" rx="4" fill="#C0392B" opacity=".8"/>'
      + '</g>'
      + '<g transform="translate(400 480)">'
      + '<ellipse cx="0" cy="20" rx="56" ry="12" fill="#00000018"/>'
      + '<path d="M-36 -8 Q-40 16 0 18 Q40 16 36 -8 Q20 -20 0 -20 Q-20 -20 -36 -8 Z" fill="#8ED6E8" opacity=".9"/>'
      + '<path d="M-44 -10 Q0 -34 44 -10" stroke="#C0392B" stroke-width="5" fill="none"/>'
      + '<circle cx="48" cy="-4" r="8" fill="#C0392B"/>'
      + '</g>'
      + fieldRows(l, 510, 1) + tree(160, 450, 1.1, l) + tree(650, 460, 1, l)
      + flower(280, 550, 1);
  },
  'spot-copper': function (l, u) {
    return sky(l, u, 180, 110, 28) + cloud(520, 90, .9, .7) + hills(l)
      + '<g transform="translate(400 280)">'
      + '<rect x="-110" y="0" width="220" height="100" rx="6" fill="' + l.wall + '"/>'
      + '<path d="M-124 0 L0 -46 L124 0 Z" fill="' + l.roof + '"/>'
      + '<circle cx="0" cy="-22" r="15" fill="#C77B1F"/>'
      + '<text x="0" y="-16" text-anchor="middle" font-size="14" fill="#6E130E" font-weight="700">铜</text>'
      + '</g>'
      + '<g transform="translate(320 460)">'
      + '<path d="M-28 -20 Q-36 8 0 14 Q36 8 28 -20 Q14 -34 0 -34 Q-14 -34 -28 -20 Z" fill="#C77B1F"/>'
      + '<path d="M28 -12 Q48 -18 44 4" stroke="#C77B1F" stroke-width="6" fill="none"/>'
      + '<ellipse cx="0" cy="18" rx="30" ry="8" fill="#00000018"/>'
      + '</g>'
      + '<g transform="translate(500 470)">'
      + '<path d="M-18 -26 Q-24 4 0 10 Q24 4 18 -26 Q8 -38 0 -38 Q-8 -38 -18 -26 Z" fill="#D4972E"/>'
      + '<path d="M18 -16 Q36 -22 32 2" stroke="#D4972E" stroke-width="5" fill="none"/>'
      + '<ellipse cx="0" cy="14" rx="24" ry="7" fill="#00000018"/>'
      + '</g>'
      + fieldRows(l, 520, 2) + tree(150, 450, 1, l);
  },
  'spot-camp': function (l, u) {
    const isNight = l === LIGHT.night;
    let s = sky(l, u, 400, 110, isNight ? 18 : 26);
    if (isNight || l.haze > .3) {
      for (let i = 0; i < 26; i++) {
        s += star((i * 97) % 780 + 10, (i * 53) % 220 + 20, 1.4 + (i % 3) * .5, .5 + (i % 4) * .12);
      }
      s += '<circle cx="620" cy="90" r="22" fill="#F6F0E0" opacity=".9"/>'
        + '<circle cx="610" cy="84" r="18" fill="' + l.sky[0][1] + '" opacity=".55"/>';
    } else {
      s += cloud(200, 90, 1, .7);
    }
    s += hills(l) + fieldRows(l, 420, 1)
      + '<g transform="translate(300 420)">'
      + '<path d="M-56 40 L0 -36 L56 40 Z" fill="#E8DCC8"/>'
      + '<path d="M-56 40 L0 -36 L0 40 Z" fill="#C0392B"/>'
      + '<path d="M-20 40 L0 12 L20 40 Z" fill="#6B4A32"/>'
      + '</g>'
      + '<g transform="translate(500 460)">'
      + '<path d="M-48 28 L0 -28 L48 28 Z" fill="#E8DCC8"/>'
      + '<path d="M-48 28 L0 -28 L0 28 Z" fill="#C77B1F"/>'
      + '</g>'
      + '<g transform="translate(400 520)">'
      + '<ellipse cx="0" cy="10" rx="26" ry="8" fill="#C0392B" opacity=".8"/>'
      + '<path d="M-10 4 Q0 -18 10 4 Q4 10 0 8 Q-4 10 -10 4 Z" fill="#F5B57A"/>'
      + '<path d="M-4 8 L0 -6 L4 8" stroke="#FBD9A0" stroke-width="2" fill="none"/>'
      + '</g>'
      + tree(140, 450, 1, l) + tree(680, 460, .9, l);
    return s;
  }
};

/* --------------------------- 24 个商品场景 --------------------------- */

const GOODS_BG = function (l, u, accent) {
  return '<defs>' + lin('gbg' + u, [['0%', '#FDECEA'], ['100%', '#F7F3F0']]) + '</defs>'
    + '<rect width="800" height="600" fill="url(#gbg' + u + ')"/>'
    + '<circle cx="400" cy="300" r="190" fill="' + (accent || '#F5C6C0') + '" opacity=".35"/>'
    + '<circle cx="400" cy="300" r="150" fill="#FFFFFF" opacity=".5"/>';
};

const GOODS = {
  'goods-huanghua': function () {
    return '<g transform="translate(400 320)">'
      + '<path d="M-90 40 Q-110 -20 -40 -50 L40 -50 Q110 -20 90 40 Q40 70 -0 70 Q-40 70 -90 40 Z" fill="#E8D4A8"/>'
      + '<path d="M-70 30 Q-80 -10 -30 -36 L30 -36 Q80 -10 70 30 Q30 54 0 54 Q-30 54 -70 30 Z" fill="#F5EBD6"/>'
      + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) {
        const x = -54 + i * 15;
        return '<g transform="translate(' + x + ' -20)">'
          + '<line x1="0" y1="0" x2="' + (i % 2 ? 8 : -6) + ' -34" stroke="#C77B1F" stroke-width="3"/>'
          + '<circle cx="' + (i % 2 ? 8 : -6) + '" cy="-38" r="7" fill="#F5C518"/>'
          + '<circle cx="' + (i % 2 ? 8 : -6) + '" cy="-38" r="3" fill="#C77B1F"/></g>';
      }).join('')
      + '</g><text x="400" y="500" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">大同黄花菜</text>';
  },
  'goods-sauce': function () {
    return '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="120" rx="80" ry="16" fill="#00000015"/>'
      + '<path d="M-56 -40 Q-64 40 0 48 Q64 40 56 -40 Q40 -70 0 -70 Q-40 -70 -56 -40 Z" fill="#A62B20"/>'
      + '<rect x="-22" y="-86" width="44" height="20" rx="6" fill="#C77B1F"/>'
      + '<rect x="-40" y="-10" width="80" height="44" rx="8" fill="#FDECEA"/>'
      + '<text x="0" y="16" text-anchor="middle" font-size="16" fill="#C0392B" font-family="PingFang SC, sans-serif" font-weight="700">黄花酱</text>'
      + '</g><text x="400" y="500" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">黄花牛肉酱</text>';
  },
  'goods-millet': function () {
    return '<g transform="translate(400 310)">'
      + '<ellipse cx="0" cy="110" rx="90" ry="16" fill="#00000015"/>'
      + '<path d="M-70 -40 Q-80 60 0 70 Q80 60 70 -40 Q60 -80 0 -80 Q-60 -80 -70 -40 Z" fill="#D4B896"/>'
      + '<path d="M-56 -30 Q-60 40 0 48 Q60 40 56 -30" stroke="#B89A78" stroke-width="4" fill="none"/>'
      + '<path d="M-44 -56 Q0 -80 44 -56" stroke="#B89A78" stroke-width="4" fill="none"/>'
      + '<ellipse cx="0" cy="-70" rx="44" ry="12" fill="#F5C518"/>'
      + '<circle cx="-14" cy="-78" r="6" fill="#FFD84D"/><circle cx="8" cy="-82" r="5" fill="#F5C518"/>'
      + '</g><text x="400" y="500" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">富硒小米</text>';
  },
  'goods-oil': function () {
    return '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="120" rx="70" ry="14" fill="#00000015"/>'
      + '<path d="M-40 -60 L40 -60 L52 40 Q52 70 0 74 Q-52 70 -52 40 Z" fill="#C77B1F"/>'
      + '<rect x="-18" y="-84" width="36" height="28" rx="6" fill="#8E5B1A"/>'
      + '<rect x="-34" y="-20" width="68" height="40" rx="8" fill="#FDECEA"/>'
      + '<text x="0" y="8" text-anchor="middle" font-size="15" fill="#C0392B" font-family="PingFang SC, sans-serif" font-weight="700">胡麻油</text>'
      + '<path d="M-20 44 Q0 54 20 44" stroke="#C77B1F" stroke-width="4" fill="none"/>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">石磨胡麻油</text>';
  },
  'goods-flour': function () {
    return '<g transform="translate(400 310)">'
      + '<ellipse cx="0" cy="110" rx="80" ry="14" fill="#00000015"/>'
      + '<path d="M-56 -50 L56 -50 L64 70 L-64 70 Z" fill="#F0E4D6"/>'
      + '<path d="M-56 -50 L56 -50 L58 -30 L-58 -30 Z" fill="#C0392B"/>'
      + '<text x="0" y="-34" text-anchor="middle" font-size="14" fill="#FFF" font-family="PingFang SC, sans-serif" font-weight="600">石磨莜面粉</text>'
      + '<ellipse cx="0" cy="20" rx="36" ry="10" fill="#E8D4A8"/>'
      + '<path d="M-20 20 Q0 34 20 20" stroke="#C77B1F" stroke-width="3" fill="none"/>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">石磨莜面粉</text>';
  },
  'goods-hotpot': function () {
    return '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="130" rx="90" ry="16" fill="#00000015"/>'
      + '<path d="M-80 -20 Q-88 40 0 52 Q88 40 80 -20 Q70 -50 0 -50 Q-70 -50 -80 -20 Z" fill="#C77B1F"/>'
      + '<ellipse cx="0" cy="-20" rx="80" ry="18" fill="#D4972E"/>'
      + '<ellipse cx="0" cy="-20" rx="62" ry="12" fill="#FDECEA"/>'
      + '<rect x="-8" y="-110" width="16" height="60" fill="#C77B1F"/>'
      + '<path d="M-20 -110 L20 -110 L0 -130 Z" fill="#C0392B"/>'
      + '<path d="M80 -10 Q110 -20 100 20" stroke="#C77B1F" stroke-width="10" fill="none"/>'
      + '<path d="M-80 -10 Q-110 -20 -100 20" stroke="#C77B1F" stroke-width="10" fill="none"/>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">大同铜火锅</text>';
  },
  'goods-kettle': function () {
    return '<g transform="translate(400 310)">'
      + '<ellipse cx="0" cy="110" rx="70" ry="14" fill="#00000015"/>'
      + '<path d="M-44 -36 Q-54 30 0 40 Q54 30 44 -36 Q30 -56 0 -56 Q-30 -56 -44 -36 Z" fill="#C77B1F"/>'
      + '<path d="M44 -20 Q78 -30 70 10" stroke="#C77B1F" stroke-width="9" fill="none"/>'
      + '<path d="M-20 -50 Q0 -78 20 -50" stroke="#C77B1F" stroke-width="7" fill="none"/>'
      + '<circle cx="0" cy="-8" r="14" fill="#D4972E"/>'
      + '<path d="M-10 -14 Q0 -22 10 -14" stroke="#8E5B1A" stroke-width="3" fill="none"/>'
      + '</g><text x="400" y="500" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">手工錾花铜壶</text>';
  },
  'goods-paper': function () {
    return '<g transform="translate(400 300)">'
      + '<rect x="-110" y="-110" width="220" height="220" rx="10" fill="#C0392B"/>'
      + '<path d="M0 -70 Q20 -40 50 -50 Q40 -20 70 0 Q40 20 50 50 Q20 40 0 70 Q-20 40 -50 50 Q-40 20 -70 0 Q-40 -20 -50 -50 Q-20 -40 0 -70 Z" fill="#FDECEA"/>'
      + '<circle cx="0" cy="0" r="18" fill="#C0392B"/>'
      + '<rect x="-110" y="110" width="220" height="8" fill="#8E1E14"/>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">塞上剪纸</text>';
  },
  'goods-tiger': function () {
    return '<g transform="translate(400 310)">'
      + '<ellipse cx="0" cy="90" rx="80" ry="14" fill="#00000015"/>'
      + '<ellipse cx="0" cy="20" rx="70" ry="55" fill="#E88A3A"/>'
      + '<circle cx="-28" cy="-40" r="26" fill="#E88A3A"/>'
      + '<circle cx="28" cy="-40" r="26" fill="#E88A3A"/>'
      + '<circle cx="-30" cy="-44" r="5" fill="#2A2018"/>'
      + '<circle cx="26" cy="-44" r="5" fill="#2A2018"/>'
      + '<path d="M-8 -30 Q0 -22 8 -30" stroke="#2A2018" stroke-width="3" fill="none"/>'
      + '<path d="M-12 -12 Q0 -4 12 -12" stroke="#2A2018" stroke-width="3" fill="none"/>'
      + '<path d="M-40 0 Q-30 8 -20 2 M20 2 Q30 8 40 0" stroke="#C0392B" stroke-width="5" fill="none"/>'
      + '<path d="M-36 24 Q0 34 36 24" stroke="#C0392B" stroke-width="5" fill="none"/>'
      + '<circle cx="-52" cy="10" r="10" fill="#F5C518"/><circle cx="52" cy="10" r="10" fill="#F5C518"/>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">手工布老虎</text>';
  },
  'goods-room': function () {
    return '<g>'
      + '<rect x="140" y="120" width="520" height="360" rx="12" fill="#F0E4D6"/>'
      + '<rect x="180" y="160" width="200" height="160" rx="8" fill="#8ED6E8"/>'
      + '<path d="M180 280 Q240 250 300 270 T380 260" stroke="#7FC4C9" stroke-width="8" fill="none"/>'
      + '<rect x="270" y="160" width="6" height="160" fill="#F0E4D6"/>'
      + '<rect x="180" y="160" width="200" height="160" rx="8" fill="none" stroke="#C0392B" stroke-width="6"/>'
      + '<rect x="420" y="180" width="200" height="80" rx="8" fill="#FDECEA"/>'
      + '<rect x="420" y="280" width="90" height="70" rx="8" fill="#C0392B"/>'
      + '<rect x="530" y="280" width="90" height="70" rx="8" fill="#E74C3C"/>'
      + '<rect x="180" y="360" width="200" height="80" rx="8" fill="#E8D4A8"/>'
      + '</g><text x="400" y="530" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">河景标准间</text>';
  },
  'goods-yard': function () {
    return '<g>'
      + '<rect x="120" y="140" width="560" height="320" rx="12" fill="#F0E4D6"/>'
      + '<rect x="160" y="180" width="180" height="120" fill="#C0392B" opacity=".85"/>'
      + '<path d="M150 180 L250 120 L350 180 Z" fill="#8E1E14"/>'
      + '<rect x="400" y="200" width="220" height="160" fill="#FDECEA"/>'
      + '<path d="M390 200 L510 140 L630 200 Z" fill="#C77B1F"/>'
      + '<circle cx="300" cy="360" r="36" fill="#4E7A52"/>'
      + '<rect x="294" y="380" width="12" height="40" fill="#6B4A32"/>'
      + '<path d="M300 400 L340 430" stroke="#C0392B" stroke-width="4"/>'
      + '<rect x="332" y="428" width="16" height="16" rx="4" fill="#C0392B"/>'
      + '</g><text x="400" y="530" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">家庭院落房</text>';
  },
  'goods-wetland-class': function () {
    // 桑干河湿地自然研学：水面 + 芦苇丛 + 木栈道 + 水鸟剪影 + 望远镜与记录本
    let s = '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="96" rx="168" ry="20" fill="#00000012"/>';
    // 水面：一条横向的椭圆水域，带三道波纹
    s += '<ellipse cx="0" cy="46" rx="170" ry="46" fill="#8ED6E8" opacity=".85"/>'
      + '<ellipse cx="0" cy="40" rx="150" ry="34" fill="#B6E3EC" opacity=".6"/>'
      + '<path d="M-118 34 Q-60 26 0 34 T118 30" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".55"/>'
      + '<path d="M-96 52 Q-40 46 20 52 T104 48" stroke="#FFFFFF" stroke-width="2.4" fill="none" opacity=".4"/>';
    // 芦苇丛：左右两簇，细茎 + 穗
    [[-150, 30, 8], [140, 36, 7]].forEach(function (c) {
      for (let i = 0; i < c[2]; i++) {
        const x = c[0] + i * 7 - c[2] * 3, hgt = 54 + (i % 3) * 14;
        s += '<path d="M' + x + ' ' + c[1] + ' Q' + (x + (i % 2 ? 5 : -5)) + ' ' + (c[1] - hgt / 2) + ' ' + (x + (i % 2 ? 3 : -3)) + ' ' + (c[1] - hgt)
          + '" stroke="#4E7A52" stroke-width="2.6" fill="none"/>'
          + '<ellipse cx="' + (x + (i % 2 ? 3 : -3)) + '" cy="' + (c[1] - hgt - 4) + '" rx="4" ry="7" fill="#8E6B3A"/>';
      }
    });
    // 木栈道：从画面下方斜插到水边，交代观鸟步道
    s += '<g>'
      + '<path d="M-58 96 L52 96 L96 40 L-14 40 Z" fill="#C8A276"/>'
      + [0, 1, 2, 3, 4].map(function (i) {
        return '<path d="M' + (-58 + i * 20) + ' 96 L' + (-14 + i * 24) + ' 40" stroke="#A07A4E" stroke-width="3"/>';
      }).join('')
      + '<path d="M-58 96 L-14 40" stroke="#8E5B1A" stroke-width="4" fill="none"/>'
      + '<path d="M52 96 L96 40" stroke="#8E5B1A" stroke-width="4" fill="none"/>'
      + '</g>';
    // 水鸟剪影：三只，一大两小
    s += '<path d="M-24 22 q10 -9 20 0 q10 -9 20 0" stroke="#2A2018" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round"/>'
      + '<path d="M56 8 q7 -6 14 0 q7 -6 14 0" stroke="#2A2018" stroke-width="2.6" fill="none" opacity=".65" stroke-linecap="round"/>'
      + '<path d="M-96 6 q6 -5 12 0 q6 -5 12 0" stroke="#2A2018" stroke-width="2.4" fill="none" opacity=".55" stroke-linecap="round"/>';
    // 右下角望远镜与记录本
    s += '<g transform="translate(104 -86)">'
      + '<rect x="-34" y="-8" width="42" height="14" rx="6" fill="#3A4A52" transform="rotate(-18)"/>'
      + '<rect x="-12" y="-10" width="16" height="16" rx="5" fill="#2A3438" transform="rotate(-18)"/>'
      + '<circle cx="-30" cy="-14" r="7" fill="#8ED6E8" opacity=".9"/>'
      + '</g>'
      + '<g transform="translate(-116 -84)">'
      + '<rect x="-30" y="-24" width="60" height="46" rx="4" fill="#F0E4D6"/>'
      + '<rect x="-30" y="-24" width="8" height="46" fill="#C0392B"/>'
      + '<path d="M-14 -12 H22 M-14 -2 H22 M-14 8 H8" stroke="#8E5B1A" stroke-width="2.4"/>'
      + '</g>';
    s += '</g><text x="400" y="520" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">湿地自然研学课</text>';
    return s;
  },
  'goods-mill-class': function () {
    return '<g transform="translate(400 310)">'
      + '<ellipse cx="0" cy="90" rx="110" ry="18" fill="#00000015"/>'
      + '<ellipse cx="0" cy="40" rx="100" ry="40" fill="#C8B8A0"/>'
      + '<ellipse cx="0" cy="20" rx="100" ry="40" fill="#E8DCC8"/>'
      + '<ellipse cx="0" cy="20" rx="70" ry="28" fill="#C0392B"/>'
      + '<ellipse cx="0" cy="16" rx="18" ry="8" fill="#8E1E14"/>'
      + '<rect x="-8" y="-60" width="16" height="70" fill="#8B4513"/>'
      + '<rect x="-40" y="-70" width="80" height="14" rx="7" fill="#8B4513"/>'
      + '<circle cx="90" cy="60" r="16" fill="#F5C518"/>'
      + '<circle cx="70" cy="72" r="10" fill="#F5C518"/>'
      + '</g><text x="400" y="520" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">石磨磨面体验课</text>';
  },
  'goods-pick': function () {
    return '<g transform="translate(400 310)">'
      + '<ellipse cx="0" cy="100" rx="90" ry="14" fill="#00000015"/>'
      + '<path d="M-80 -20 Q-90 60 0 70 Q90 60 80 -20 Q40 -40 0 -40 Q-40 -40 -80 -20 Z" fill="#C77B1F"/>'
      + '<path d="M-80 -20 Q0 -50 80 -20" stroke="#8E5B1A" stroke-width="6" fill="none"/>'
      + '<path d="M-40 -30 Q0 -80 40 -30" stroke="#8E5B1A" stroke-width="6" fill="none"/>'
      + [0, 1, 2, 3, 4].map(function (i) {
        return flower(-50 + i * 25, -50 - (i % 2) * 14, 1.1, i % 2 ? '#F5C518' : '#FFD84D');
      }).join('')
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">黄花采摘体验</text>';
  },
  'goods-feast': function () {
    return '<g>'
      + '<ellipse cx="400" cy="420" rx="220" ry="60" fill="#8B4513"/>'
      + '<ellipse cx="400" cy="400" rx="220" ry="56" fill="#A0522D"/>'
      + '<ellipse cx="400" cy="396" rx="180" ry="40" fill="#FDECEA"/>'
      + '<circle cx="300" cy="380" r="22" fill="#C0392B"/><circle cx="300" cy="372" r="14" fill="#E74C3C"/>'
      + '<circle cx="400" cy="370" r="24" fill="#C77B1F"/><circle cx="400" cy="362" r="14" fill="#F5C518"/>'
      + '<circle cx="500" cy="380" r="22" fill="#4E7A52"/><circle cx="500" cy="372" r="13" fill="#6B8A5A"/>'
      + '<rect x="360" y="330" width="80" height="12" rx="6" fill="#C0392B"/>'
      + '</g><text x="400" y="530" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">塞上农家饭</text>';
  },
  'goods-tea-set': function () {
    return '<g transform="translate(400 310)">'
      + '<ellipse cx="0" cy="100" rx="90" ry="14" fill="#00000015"/>'
      + '<path d="M-50 -20 Q-58 40 0 50 Q58 40 50 -20 Q30 -40 0 -40 Q-30 -40 -50 -20 Z" fill="#8ED6E8"/>'
      + '<path d="M-60 -24 Q0 -56 60 -24" stroke="#C0392B" stroke-width="8" fill="none"/>'
      + '<circle cx="58" cy="-16" r="10" fill="#C0392B"/>'
      + '<circle cx="-70" cy="30" r="20" fill="#F0E4D6"/>'
      + '<circle cx="-70" cy="24" r="12" fill="#F5C518"/>'
      + '<circle cx="70" cy="30" r="20" fill="#F0E4D6"/>'
      + '<circle cx="70" cy="24" r="12" fill="#F5C518"/>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">盖碗茶 · 茶点</text>';
  },
  /* ---- 以下 8 组为本次新增商品图集（p17-p24），构图与上面的 16 组同风格 ---- */
  'goods-suite': function () {
    // 庭院家庭套房：院墙院门 + 木花架 + 藤蔓黄花 + 户外桌椅
    return '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="122" rx="152" ry="18" fill="#00000012"/>'
      + '<rect x="-150" y="-40" width="300" height="152" fill="#F0E4D6"/>'
      + '<rect x="-150" y="-46" width="300" height="12" fill="#D8C8B4"/>'
      + '<path d="M-42 112 L-42 22 Q0 -14 42 22 L42 112 Z" fill="#C0392B" opacity=".85"/>'
      + '<rect x="-6" y="62" width="12" height="50" fill="#8E1E14"/>'
      + '<rect x="-138" y="-110" width="10" height="152" fill="#8B4513"/>'
      + '<rect x="-70" y="-110" width="10" height="152" fill="#8B4513"/>'
      + '<rect x="-148" y="-114" width="96" height="9" rx="4" fill="#A0522D"/>'
      + '<path d="M-134 -110 Q-122 -72 -130 -36 M-110 -110 Q-120 -66 -106 -22 M-86 -110 Q-74 -68 -84 -28"'
      + ' stroke="#4E7A52" stroke-width="4" fill="none" opacity=".85"/>'
      + '<circle cx="-126" cy="-54" r="7" fill="#F5C518"/><circle cx="-108" cy="-40" r="6" fill="#FFD84D"/>'
      + '<circle cx="-82" cy="-62" r="7" fill="#F5C518"/><circle cx="-96" cy="-86" r="6" fill="#FFD84D"/>'
      + '<g transform="translate(70 44)">'
      + '<ellipse cx="0" cy="54" rx="56" ry="10" fill="#00000015"/>'
      + '<rect x="-48" y="8" width="96" height="12" rx="4" fill="#C8A276"/>'
      + '<rect x="-42" y="20" width="8" height="32" fill="#A07A4E"/>'
      + '<rect x="34" y="20" width="8" height="32" fill="#A07A4E"/>'
      + '<rect x="-82" y="16" width="28" height="9" rx="3" fill="#C0392B"/>'
      + '<rect x="54" y="16" width="28" height="9" rx="3" fill="#C0392B"/>'
      + '<rect x="-26" y="-6" width="18" height="14" rx="4" fill="#FDECEA"/>'
      + '<rect x="4" y="-6" width="18" height="14" rx="4" fill="#FDECEA"/>'
      + '</g>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">庭院家庭套房</text>';
  },
  'goods-tent': function () {
    // 露营帐篷位：夜空星子 + 三角主帐 + 门帘 + 串灯 + 营地灯
    let s = '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="120" rx="150" ry="18" fill="#00000018"/>';
    for (let i = 0; i < 16; i++) {
      s += star(-168 + (i * 53) % 336, -156 + (i * 37) % 92, 1.6 + (i % 3) * .6, .5 + (i % 4) * .11);
    }
    s += '<circle cx="146" cy="-152" r="21" fill="#F6F0E0" opacity=".92"/>'
      + '<circle cx="138" cy="-158" r="17" fill="#2A3A5C" opacity=".55"/>'
      + '<path d="M-112 112 L0 -58 L112 112 Z" fill="#E8DCC8"/>'
      + '<path d="M-112 112 L0 -58 L0 112 Z" fill="#C0392B"/>'
      + '<path d="M-36 112 L0 28 L36 112 Z" fill="#8E1E14"/>'
      + '<path d="M0 -58 L0 112" stroke="#6B4A32" stroke-width="4"/>'
      + '<path d="M-98 112 L-140 120 M98 112 L140 120" stroke="#8E5B1A" stroke-width="3"/>'
      + '<path d="M-152 -34 Q-60 8 0 -8 T152 -38" stroke="#8E5B1A" stroke-width="2.6" fill="none"/>';
    [[-142, -24], [-102, -6], [-62, 4], [-22, 0], [18, -8], [58, -18], [98, -27], [138, -35]]
      .forEach(function (b) {
        s += '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="5" fill="#F5C518"/>'
          + '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="10" fill="#F5C518" opacity=".22"/>';
      });
    s += '<g transform="translate(120 98)">'
      + '<rect x="-5" y="-24" width="10" height="34" rx="3" fill="#6B4A32"/>'
      + '<circle cx="0" cy="-30" r="13" fill="#FBD9A0"/>'
      + '<circle cx="0" cy="-30" r="22" fill="#FBD9A0" opacity=".28"/>'
      + '</g>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">星空露营帐篷位</text>';
    return s;
  },
  'goods-farm': function () {
    // 黄花田农事耕作：透视田垄 + 成片黄花 + 斜插的锄头
    let s = '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="122" rx="162" ry="18" fill="#00000012"/>'
      + '<rect x="-172" y="18" width="344" height="104" fill="#C8A276" opacity=".4"/>';
    for (let i = 0; i < 5; i++) {
      s += '<path d="M-172 ' + (30 + i * 22) + ' Q0 ' + (18 + i * 22) + ' 172 ' + (30 + i * 22) + '"'
        + ' stroke="#A07A4E" stroke-width="9" fill="none" opacity=".5"/>';
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        s += flower(-136 + c * 34 + (r % 2) * 17, -58 + r * 30, 1.05 - r * .1, r % 2 ? '#F5C518' : '#FFD84D');
      }
    }
    s += '<path d="M-172 22 Q0 10 172 22" stroke="#8E5B1A" stroke-width="3" fill="none" opacity=".4"/>'
      + '<g transform="translate(-46 -6) rotate(-24)">'
      + '<rect x="-4" y="-96" width="9" height="150" rx="4" fill="#A07A4E"/>'
      + '<path d="M-16 54 L16 54 L10 76 Q0 84 -10 76 Z" fill="#7A8A94"/>'
      + '<path d="M-16 54 L16 54" stroke="#5C6A72" stroke-width="4"/>'
      + '</g>'
      + '<g transform="translate(96 66)">'
      + '<rect x="-26" y="-14" width="52" height="26" rx="6" fill="#C8A276"/>'
      + '<path d="M-26 -14 L26 -14" stroke="#8E5B1A" stroke-width="4"/>'
      + '</g>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">黄花田农事耕作</text>';
    return s;
  },
  'goods-press': function () {
    // 古法榨油：木榨床 + 楔子 + 油槽与接油桶
    let s = '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="126" rx="150" ry="18" fill="#00000015"/>'
      + '<rect x="-150" y="46" width="300" height="58" rx="8" fill="#A0522D"/>'
      + '<rect x="-150" y="40" width="300" height="14" rx="6" fill="#C8A276"/>'
      + '<rect x="-118" y="-6" width="236" height="52" rx="6" fill="#8B4513"/>'
      + '<rect x="-104" y="4" width="208" height="12" fill="#6B4A32" opacity=".7"/>';
    for (let i = 0; i < 5; i++) {
      s += '<rect x="' + (-92 + i * 42) + '" y="-2" width="12" height="44" rx="3" fill="#C8A276"/>';
    }
    s += '<g transform="translate(0 -46)">'
      + '<rect x="-9" y="-72" width="18" height="76" rx="5" fill="#8E5B1A"/>'
      + '<rect x="-30" y="-88" width="60" height="22" rx="8" fill="#6B4A32"/>'
      + '</g>'
      + '<path d="M-150 62 Q-40 78 60 66" stroke="#C77B1F" stroke-width="7" fill="none" opacity=".85"/>'
      + '<g transform="translate(104 96)">'
      + '<ellipse cx="0" cy="22" rx="34" ry="9" fill="#00000018"/>'
      + '<rect x="-24" y="-18" width="48" height="42" rx="8" fill="#C77B1F"/>'
      + '<rect x="-24" y="-4" width="48" height="8" fill="#8E5B1A"/>'
      + '<path d="M-10 -18 Q0 -30 10 -18" stroke="#8E5B1A" stroke-width="4" fill="none"/>'
      + '</g>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">古法榨油体验</text>';
    return s;
  },
  'goods-thresh': function () {
    // 打谷场秋收：谷堆 + 石碾 + 木锨 + 摊开的谷粒
    let s = '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="124" rx="158" ry="18" fill="#00000015"/>'
      + '<rect x="-172" y="52" width="344" height="62" fill="#C8A276" opacity=".45"/>'
      + '<path d="M-172 52 Q0 42 172 52" stroke="#A07A4E" stroke-width="3" fill="none" opacity=".5"/>'
      + '<path d="M-104 60 Q-64 -54 0 -58 Q64 -54 104 60 Z" fill="#E8B84B"/>'
      + '<path d="M-104 60 Q-64 -54 0 -58 Q-30 0 -34 60 Z" fill="#D4972E" opacity=".85"/>';
    for (let i = 0; i < 14; i++) {
      s += '<circle cx="' + (-96 + (i * 29) % 190) + '" cy="' + (58 + (i * 17) % 40) + '" r="3" fill="#C77B1F" opacity=".7"/>';
    }
    s += '<g transform="translate(120 74)">'
      + '<ellipse cx="0" cy="22" rx="52" ry="12" fill="#00000015"/>'
      + '<rect x="-44" y="-14" width="88" height="36" rx="8" fill="#C8B8A0"/>'
      + '<ellipse cx="0" cy="-14" rx="44" ry="13" fill="#E8DCC8"/>'
      + '<circle cx="0" cy="-14" r="9" fill="#A09A8E"/>'
      + '<rect x="-4" y="-42" width="8" height="26" fill="#8B4513"/>'
      + '<rect x="-26" y="-50" width="52" height="10" rx="5" fill="#8B4513"/>'
      + '</g>'
      + '<g transform="translate(-130 40) rotate(-28)">'
      + '<rect x="-4" y="-70" width="8" height="118" rx="4" fill="#A07A4E"/>'
      + '<path d="M-20 40 L20 40 L14 62 L-14 62 Z" fill="#C8A276"/>'
      + '<path d="M-20 40 L20 40" stroke="#8E5B1A" stroke-width="4"/>'
      + '</g>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">打谷场秋收</text>';
    return s;
  },
  'goods-bird': function () {
    // 湿地自然观察：水面 + 芦苇 + 水鸟 + 举在身前的望远镜
    let s = '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="118" rx="160" ry="18" fill="#00000012"/>'
      + '<ellipse cx="0" cy="34" rx="172" ry="50" fill="#8ED6E8" opacity=".8"/>'
      + '<ellipse cx="0" cy="26" rx="150" ry="36" fill="#B6E3EC" opacity=".55"/>'
      + '<path d="M-124 20 Q-64 12 0 20 T124 16" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".55"/>'
      + '<path d="M-100 40 Q-40 34 20 40 T106 36" stroke="#FFFFFF" stroke-width="2.4" fill="none" opacity=".4"/>'
      + '<path d="M-150 118 Q-120 40 -96 -6" stroke="#4E7A52" stroke-width="4" fill="none" opacity=".7"/>';
    [[-148, 96, 9], [138, 102, 8]].forEach(function (c) {
      for (let i = 0; i < c[2]; i++) {
        const x = c[0] + i * 8 - c[2] * 4, hgt = 56 + (i % 3) * 16;
        s += '<path d="M' + x + ' ' + c[1] + ' Q' + (x + (i % 2 ? 6 : -6)) + ' ' + (c[1] - hgt / 2) + ' ' + (x + (i % 2 ? 3 : -3)) + ' ' + (c[1] - hgt)
          + '" stroke="#4E7A52" stroke-width="2.6" fill="none"/>'
          + '<ellipse cx="' + (x + (i % 2 ? 3 : -3)) + '" cy="' + (c[1] - hgt - 5) + '" rx="4" ry="7" fill="#8E6B3A"/>';
      }
    });
    s += '<path d="M-32 4 q11 -10 22 0 q11 -10 22 0" stroke="#2A2018" stroke-width="3.2" fill="none" opacity=".82" stroke-linecap="round"/>'
      + '<path d="M48 -14 q8 -7 16 0 q8 -7 16 0" stroke="#2A2018" stroke-width="2.6" fill="none" opacity=".62" stroke-linecap="round"/>'
      + '<path d="M-104 -22 q7 -6 14 0 q7 -6 14 0" stroke="#2A2018" stroke-width="2.4" fill="none" opacity=".5" stroke-linecap="round"/>'
      + '<g transform="translate(0 -64)">'
      + '<rect x="-58" y="-12" width="116" height="26" rx="12" fill="#3A4A52"/>'
      + '<rect x="-16" y="-18" width="32" height="38" rx="10" fill="#2A3438"/>'
      + '<circle cx="-46" cy="1" r="14" fill="#8ED6E8" opacity=".9"/>'
      + '<circle cx="46" cy="1" r="14" fill="#8ED6E8" opacity=".9"/>'
      + '<rect x="-10" y="20" width="20" height="16" rx="4" fill="#2A3438"/>'
      + '</g>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">湿地自然观察课</text>';
    return s;
  },
  'goods-fort-class': function () {
    // 古堡烽台历史研学：夯土烽台 + 垛口 + 夯层线 + 讲解牌
    let s = '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="126" rx="152" ry="18" fill="#00000015"/>'
      + '<rect x="-172" y="70" width="344" height="48" fill="#C8A276" opacity=".4"/>'
      + '<path d="M-84 96 L-72 -84 L72 -84 L84 96 Z" fill="#C8A276"/>'
      + '<path d="M-84 96 L-72 -84 L0 -84 L0 96 Z" fill="#A07A4E" opacity=".55"/>';
    for (let i = 0; i < 6; i++) {
      s += '<path d="M' + (-76 - i * 1.4).toFixed(1) + ' ' + (-56 + i * 24) + ' L' + (76 + i * 1.4).toFixed(1) + ' ' + (-56 + i * 24)
        + '" stroke="#8E5B1A" stroke-width="2" opacity=".45"/>';
    }
    s += '<rect x="-72" y="-104" width="144" height="24" fill="#C8A276"/>'
      + '<rect x="-72" y="-108" width="26" height="12" fill="#B98A5A"/>'
      + '<rect x="-20" y="-108" width="26" height="12" fill="#B98A5A"/>'
      + '<rect x="32" y="-108" width="26" height="12" fill="#B98A5A"/>'
      + '<path d="M-22 96 L-22 40 Q0 20 22 40 L22 96 Z" fill="#8E5B1A" opacity=".8"/>'
      + '<g transform="translate(-124 62)">'
      + '<rect x="-6" y="0" width="12" height="52" fill="#8B4513"/>'
      + '<rect x="-40" y="-34" width="80" height="42" rx="5" fill="#F0E4D6"/>'
      + '<rect x="-40" y="-34" width="80" height="8" fill="#C0392B"/>'
      + '<path d="M-28 -14 H28 M-28 -4 H14" stroke="#8E5B1A" stroke-width="2.6"/>'
      + '</g>'
      + '<path d="M-100 122 Q-40 112 20 122 T120 118" stroke="#8E5B1A" stroke-width="3" fill="none" opacity=".4"/>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">古堡烽台历史研学</text>';
    return s;
  },
  'goods-copper-class': function () {
    // 铜艺錾花手作课：工作台 + 铜片 + 錾子 + 锤子
    let s = '<g transform="translate(400 300)">'
      + '<ellipse cx="0" cy="124" rx="158" ry="18" fill="#00000015"/>'
      + '<rect x="-160" y="34" width="320" height="26" rx="6" fill="#8B4513"/>'
      + '<rect x="-160" y="28" width="320" height="10" rx="5" fill="#A0522D"/>'
      + '<rect x="-138" y="60" width="14" height="58" fill="#6B4A32"/>'
      + '<rect x="124" y="60" width="14" height="58" fill="#6B4A32"/>'
      + '<g transform="translate(-32 4)">'
      + '<rect x="-62" y="-6" width="124" height="34" rx="4" fill="#D4972E"/>'
      + '<rect x="-62" y="-6" width="124" height="10" rx="4" fill="#E8B84B"/>';
    for (let i = 0; i < 5; i++) {
      s += '<circle cx="' + (-42 + i * 21) + '" cy="16" r="5" fill="#C77B1F"/>';
    }
    s += '<path d="M-50 6 Q-24 -2 2 6 T54 4" stroke="#8E5B1A" stroke-width="2" fill="none" opacity=".7"/>'
      + '</g>'
      + '<g transform="translate(78 -34) rotate(16)">'
      + '<rect x="-5" y="-70" width="10" height="86" rx="4" fill="#C77B1F"/>'
      + '<path d="M-9 -70 L9 -70 L4 -88 L-4 -88 Z" fill="#8E5B1A"/>'
      + '</g>'
      + '<g transform="translate(-118 -46) rotate(-18)">'
      + '<rect x="-5" y="-56" width="10" height="66" rx="4" fill="#8B4513"/>'
      + '<rect x="-30" y="-84" width="60" height="30" rx="7" fill="#7A8A94"/>'
      + '<rect x="-24" y="-78" width="48" height="8" rx="4" fill="#5C6A72"/>'
      + '</g>'
      + '<g transform="translate(126 6)">'
      + '<circle cx="0" cy="-8" r="13" fill="#C77B1F" opacity=".5"/>'
      + '<circle cx="14" cy="2" r="9" fill="#D4972E" opacity=".5"/>'
      + '</g>'
      + '</g><text x="400" y="510" text-anchor="middle" font-size="22" fill="#8E1E14" font-family="PingFang SC, sans-serif" font-weight="600">铜艺錾花手作课</text>';
    return s;
  }
};

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

function writeScene(name, fn) {
  const lights = [LIGHT.day, LIGHT.dusk, LIGHT.night];
  const sufs = ['', '-b', '-c'];
  lights.forEach(function (l, i) {
    const uid = name + i;
    let body = defs(l, uid) + fn(l, uid);
    body += vignette();
    write('art/' + name + sufs[i] + '.svg', svg(800, 600, body));
  });
  console.log('  ✓', name, '×3');
}

/* 清理历史遗留产物：本次有两个场景改名（spot-volcano → spot-terrace、
   goods-volcano-class → goods-wetland-class），旧的三档图集不会自动消失，
   会在 art/ 下留成孤儿文件。生成前按名单删一遍，保证重跑即可收敛。
   只删本生成器自己写出的文件名，不递归、不碰其它资源。 */
const OBSOLETE_SCENES = ['spot-volcano', 'goods-volcano-class'];
['', '-b', '-c'].forEach(function (suf) {
  OBSOLETE_SCENES.forEach(function (name) {
    const p = path.join(ART_DIR, name + suf + '.svg');
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log('  - 清理旧图', name + suf + '.svg');
    }
  });
});

console.log('[make-art] 生成点位插画…');
Object.keys(SPOTS).forEach(function (k) { writeScene(k, SPOTS[k]); });

console.log('[make-art] 生成商品插画…');
Object.keys(GOODS).forEach(function (k) {
  writeScene(k, function (l, u) { return GOODS_BG(l, u) + GOODS[k](); });
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
