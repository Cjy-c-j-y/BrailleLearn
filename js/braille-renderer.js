var BrailleRenderer = (function () {

  /* 点位在 2×3 网格中的位置 [列, 行] */
  var DOT_POS = {
    1: [0, 0], 4: [1, 0],
    2: [0, 1], 5: [1, 1],
    3: [0, 2], 6: [1, 2]
  };

  /* 布局比例（以点直径 d 为基准） */
  var GAP_RATIO     = 0.72;   // 格内点间距
  var PAD_RATIO     = 0.52;   // 格内边距
  var CELL_GAP_RATIO= 1.15;   // 格与格之间

  var UNIT_W = 2 + PAD_RATIO * 2 + GAP_RATIO;            // 单格宽 = 3.76d
  var UNIT_H = 3 + PAD_RATIO * 2 + GAP_RATIO * 2;        // 单格高 = 5.48d

  /* 圆角矩形兼容封装 */
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y,     x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x,     y + h, r);
    ctx.arcTo(x,     y + h, x,     y,     r);
    ctx.arcTo(x,     y,     x + w, y,     r);
    ctx.closePath();
  }

  /* 读取当前主题色 */
  function getTheme() {
    var cs = window.getComputedStyle(document.documentElement);
    function v(n) { return cs.getPropertyValue(n).trim(); }
    return {
      dotOn:      v('--dot-on')      || '#1e293b',
      dotOff:     v('--dot-off')     || '#dde4ef',
      cellBg:     v('--cell-bg')     || '#f2f5fb',
      cellBorder: v('--cell-border') || '#e4e9f2'
    };
  }

  /**
   * 绘制盲文点阵
   * @param {HTMLCanvasElement} canvas 目标画布
   * @param {Array} cells   盲符数组，如 [[1,2],[2,6]]
   * @param {Object} opt    { maxWidth, maxDot, minDot, plain }
   */
  function draw(canvas, cells, opt) {
    opt = opt || {};
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    var n = cells ? cells.length : 0;

    /* 空内容：收起画布 */
    if (!n) {
      canvas.width = 1;
      canvas.height = 1;
      canvas.style.width = '1px';
      canvas.style.height = '1px';
      return;
    }

    var availW = opt.maxWidth || (canvas.parentNode ? canvas.parentNode.clientWidth - 8 : 300);
    if (availW <= 0) availW = 300;

    /* 计算点直径 d */
    var d = availW / (n * UNIT_W + (n - 1) * CELL_GAP_RATIO);
    var maxDot = opt.maxDot || 24;
    var minDot = opt.minDot || 3.6;
    if (d > maxDot) d = maxDot;
    if (d < minDot) d = minDot;

    var cellW   = UNIT_W * d;
    var cellH   = UNIT_H * d;
    var cellGap = CELL_GAP_RATIO * d;
    var totalW  = n * cellW + (n - 1) * cellGap;
    var totalH  = cellH;

    var dpr = Math.min(window.devicePixelRatio || 1, 3);

    canvas.width  = Math.ceil(totalW * dpr);
    canvas.height = Math.ceil(totalH * dpr);
    canvas.style.width  = totalW + 'px';
    canvas.style.height = totalH + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, totalW, totalH);

    var theme = getTheme();
    var dotR  = d / 2;
    var pad   = PAD_RATIO * d;
    var gapX  = GAP_RATIO * d;
    var gapY  = GAP_RATIO * d;

    for (var ci = 0; ci < n; ci++) {
      var ox = ci * (cellW + cellGap);
      var dotsOn = cells[ci] || [];

      /* 格子底 */
      if (!opt.plain) {
        ctx.fillStyle = theme.cellBg;
        roundRect(ctx, ox, 0, cellW, cellH, d * 0.85);
        ctx.fill();

        ctx.strokeStyle = theme.cellBorder;
        ctx.lineWidth = Math.max(1, d * 0.07);
        roundRect(ctx, ox, 0, cellW, cellH, d * 0.85);
        ctx.stroke();
      }

      /* 六个点 */
      for (var num = 1; num <= 6; num++) {
        var pos = DOT_POS[num];
        var cx = ox + pad + pos[0] * (dotR * 2 + gapX) + dotR;
        var cy = pad + pos[1] * (dotR * 2 + gapY) + dotR;

        var isOn = false;
        for (var k = 0; k < dotsOn.length; k++) {
          if (dotsOn[k] === num) { isOn = true; break; }
        }

        ctx.beginPath();
        ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
        ctx.fillStyle = isOn ? theme.dotOn : theme.dotOff;
        ctx.fill();
      }
    }
  }

  return { draw: draw };
})();