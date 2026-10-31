/* ============================================================================
 *  大同村虚拟地图组件（三端共用，Vue 2 全局组件，无构建、无 npm、无 CDN）
 *
 *  为什么自己写而不用地图库：项目红线要求前端零 CDN、零打包，三端都是手写
 *  Vue 2.7 页面；高德/百度地图既需要联网又需要密钥，答辩现场断网就废。
 *  这里用一张 tools/make-art.js 生成的 map-village.svg 当底图，
 *  点位坐标用「虚拟地图坐标系」（x 0-1000 / y 0-700），与业务数据解耦：
 *  数据库只存两个整数，换底图不用改任何业务数据。
 *
 *  用法：
 *    <village-map :points="points" :value="activeId" pickable height="420px"
 *                 @pick="{x,y}" @select="pt"></village-map>
 *    points: [{ id, name, type, icon, x, y }]
 *  对外方法（ref 调用）：zoomIn() zoomOut() reset() centerOn(id) setPick(x,y)
 * ========================================================================== */
(function () {
  'use strict';

  /** 逻辑坐标系尺寸，与 map-village.svg 的 viewBox 一致 */
  var W = 1000;
  var H = 700;

  /** 标记按业务类型配色，保证「民宿/研学/农事/活动/点位」在图上能一眼区分 */
  var TYPE_COLOR = {
    spot: '#C0392B',
    goods: '#C77B1F',
    study: '#2E7D8F',
    homestay: '#7A4E8C',
    experience: '#4E7A52',
    activity: '#B4761E'
  };

  var VillageMap = {
    name: 'village-map',
    props: {
      /** 标记点数组 */
      points: { type: Array, default: function () { return []; } },
      /** 当前选中标记 id */
      value: { type: String, default: '' },
      /** 是否允许点击空白处取坐标（商家/管理员选点用） */
      pickable: { type: Boolean, default: false },
      /** 已选坐标（pickable 模式下用来画十字准星），null 表示未选 */
      pickX: { type: Number, default: null },
      pickY: { type: Number, default: null },
      height: { type: String, default: '420px' },
      showLegend: { type: Boolean, default: true },
      /** 底图路径，允许后续换图 */
      src: { type: String, default: '/assets/img/art/map-village.svg' }
    },
    data: function () {
      return {
        scale: 1,
        tx: 0,
        ty: 0,
        fitScale: 1,
        dragging: false,
        moved: false,
        startX: 0,
        startY: 0,
        startTx: 0,
        startTy: 0,
        hoverId: '',
        viewW: 0,
        viewH: 0
      };
    },
    computed: {
      stageStyle: function () {
        return {
          width: W + 'px',
          height: H + 'px',
          transform: 'translate(' + this.tx + 'px,' + this.ty + 'px) scale(' + this.scale + ')'
        };
      },
      /** 标记内容反向缩放，缩放地图时图标与文字保持恒定大小（否则放大后标签糊成一片） */
      markerScale: function () {
        return 1 / (this.scale || 1);
      },
      pickStyle: function () {
        if (this.pickX === null || this.pickY === null) { return null; }
        return {
          left: (this.pickX / W * 100) + '%',
          top: (this.pickY / H * 100) + '%'
        };
      },
      legendItems: function () {
        var seen = {};
        var out = [];
        var self = this;
        (this.points || []).forEach(function (p) {
          var t = p.type || 'spot';
          if (seen[t]) { return; }
          seen[t] = 1;
          out.push({ type: t, color: TYPE_COLOR[t] || TYPE_COLOR.spot, name: self.typeName(t) });
        });
        return out;
      },
      /** 是否已经选过点（pickable 模式下用来切换「再点一次取消」的提示） */
      hasPick: function () {
        return this.pickX !== null && this.pickX !== undefined
          && this.pickY !== null && this.pickY !== undefined;
      }
    },
    watch: {
      points: function () { this.$nextTick(this.fit); }
    },
    mounted: function () {
      var self = this;
      this.fit();
      window.addEventListener('resize', this.onResize);
      // passive:false 才能 preventDefault，滚轮缩放时页面不跟着滚
      this.$el.addEventListener('wheel', this.onWheel, { passive: false });
      this.$el.addEventListener('touchstart', this.onTouchStart, { passive: false });
      this.$el.addEventListener('touchmove', this.onTouchMove, { passive: false });
      this.$el.addEventListener('touchend', this.onTouchEnd);
      this._ro = null;
      if (window.ResizeObserver) {
        this._ro = new ResizeObserver(function () { self.fit(); });
        this._ro.observe(this.$el);
      }
    },
    beforeDestroy: function () {
      window.removeEventListener('resize', this.onResize);
      if (this.$el) {
        this.$el.removeEventListener('wheel', this.onWheel);
        this.$el.removeEventListener('touchstart', this.onTouchStart);
        this.$el.removeEventListener('touchmove', this.onTouchMove);
        this.$el.removeEventListener('touchend', this.onTouchEnd);
      }
      if (this._ro) { this._ro.disconnect(); }
    },
    methods: {
      typeName: function (t) {
        return { spot: '打卡点位', goods: '商品', study: '研学', homestay: '民宿', experience: '农事', activity: '活动' }[t] || '点位';
      },
      colorOf: function (p) {
        return TYPE_COLOR[(p && p.type) || 'spot'] || TYPE_COLOR.spot;
      },
      onResize: function () { this.fit(); },
      /** 自适应：整张图完整装进容器，居中显示 */
      fit: function () {
        if (!this.$el) { return; }
        var rect = this.$el.getBoundingClientRect();
        var w = rect.width || 800;
        var h = rect.height || 420;
        this.viewW = w;
        this.viewH = h;
        var s = Math.min(w / W, h / H);
        this.fitScale = s;
        this.scale = s;
        this.tx = (w - W * s) / 2;
        this.ty = (h - H * s) / 2;
      },
      clampScale: function (s) {
        var min = this.fitScale * 0.9;
        var max = this.fitScale * 6;
        return Math.min(max, Math.max(min, s));
      },
      /** 以容器内某点为锚点缩放，锚点下的地图内容保持不动 */
      zoomAt: function (next, cx, cy) {
        var s = this.clampScale(next);
        if (s === this.scale) { return; }
        var k = s / this.scale;
        this.tx = cx - (cx - this.tx) * k;
        this.ty = cy - (cy - this.ty) * k;
        this.scale = s;
        this.constrain();
      },
      zoomIn: function () {
        this.zoomAt(this.scale * 1.35, this.viewW / 2, this.viewH / 2);
      },
      zoomOut: function () {
        this.zoomAt(this.scale / 1.35, this.viewW / 2, this.viewH / 2);
      },
      reset: function () { this.fit(); },
      /** 把某个标记移到视野中心（会话/列表点一下就能定位） */
      centerOn: function (id) {
        var p = null;
        for (var i = 0; i < (this.points || []).length; i++) {
          if (String(this.points[i].id) === String(id)) { p = this.points[i]; break; }
        }
        if (!p) { return; }
        var s = this.clampScale(Math.max(this.scale, this.fitScale * 1.6));
        this.scale = s;
        this.tx = this.viewW / 2 - p.x * s;
        this.ty = this.viewH / 2 - p.y * s;
        this.constrain();
      },
      /** 拖拽时不要拖出视野太远（留 1/3 屏余量），否则用户会「把地图拖丢」 */
      constrain: function () {
        var w = W * this.scale;
        var h = H * this.scale;
        var padX = Math.min(this.viewW * 0.6, w * 0.9);
        var padY = Math.min(this.viewH * 0.6, h * 0.9);
        this.tx = Math.min(padX, Math.max(this.viewW - w - padX, this.tx));
        this.ty = Math.min(padY, Math.max(this.viewH - h - padY, this.ty));
      },
      onWheel: function (e) {
        e.preventDefault();
        var rect = this.$el.getBoundingClientRect();
        var factor = e.deltaY > 0 ? 1 / 1.15 : 1.15;
        this.zoomAt(this.scale * factor, e.clientX - rect.left, e.clientY - rect.top);
      },
      onDown: function (e) {
        if (e.button !== undefined && e.button !== 0) { return; }
        this.dragging = true;
        this.moved = false;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.startTx = this.tx;
        this.startTy = this.ty;
        window.addEventListener('mousemove', this.onMove);
        window.addEventListener('mouseup', this.onUp);
      },
      onMove: function (e) {
        if (!this.dragging) { return; }
        var dx = e.clientX - this.startX;
        var dy = e.clientY - this.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) { this.moved = true; }
        this.tx = this.startTx + dx;
        this.ty = this.startTy + dy;
        this.constrain();
      },
      onUp: function () {
        this.dragging = false;
        window.removeEventListener('mousemove', this.onMove);
        window.removeEventListener('mouseup', this.onUp);
      },
      /** 点击底图：pickable 时回传逻辑坐标；再点已选中的那个点则取消 */
      onStageClick: function (e) {
        if (this.moved) { return; } // 拖拽结束的那一次 click 不算选点
        if (!this.pickable) { return; } // 只读地图点一下不该乱改数据
        var rect = this.$el.getBoundingClientRect();
        var px = e.clientX - rect.left;
        var py = e.clientY - rect.top;
        if (this.hasPick) {
          // 屏幕距离 20px 内算「点的是同一个点」，再点一下就取消标注
          var cx = this.pickX * this.scale + this.tx;
          var cy = this.pickY * this.scale + this.ty;
          if (Math.abs(px - cx) < 20 && Math.abs(py - cy) < 20) {
            this.$emit('unpick');
            return;
          }
        }
        var x = (px - this.tx) / this.scale;
        var y = (py - this.ty) / this.scale;
        x = Math.round(Math.min(W, Math.max(0, x)));
        y = Math.round(Math.min(H, Math.max(0, y)));
        this.$emit('pick', { x: x, y: y });
      },
      /** 直接点准星取消 */
      cancelPick: function () {
        if (this.moved) { return; }
        this.$emit('unpick');
      },
      onMarkerClick: function (p) {
        if (this.moved) { return; }
        this.$emit('select', p);
        this.$emit('input', String(p.id));
      },
      setPick: function (x, y) {
        this.$emit('pick', { x: x, y: y });
      },
      /* ---- 移动端双指缩放：两个触点距离变化即缩放 ---- */
      onTouchStart: function (e) {
        if (e.touches.length === 2) {
          e.preventDefault();
          this._pinch = this.dist(e.touches);
          this._pinchScale = this.scale;
        } else if (e.touches.length === 1) {
          this.dragging = true;
          this.moved = false;
          this.startX = e.touches[0].clientX;
          this.startY = e.touches[0].clientY;
          this.startTx = this.tx;
          this.startTy = this.ty;
        }
      },
      onTouchMove: function (e) {
        if (e.touches.length === 2 && this._pinch) {
          e.preventDefault();
          var rect = this.$el.getBoundingClientRect();
          var cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
          var cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
          this.zoomAt(this._pinchScale * (this.dist(e.touches) / this._pinch), cx, cy);
          this.moved = true;
        } else if (e.touches.length === 1 && this.dragging) {
          e.preventDefault();
          var dx = e.touches[0].clientX - this.startX;
          var dy = e.touches[0].clientY - this.startY;
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) { this.moved = true; }
          this.tx = this.startTx + dx;
          this.ty = this.startTy + dy;
          this.constrain();
        }
      },
      onTouchEnd: function () {
        this._pinch = null;
        this.dragging = false;
      },
      dist: function (touches) {
        var dx = touches[0].clientX - touches[1].clientX;
        var dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy) || 1;
      },
      /** 图标：优先用业务图标（icons.svg 的 symbol），否则用圆点 */
      iconHref: function (p) {
        return p && p.icon ? ('/assets/img/icons.svg#' + p.icon) : '';
      }
    },
    template: [
      '<div class="vmap" :style="{ height: height }" :class="{ \'is-pickable\': pickable }"',
      '     @mousedown="onDown" @click="onStageClick">',
      '  <div class="vmap-stage" :style="stageStyle">',
      '    <img class="vmap-bg" :src="src" alt="大同村虚拟地图" draggable="false">',
      '    <div class="vmap-grid"></div>',
      '    <div v-for="p in points" :key="p.id" class="vmap-marker"',
      '         :class="{ on: String(p.id) === String(value) }"',
      '         :style="{ left: (p.x / 10) + \'%\', top: (p.y / 7) + \'%\' }"',
      '         @click.stop="onMarkerClick(p)"',
      '         @mouseenter="hoverId = String(p.id)" @mouseleave="hoverId = \'\'">',
      '      <span class="vmap-pin" :style="{ \'--pin\': colorOf(p) }">',
      '        <svg v-if="p.icon" class="vmap-pin-ico" aria-hidden="true"><use :href="iconHref(p)"></use></svg>',
      '      </span>',
      '      <span class="vmap-label">{{ p.name }}</span>',
      '    </div>',
      '    <div v-if="pickStyle" class="vmap-pick" :style="pickStyle" title="再点一次取消标注"',
      '         @click.stop="cancelPick"><i class="pick-hit"></i><i class="pick-dot"></i></div>',
      '  </div>',
      '  <div class="vmap-tools" @mousedown.stop>',
      '    <button type="button" class="vmap-btn" title="放大" @click.stop="zoomIn">+</button>',
      '    <button type="button" class="vmap-btn" title="缩小" @click.stop="zoomOut">−</button>',
      '    <button type="button" class="vmap-btn reset" title="复位" @click.stop="reset">复位</button>',
      '  </div>',
      '  <div v-if="showLegend" class="vmap-legend" @click.stop @mousedown.stop>',
      '    <span v-for="l in legendItems" :key="l.type"><i :style="{ background: l.color }"></i>{{ l.name }}</span>',
      '  </div>',
      '  <div v-if="pickable" class="vmap-tip">{{ hasPick ? \'已标注，再点同一个点可取消\' : \'点击地图任意位置标注位置\' }}</div>',
      '</div>'
    ].join('\n')
  };

  // 反缩放标记：map 整体 scale 时，标记用 1/scale 抵回来
  VillageMap.mounted = (function (orig) {
    return function () {
      orig.call(this);
      this._syncMarkerScale();
    };
  })(VillageMap.mounted);
  VillageMap.methods._syncMarkerScale = function () {
    var nodes = this.$el ? this.$el.querySelectorAll('.vmap-marker') : [];
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].style.setProperty('--mk', this.markerScale);
    }
  };
  VillageMap.watch.scale = function () {
    this.$nextTick(this._syncMarkerScale);
  };

  window.DTVillageMap = VillageMap;
})();
