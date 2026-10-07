var TranslateModule = (function () {

  var input   = $('transInput');
  var out     = $('transOut');
  var emptyEl = $('transEmpty');

  /* 拼音字符判定正则（含带声调字母） */
  var PINYIN_RE = /^[a-zA-ZüÜāáǎàōóǒòēéěèīíǐìūúǔùǖǘǚǜ0-9]+$/;

  /* ---------- 分词：汉字逐字 + 拼音按空格 ---------- */
  function tokenize(str) {
    var tokens = [];
    var parts = str.split(/\s+/);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p) continue;
      if (PINYIN_RE.test(p)) {
        tokens.push({ text: p, pinyin: p });
      } else {
        for (var j = 0; j < p.length; j++) {
          var ch = p.charAt(j);
          var entry = BrailleData.byChar[ch];
          if (entry) tokens.push({ text: ch, pinyin: entry.p });
        }
      }
    }
    return tokens;
  }

  /* ---------- 渲染 ---------- */
  function render() {
    var raw = (input.value || '').trim();
    out.innerHTML = '';

    if (!raw) {
      emptyEl.style.display = 'block';
      return;
    }

    var tokens = tokenize(raw);
    if (!tokens.length) {
      emptyEl.style.display = 'block';
      emptyEl.innerHTML = '没有识别到可转换的内容～<br>试试输入「你好」或「ni hao」';
      return;
    }
    emptyEl.style.display = 'none';

    /* 性能保护：最多渲染 30 个 */
    var list = tokens.slice(0, 30);

    for (var i = 0; i < list.length; i++) {
      (function (t) {
        var item = document.createElement('div');
        item.className = 'trans-item';

        var charEl = document.createElement('div');
        charEl.className = 'trans-char';
        charEl.textContent = t.text;

        var pinEl = document.createElement('div');
        pinEl.className = 'trans-pinyin';
        pinEl.textContent = t.pinyin;

        var cvs = document.createElement('canvas');

        item.appendChild(charEl);
        item.appendChild(pinEl);
        item.appendChild(cvs);

        item.addEventListener('click', function () { Speech.speak(t.text); });

        out.appendChild(item);

        /* 等挂载后测量宽度 */
        requestAnimationFrame(function () {
          var cells = BrailleData.pinyinToCells(t.pinyin);
          BrailleRenderer.draw(cvs, cells, {
            maxWidth: 78,
            maxDot: 11,
            minDot: 5
          });
        });
      })(list[i]);
    }
  }

  var lazyRender = debounce(render, 120);

  function init() {
    input.addEventListener('input', lazyRender);
    input.addEventListener('compositionend', lazyRender);
    render();
  }

  return { init: init, refresh: render };
})();