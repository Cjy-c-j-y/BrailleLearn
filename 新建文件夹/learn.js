var LearnModule = (function () {

  var allWords = BrailleData.DICT;
  var category = 'all';
  var words = allWords;
  var index = 0;
  var learnedSet = {};

  var elHanzi   = $('learnHanzi');
  var elPinyin  = $('learnPinyin');
  var elSentence= $('learnSentence');
  var elCanvas  = $('learnCanvas');
  var elStage   = $('learnStage');
  var elProgress= $('learnProgress');
  var elProgText= $('learnProgressText');
  var btnSpeak  = $('btnSpeak');
  var btnStar   = $('btnStar');
  var btnNext   = $('btnNext');
  var elCatBar  = $('learnCatBar');

  /* ---------- 按分类筛选字词 ---------- */
  function getWords() {
    if (category === 'all') return allWords;
    var list = [];
    for (var i = 0; i < allWords.length; i++) {
      if (allWords[i].cat === category) list.push(allWords[i]);
    }
    return list;
  }

  /* ---------- 渲染分类切换栏 ---------- */
  function buildCatBar() {
    elCatBar.innerHTML = '';
    var cats = BrailleData.CATEGORIES;
    for (var i = 0; i < cats.length; i++) {
      (function (cat) {
        var chip = document.createElement('button');
        chip.className = 'cat-chip' + (cat.key === category ? ' active' : '');
        chip.innerHTML = '<span>' + cat.icon + '</span><span>' + cat.name + '</span>';
        chip.addEventListener('click', function () {
          category = cat.key;
          words = getWords();
          index = 0;
          Store.set('learnCat', category);
          buildCatBar();
          render();
        });
        elCatBar.appendChild(chip);
      })(cats[i]);
    }
  }

  /* ---------- 渲染当前卡片 ---------- */
  function render() {
    if (!words.length) return;
    var w = words[index];
    if (!w) { index = 0; w = words[0]; }

    elHanzi.textContent    = w.c;
    elPinyin.textContent   = w.p;
    elSentence.textContent = w.s;

    /* 盲文点阵绘制（等待布局完成后执行） */
    requestAnimationFrame(function () {
      var avail = elStage.clientWidth - 10;
      var cells = BrailleData.pinyinToCells(w.p);
      BrailleRenderer.draw(elCanvas, cells, {
        maxWidth: avail,
        maxDot: 26,
        minDot: 8
      });
    });

    /* 收藏态 */
    var starred = Store.get('starred', []);
    var isStar  = starred.indexOf(w.c) >= 0;
    btnStar.textContent = isStar ? '★' : '☆';
    if (isStar) btnStar.classList.add('on');
    else        btnStar.classList.remove('on');

    /* 进度 */
    learnedSet[w.c] = 1;
    Store.set('learned', Object.keys(learnedSet));
    Store.set('learnIndex', index);

    var pct = (index + 1) / words.length * 100;
    elProgress.style.width = pct + '%';
    elProgText.textContent = (index + 1) + ' / ' + words.length;

    /* 自动朗读（可选，默认关） */
    if (Store.get('autoSpeak', false)) Speech.speak(w.c);
  }

  /* ---------- 事件绑定 ---------- */
  function bind() {
    btnSpeak.addEventListener('click', function () {
      if (!Speech.supported) {
        alert('当前浏览器不支持语音朗读，建议使用 Chrome / Edge / Safari');
        return;
      }
      Speech.speak(words[index].c);
    });

    btnStar.addEventListener('click', function () {
      var ch = words[index].c;
      var starred = Store.get('starred', []);
      var pos = starred.indexOf(ch);
      if (pos >= 0) starred.splice(pos, 1);
      else          starred.push(ch);
      Store.set('starred', starred);
      render();
      /* 同步刷新「我的」页 */
      MeModule.render();
    });

    btnNext.addEventListener('click', function () {
      index = (index + 1) % words.length;
      render();
    });
  }

  function init() {
    category = Store.get('learnCat', 'all');
    words = getWords();
    var saved = Store.get('learnIndex', 0);
    if (typeof saved === 'number' && saved >= 0 && saved < words.length) index = saved;

    var arr = Store.get('learned', []);
    for (var i = 0; i < arr.length; i++) learnedSet[arr[i]] = 1;

    buildCatBar();
    bind();
    render();
  }

  function refresh() { render(); }

  function reset() {
    index = 0;
    learnedSet = {};
    category = 'all';
    words = allWords;
    Store.remove('learnCat');
    buildCatBar();
    render();
  }

  return { init: init, refresh: refresh, reset: reset };
})();