/* ============================================================================
   纯 SVG 图表组件（Vue 2 全局组件，管理后台 / 工作台共用）
   不引任何图表库：4 个组件加起来不到 250 行，页面加载更快。
   配色实时读取 CSS 设计令牌（--brand / --line / --text …），
   切换主题时自动重绘，跟整体视觉完全一致。
   组件名保持 zq-line / zq-donut / zq-bars / zq-spark，页面模板不用改。
   ============================================================================ */
(function () {
  'use strict';

  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  var chartCss = document.createElement('style');
  chartCss.textContent = [
    '.dt-chart { width: 100%; display: block; overflow: visible; }',
    '.dt-chart .grid { stroke: var(--line); stroke-width: 1; }',
    '.dt-chart .axis { fill: var(--text-3); font-size: 11px; font-family: inherit; }',
    '.dt-chart .line { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }',
    '.dt-chart .dot { stroke: var(--surface); stroke-width: 2; transition: r .18s ease; }',
    '.dt-chart .dot:hover { r: 6; }',
    '.dt-chart .draw { animation: dtDraw 1.05s cubic-bezier(.3,.7,.3,1) both; }',
    '.dt-chart .grow { transform-origin: left center; animation: dtGrow .8s cubic-bezier(.22,.68,.32,1) both; animation-delay: calc(var(--i, 0) * 70ms); }',
    '.dt-chart .fade { animation: dtFade .6s ease both; animation-delay: calc(var(--i, 0) * 60ms); }',
    '@keyframes dtDraw { from { stroke-dashoffset: 2400; } to { stroke-dashoffset: 0; } }',
    '@keyframes dtGrow { from { transform: scaleX(0); opacity: .3; } to { transform: scaleX(1); opacity: 1; } }',
    '@keyframes dtFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }',
    '.dt-legend { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 12px; font-size: 12.5px; color: var(--text-2); }',
    '.dt-legend i { display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 6px; }',
    '.dt-tip { position: absolute; padding: 6px 10px; background: var(--text); color: var(--surface); font-size: 12px;',
    '  border-radius: 8px; pointer-events: none; transform: translate(-50%, -120%); white-space: nowrap; z-index: 5; }',
    '.dt-wrap { position: relative; }'
  ].join('\n');
  document.head.appendChild(chartCss);

  /** 主题变化时让所有图表实例重算颜色（bump nonce） */
  function themeMixin() {
    return {
      data: function () { return { themeNonce: 0 }; },
      created: function () {
        var self = this;
        if (window.DTTheme) {
          this._offTheme = window.DTTheme.onChange(function () { self.themeNonce++; });
        }
      },
      beforeDestroy: function () {
        if (this._offTheme) { this._offTheme(); this._offTheme = null; }
      }
    };
  }

  /** 折线图：近 7 / 30 日走势（订单数 / 营收） */
  var LineChart = {
    name: 'zq-line',
    mixins: [themeMixin()],
    props: {
      data: { type: Array, default: function () { return []; } },
      valueKey: { type: String, default: 'amount' },
      labelKey: { type: String, default: 'date' },
      color: { type: String, default: '' },   // 留空 = 跟随主题 --brand
      height: { type: Number, default: 210 },
      unit: { type: String, default: '' },
      money: { type: Boolean, default: false }
    },
    data: function () { return { hover: -1 }; },
    computed: {
      stroke: function () { void this.themeNonce; return this.color || cssVar('--brand', '#C0392B'); },
      width: function () { return 700; },
      pad: function () { return { l: 46, r: 16, t: 16, b: 26 }; },
      values: function () {
        var self = this;
        return this.data.map(function (d) { return Number(d[self.valueKey] || 0); });
      },
      max: function () {
        var m = Math.max.apply(null, this.values.concat([1]));
        return m <= 0 ? 1 : m * 1.18;
      },
      innerW: function () { return this.width - this.pad.l - this.pad.r; },
      innerH: function () { return this.height - this.pad.t - this.pad.b; },
      points: function () {
        var self = this;
        var n = this.data.length;
        if (!n) { return []; }
        var step = n > 1 ? this.innerW / (n - 1) : 0;
        return this.data.map(function (d, i) {
          var v = Number(d[self.valueKey] || 0);
          return {
            x: self.pad.l + step * i,
            y: self.pad.t + self.innerH - (v / self.max) * self.innerH,
            value: v,
            label: String(d[self.labelKey] || '').slice(5),
            raw: d
          };
        });
      },
      linePath: function () {
        return this.points.map(function (p, i) {
          return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
        }).join(' ');
      },
      areaPath: function () {
        if (!this.points.length) { return ''; }
        var bottom = this.pad.t + this.innerH;
        var first = this.points[0];
        var last = this.points[this.points.length - 1];
        return this.linePath + ' L' + last.x.toFixed(1) + ' ' + bottom
          + ' L' + first.x.toFixed(1) + ' ' + bottom + ' Z';
      },
      gridLines: function () {
        var out = [];
        for (var i = 0; i <= 3; i++) {
          out.push(this.pad.t + (this.innerH / 3) * i);
        }
        return out;
      },
      gradientId: function () { return 'dtgrad' + this._uid; },
      // 点数多时（如 30 天趋势）日期标签会挤成一团，按数量抽稀，最多约 8 个标签
      labelStep: function () {
        var n = this.points.length;
        return n > 10 ? Math.ceil(n / 8) : 1;
      }
    },
    methods: {
      fmt: function (v) {
        if (this.money) { return '¥' + Number(v).toLocaleString('zh-CN', { maximumFractionDigits: 0 }); }
        return Number(v).toLocaleString('zh-CN') + this.unit;
      },
      onMove: function (e) {
        if (!this.points.length) { return; }
        var rect = this.$refs.svg.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width * this.width;
        var best = 0;
        var dist = Infinity;
        this.points.forEach(function (p, i) {
          var d = Math.abs(p.x - x);
          if (d < dist) { dist = d; best = i; }
        });
        this.hover = best;
      }
    },
    template: [
      '<div class="dt-wrap">',
      '  <svg class="dt-chart" ref="svg" :viewBox="\'0 0 \' + width + \' \' + height"',
      '       :style="{ height: height + \'px\' }" preserveAspectRatio="none"',
      '       @mousemove="onMove" @mouseleave="hover = -1">',
      '    <defs>',
      '      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">',
      '        <stop offset="0%" :stop-color="stroke" stop-opacity=".26"/>',
      '        <stop offset="100%" :stop-color="stroke" stop-opacity="0"/>',
      '      </linearGradient>',
      '    </defs>',
      '    <line v-for="(y, i) in gridLines" :key="\'g\' + i" class="grid"',
      '          :x1="pad.l" :x2="width - pad.r" :y1="y" :y2="y"/>',
      '    <path :d="areaPath" :fill="\'url(#\' + gradientId + \')\'" class="fade"/>',
      '    <path :d="linePath" class="line draw" :stroke="stroke"',
      '          stroke-dasharray="2400" :style="{ animationDelay: \'.1s\' }"/>',
      '    <g v-for="(p, i) in points" :key="\'p\' + i" class="fade" :style="{ \'--i\': i }">',
      '      <circle class="dot" :cx="p.x" :cy="p.y" :r="hover === i ? 6 : 4" :fill="stroke"/>',
      '      <text v-if="i % labelStep === 0 || i === points.length - 1" class="axis" :x="p.x" :y="height - 8" text-anchor="middle">{{ p.label }}</text>',
      '    </g>',
      '  </svg>',
      '  <div v-if="hover >= 0 && points[hover]" class="dt-tip"',
      '       :style="{ left: (points[hover].x / width * 100) + \'%\', top: (points[hover].y / height * 100) + \'%\' }">',
      '    {{ points[hover].raw[labelKey] }} · {{ fmt(points[hover].value) }}',
      '  </div>',
      '</div>'
    ].join('\n')
  };

  /** 环形图：订单状态分布 */
  var Donut = {
    name: 'zq-donut',
    mixins: [themeMixin()],
    props: {
      items: { type: Array, default: function () { return []; } },
      size: { type: Number, default: 168 },
      thickness: { type: Number, default: 22 }
    },
    computed: {
      trackColor: function () { void this.themeNonce; return cssVar('--surface-3', '#F3EBE6'); },
      centerColor: function () { void this.themeNonce; return cssVar('--text', '#2A2018'); },
      hintColor: function () { void this.themeNonce; return cssVar('--text-3', '#A39286'); },
      total: function () {
        return this.items.reduce(function (s, x) { return s + Number(x.value || 0); }, 0);
      },
      radius: function () { return this.size / 2 - this.thickness / 2 - 2; },
      circumference: function () { return 2 * Math.PI * this.radius; },
      arcs: function () {
        var self = this;
        var total = this.total || 1;
        var acc = 0;
        return this.items.map(function (item) {
          var ratio = Number(item.value || 0) / total;
          var arc = {
            color: item.color,
            dash: (ratio * self.circumference).toFixed(2) + ' ' + self.circumference.toFixed(2),
            offset: (-acc * self.circumference).toFixed(2),
            name: item.name,
            value: Number(item.value || 0),
            percent: total ? Math.round(ratio * 100) : 0
          };
          acc += ratio;
          return arc;
        });
      }
    },
    template: [
      '<div class="flex items-center gap-16" style="flex-wrap:wrap">',
      '  <svg class="dt-chart" :viewBox="\'0 0 \' + size + \' \' + size" :style="{ width: size + \'px\', height: size + \'px\' }">',
      '    <g :transform="\'rotate(-90 \' + size / 2 + \' \' + size / 2 + \')\'">',
      '      <circle :cx="size / 2" :cy="size / 2" :r="radius" fill="none" :stroke="trackColor" :stroke-width="thickness"/>',
      '      <circle v-for="(a, i) in arcs" :key="\'a\' + i" :cx="size / 2" :cy="size / 2" :r="radius"',
      '              fill="none" :stroke="a.color" :stroke-width="thickness" stroke-linecap="butt"',
      '              :stroke-dasharray="a.dash" :stroke-dashoffset="a.offset"',
      '              class="fade" :style="{ \'--i\': i }"><title>{{ a.name }}：{{ a.value }}</title></circle>',
      '    </g>',
      '    <text :x="size / 2" :y="size / 2 - 2" text-anchor="middle"',
      '          :style="{ fontSize: \'24px\', fontWeight: 600, fill: centerColor, fontFamily: \'inherit\' }">{{ total }}</text>',
      '    <text :x="size / 2" :y="size / 2 + 18" text-anchor="middle"',
      '          :style="{ fontSize: \'11px\', fill: hintColor, fontFamily: \'inherit\' }">订单总数</text>',
      '  </svg>',
      '  <div style="min-width:140px">',
      '    <div v-for="(a, i) in arcs" :key="\'l\' + i" class="flex items-center justify-between gap-12"',
      '         style="padding:4px 0;font-size:13px">',
      '      <span class="flex items-center"><i :style="{ background: a.color, width: \'9px\', height: \'9px\',',
      '            borderRadius: \'3px\', marginRight: \'7px\', display: \'inline-block\' }"></i>{{ a.name }}</span>',
      '      <span class="mono muted">{{ a.value }} · {{ a.percent }}%</span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n')
  };

  /** 横向条形排行 */
  var Bars = {
    name: 'zq-bars',
    mixins: [themeMixin()],
    props: {
      items: { type: Array, default: function () { return []; } },
      valueKey: { type: String, default: 'amount' },
      color: { type: String, default: '' },
      money: { type: Boolean, default: true },
      unit: { type: String, default: '' }
    },
    computed: {
      stroke: function () { void this.themeNonce; return this.color || cssVar('--brand', '#C0392B'); },
      trackColor: function () { void this.themeNonce; return cssVar('--surface-3', '#F3EBE6'); },
      valueColor: function () { void this.themeNonce; return cssVar('--text-2', '#6B5A4E'); },
      max: function () {
        var self = this;
        return Math.max.apply(null, this.items.map(function (x) { return Number(x[self.valueKey] || 0); }).concat([1]));
      }
    },
    methods: {
      widthOf: function (item) {
        return Math.max(4, Number(item[this.valueKey] || 0) / this.max * 100) + '%';
      },
      fmt: function (v) {
        var n = Number(v || 0);
        if (this.money) { return '¥' + n.toLocaleString('zh-CN', { maximumFractionDigits: 0 }); }
        return n.toLocaleString('zh-CN') + this.unit;
      }
    },
    template: [
      '<div>',
      '  <div v-for="(item, i) in items" :key="i" style="padding:9px 0">',
      '    <div class="flex items-center justify-between" style="font-size:13px;margin-bottom:5px">',
      '      <span class="nowrap" style="overflow:hidden;text-overflow:ellipsis;max-width:62%">',
      '        <span class="dim mono" style="margin-right:6px">{{ i + 1 }}</span>{{ item.name }}</span>',
      '      <span class="mono" :style="{ color: valueColor }">{{ fmt(item[valueKey]) }}</span>',
      '    </div>',
      '    <div :style="{ height: \'7px\', background: trackColor, borderRadius: \'6px\', overflow: \'hidden\' }">',
      '      <div class="grow" :style="{ width: widthOf(item), height: \'100%\', background: stroke,',
      '            borderRadius: \'6px\', \'--i\': i }"></div>',
      '    </div>',
      '  </div>',
      '  <div v-if="!items.length" class="empty" style="padding:22px">暂无数据</div>',
      '</div>'
    ].join('\n')
  };

  /** 迷你趋势线：用在 KPI 卡片里 */
  var Spark = {
    name: 'zq-spark',
    mixins: [themeMixin()],
    props: {
      data: { type: Array, default: function () { return []; } },
      valueKey: { type: String, default: 'amount' },
      color: { type: String, default: '' },
      height: { type: Number, default: 34 }
    },
    computed: {
      stroke: function () { void this.themeNonce; return this.color || cssVar('--brand-2', '#E74C3C'); },
      points: function () {
        var self = this;
        var values = this.data.map(function (d) { return Number(d[self.valueKey] || 0); });
        var max = Math.max.apply(null, values.concat([1]));
        var w = 124;
        var step = values.length > 1 ? (w - 4) / (values.length - 1) : 0;
        return values.map(function (v, i) {
          return { x: 2 + i * step, y: self.height - 3 - (v / max) * (self.height - 8) };
        });
      },
      path: function () {
        return this.points.map(function (p, i) {
          return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
        }).join(' ');
      }
    },
    template: [
      '<svg class="dt-chart" :viewBox="\'0 0 124 \' + height"',
      '     :style="{ height: height + \'px\' }" preserveAspectRatio="none">',
      '  <path :d="path" class="line draw" :stroke="stroke" stroke-width="2"',
      '        stroke-dasharray="600" fill="none"/>',
      '</svg>'
    ].join('\n')
  };

  window.DTChartColors = {
    BRAND: '#C0392B', BRAND2: '#E74C3C', ACCENT: '#C77B1F', WARN: '#B07A18', INFO: '#2F6BA8',
    /** 实时取主题色（供业务代码拼 SVG 用） */
    brand: function () { return cssVar('--brand', '#C0392B'); }
  };
  window.DTCharts = { LineChart: LineChart, Donut: Donut, Bars: Bars, Spark: Spark };
})();
