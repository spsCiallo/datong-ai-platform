/* ============================================================================
 *  点位印章图标映射 + 环形扇形工具（三端共用）
 *
 *  每个点位映射到 icons.svg 里的一个艺术图标，印章外框由 CSS 画。
 *  新增点位时在 BY_ID 里补一行；没配到的按点位类型兜底，再兜不住用 i-stamp。
 *  大同村 14 个点位与 seed.sql 的 stampIcon 一一对应。
 * ========================================================================== */
window.DTSpotIcons = (function () {
  'use strict';

  var BY_ID = {
    sp1: 'i-info',     sp2: 'i-flower',  sp3: 'i-mountain', sp4: 'i-river',
    sp5: 'i-fort',     sp6: 'i-museum',  sp7: 'i-book',     sp8: 'i-jar',
    sp9: 'i-noodle',   sp10: 'i-home',   sp11: 'i-market',  sp12: 'i-tea',
    sp13: 'i-craft',   sp14: 'i-star'
  };

  /* 旧版印章存的是单个汉字。为兼容历史打卡记录保留一张「单字 → 图标」映射；
     管理员新选的图标会直接以 i-xxx 存进 stampIcon，iconOf() 优先识别这种格式。 */
  var BY_CHAR = {
    '迎': 'i-info', '花': 'i-flower', '山': 'i-mountain', '河': 'i-river',
    '堡': 'i-fort', '史': 'i-museum', '学': 'i-book', '油': 'i-jar',
    '面': 'i-noodle', '院': 'i-home', '集': 'i-market', '茶': 'i-tea',
    '铜': 'i-craft', '星': 'i-star', '旗': 'i-info'
  };

  var BY_TYPE = {
    '服务设施': 'i-info',
    '自然人文': 'i-mountain',
    '历史遗迹': 'i-fort',
    '非遗工坊': 'i-craft',
    '农事景观': 'i-flower',
    '文化场馆': 'i-museum',
    '研学基地': 'i-book',
    '农产基地': 'i-flower',
    '休闲空间': 'i-tea'
  };

  /* icons.svg 里真实存在的 symbol 名单。
     必须校验：库里存过的 stampIcon 可能是历史截断值（stamps.stampIcon 早年只有
     VARCHAR(8)，'i-mountain' 被截成 'i-mounta'），直接拿去拼 <use href> 会指向
     一个不存在的 symbol —— 印章图标整块空白，页面上看不出任何报错。
     不在名单里的 i-xxx 一律当作「没配」，继续走后面的兜底链路。 */
  var KNOWN = ('i-info i-flower i-mountain i-river i-fort i-museum i-book i-jar i-noodle i-home '
    + 'i-market i-tea i-craft i-star i-stamp i-ai i-bed i-calendar i-ticket i-map i-shop i-shield '
    + 'i-user i-cart i-search i-close i-check i-plus i-minus i-play i-pause i-mic i-camera i-phone '
    + 'i-location i-clock i-moon i-sun i-heart i-gift i-send i-image i-chat i-logout i-arrow-right '
    + 'i-theme i-refresh i-lock i-mail i-rice i-leaf i-radish i-bamboo i-path i-bed2').split(' ');

  var KNOWN_SET = {};
  for (var ki = 0; ki < KNOWN.length; ki++) { KNOWN_SET[KNOWN[ki]] = true; }

  /** 这个图标名是不是 icons.svg 里真实存在的 symbol */
  function isKnown(name) {
    return !!name && KNOWN_SET[name] === true;
  }

  /** 传入点位对象、印章记录（含 spotId）或 id 字符串，返回图标名 */
  function iconOf(spot) {
    if (!spot) { return 'i-stamp'; }
    if (typeof spot === 'string') {
      return BY_ID[spot] || 'i-stamp';
    }
    // ① 新版管理员选的图标（i-flower 这类 key）优先，但必须在 icons.svg 里真实存在；
    // ② 旧版单字走 BY_CHAR 兼容；
    // ③ 再按点位 id / 类型兜底。
    var raw = String(spot.stampIcon || '').trim();
    if (isKnown(raw)) { return raw; }
    if (raw && BY_CHAR[raw]) { return BY_CHAR[raw]; }
    // 顺序很重要：印章记录自带 id（st1/st2…），必须先看 spotId，
    // 否则会拿 st3 去查点位映射，永远查不到、全部退回默认印章。
    return BY_ID[spot.spotId || spot.id] || BY_TYPE[spot.type] || 'i-stamp';
  }

  /**
   * 生成环形扇区的 path，用于集章进度扇形图。
   * 角度单位是度，0° 指向 3 点方向（调用方自己减 90 让它从 12 点开始）。
   *
   * 退化保护：角度跨度 ≤0 时返回空字符串（渲染成空路径 = 不画），
   * 否则只有 1 个点位时算出的负跨度和 0 跨度会生成一条几乎填满整圈的怪路径；
   * 跨度接近 360° 时也不画满圈，留一道缝，否则与「已全部集齐」的实心环无法区分。
   */
  function ringSegment(cx, cy, rOuter, rInner, a0, a1) {
    var span = a1 - a0;
    if (typeof span !== 'number' || !isFinite(span) || span <= 0.01) { return ''; }
    if (span > 359.9) { span = 359.9; a1 = a0 + span; }
    var rad = Math.PI / 180;
    function pt(r, a) {
      return [(cx + r * Math.cos(a * rad)).toFixed(2), (cy + r * Math.sin(a * rad)).toFixed(2)];
    }
    var large = span > 180 ? 1 : 0;
    var o0 = pt(rOuter, a0), o1 = pt(rOuter, a1);
    var i1 = pt(rInner, a1), i0 = pt(rInner, a0);
    return 'M' + o0[0] + ' ' + o0[1]
      + 'A' + rOuter + ' ' + rOuter + ' 0 ' + large + ' 1 ' + o1[0] + ' ' + o1[1]
      + 'L' + i1[0] + ' ' + i1[1]
      + 'A' + rInner + ' ' + rInner + ' 0 ' + large + ' 0 ' + i0[0] + ' ' + i0[1]
      + 'Z';
  }

  return { iconOf: iconOf, ringSegment: ringSegment, BY_ID: BY_ID, isKnown: isKnown };
})();
