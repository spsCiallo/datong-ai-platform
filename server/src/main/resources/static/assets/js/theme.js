/* ============================================================================
 *  主题切换（三端共用，零构建）—— 大同云四主题
 *
 *  可选主题：red（朱砂 · 默认）/ cyan（青瓷）/ dark（墨夜）/ blue（靛蓝）
 *
 *  设计取舍：**只覆盖设计令牌，不改组件样式**。
 *  三端的卡片 / 弹窗 / 表格底色全部走 assets/css/app.css 里的 CSS 变量，
 *  所以把 :root 的令牌换成对应主题值，整个站点就整体换装，
 *  这也是唯一能保证「弹窗、表格、输入框、Element UI 组件」一起适配的做法。
 *
 *  持久化：localStorage 全局共享（不按端隔离：用户在哪端选都应该生效）。
 *  首屏防闪：脚本在 <head> 里同步执行，先给 <html> 打上 data-theme，
 *  等 CSS 加载时已经是目标主题，不会先白后黑闪一下。
 * ========================================================================== */
(function () {
  'use strict';

  var KEY = 'datong.theme';
  var MODES = ['red', 'cyan', 'dark', 'blue'];
  var DEFAULT = 'red';

  /* 每个主题的浏览器地址栏配色（meta theme-color） */
  var THEME_COLOR = {
    red: '#C0392B',
    cyan: '#0E7C86',
    dark: '#171412',
    blue: '#1D4ED8'
  };

  function read() {
    try {
      var v = localStorage.getItem(KEY);
      return MODES.indexOf(v) >= 0 ? v : DEFAULT;
    } catch (e) { return DEFAULT; }
  }

  function write(mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) { /* 隐私模式忽略 */ }
  }

  /** 把主题写到 <html data-theme>，CSS 用 [data-theme="xxx"] 覆盖令牌 */
  function apply(mode) {
    var html = document.documentElement;
    if (mode && mode !== DEFAULT) { html.setAttribute('data-theme', mode); }
    else { html.removeAttribute('data-theme'); }  /* red 是默认，不挂属性 */
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) { meta.setAttribute('content', THEME_COLOR[mode] || THEME_COLOR[DEFAULT]); }
    return mode;
  }

  var listeners = [];
  function notify(mode) {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](mode); } catch (e) { /* 单个订阅者出错不影响其它 */ }
    }
  }

  var Theme = {
    /** 当前主题 */
    get: function () { return read(); },
    /** 全部可选主题（个性化设置页按这个顺序渲染） */
    modes: function () { return MODES.slice(); },
    /** 是否深色 */
    isDark: function () { return read() === 'dark'; },
    /** 设置主题并落库 + 广播 */
    set: function (mode) {
      if (MODES.indexOf(mode) < 0) { mode = DEFAULT; }
      write(mode);
      apply(mode);
      notify(mode);
      return mode;
    },
    /** 在四主题间循环切换（供顶部小按钮用），返回切换后的值 */
    cycle: function () {
      var i = MODES.indexOf(read());
      return Theme.set(MODES[(i + 1) % MODES.length]);
    },
    /** 订阅变化（返回取消函数），供各端「个性化设置」同步 UI */
    onChange: function (fn) {
      if (typeof fn !== 'function') { return function () {}; }
      listeners.push(fn);
      return function () {
        var i = listeners.indexOf(fn);
        if (i >= 0) { listeners.splice(i, 1); }
      };
    },
    /** 供首屏同步调用 */
    apply: apply
  };

  window.DTTheme = Theme;
  // 首屏立刻应用（本脚本在 head 里同步引入，早于 body 渲染）
  apply(read());
})();
