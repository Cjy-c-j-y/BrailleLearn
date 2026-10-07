var MeModule = (function () {

  var elLearned = $('statLearned');
  var elRate    = $('statRate');
  var elStar    = $('statStar');
  var elList    = $('starList');
  var elWrong   = $('wrongList');
  var btnClear  = $('btnClear');
  var btnClearWrong = $('btnClearWrong');

  /* ---------- 渲染单个字词条目（生词本 / 错题本共用） ---------- */
  function renderWordItem(ch, listEl, onRemove) {
    var w = BrailleData.byChar[ch];
    if (!w) return;

    var item = document.createElement('div');
    item.className = 'word-item';

    var charEl = document.createElement('div');
    charEl.className = 'w-char';
    charEl.textContent = w.c;

    var info = document.createElement('div');
    info.className = 'w-info';
    var catName = '';
    var cats = BrailleData.CATEGORIES;
    for (var ci = 0; ci < cats.length; ci++) {
      if (cats[ci].key === w.cat) { catName = cats[ci].name; break; }
    }
    info.innerHTML = '<div class="w-pinyin">' + w.p + ' · ' + catName + '</div>';

    var braille = document.createElement('div');
    braille.className = 'w-braille';

    var del = document.createElement('button');
    del.className = 'w-del';
    del.textContent = '✕';
    del.setAttribute('aria-label', '删除');
    del.addEventListener('click', function (e) {
      e.stopPropagation();
      onRemove(ch);
    });

    item.appendChild(charEl);
    item.appendChild(info);
    item.appendChild(braille);
    item.appendChild(del);

    item.addEventListener('click', function () { Speech.speak(w.c); });

    listEl.appendChild(item);

    requestAnimationFrame(function () {
      var cells = BrailleData.pinyinToCells(w.p);
      var cvs = document.createElement('canvas');
      braille.appendChild(cvs);
      BrailleRenderer.draw(cvs, cells, {
        maxWidth: 62,
        maxDot: 9,
        minDot: 4
      });
    });
  }

  function render() {
    /* 统计 */
    var learned = Store.get('learned', []);
    var starred = Store.get('starred', []);
    var wrong   = Store.get('wrongWords', []);
    var score   = Store.get('quizScore', 0);
    var total   = Store.get('quizTotal', 0);

    elLearned.textContent = learned.length;
    elStar.textContent    = starred.length;
    elRate.textContent    = total > 0 ? Math.round(score / total * 100) + '%' : '0%';

    /* 生词本列表 */
    elList.innerHTML = '';
    if (!starred.length) {
      var emptyStar = document.createElement('div');
      emptyStar.className = 'empty-tip';
      emptyStar.style.padding = '40px 20px';
      emptyStar.innerHTML = '还没有收藏的字词<br>去「学习」页点 ☆ 收藏吧～';
      elList.appendChild(emptyStar);
    } else {
      for (var i = 0; i < starred.length; i++) {
        renderWordItem(starred[i], elList, function (ch) {
          var arr = Store.get('starred', []);
          var p = arr.indexOf(ch);
          if (p >= 0) arr.splice(p, 1);
          Store.set('starred', arr);
          render();
          LearnModule.refresh();
        });
      }
    }

    /* 错题本列表 */
    elWrong.innerHTML = '';
    if (!wrong.length) {
      var emptyWrong = document.createElement('div');
      emptyWrong.className = 'empty-tip';
      emptyWrong.style.padding = '40px 20px';
      emptyWrong.innerHTML = '还没有错题记录<br>去「刷题」页挑战一下吧～';
      elWrong.appendChild(emptyWrong);
    } else {
      for (var j = 0; j < wrong.length; j++) {
        renderWordItem(wrong[j], elWrong, function (ch) {
          var arr = Store.get('wrongWords', []);
          var p = arr.indexOf(ch);
          if (p >= 0) arr.splice(p, 1);
          Store.set('wrongWords', arr);
          render();
        });
      }
    }
  }

  function init() {
    btnClear.addEventListener('click', function () {
      if (!confirm('确定要清空全部学习数据吗？\n将清除：学习进度、生词本、答题记录、错题本。\n此操作不可恢复。')) return;
      Store.clearAll();
      LearnModule.reset();
      QuizModule.reset();
      render();
      /* 清除后停留在「我的」页，给用户明确反馈 */
      var tip = document.createElement('div');
      tip.className = 'empty-tip';
      tip.style.padding = '40px 20px';
      tip.innerHTML = '✅ 全部学习数据已清空<br>可前往「学习」重新开始';
      elList.innerHTML = '';
      elList.appendChild(tip);
      elWrong.innerHTML = '';
      var tip2 = document.createElement('div');
      tip2.className = 'empty-tip';
      tip2.style.padding = '40px 20px';
      tip2.innerHTML = '✅ 错题本已清空';
      elWrong.appendChild(tip2);
    });

    btnClearWrong.addEventListener('click', function () {
      var wrong = Store.get('wrongWords', []);
      if (!wrong.length) {
        alert('错题本还是空的，没有可清除的内容～');
        return;
      }
      if (!confirm('确定要清空错题本吗？共 ' + wrong.length + ' 条记录，此操作不可恢复。')) return;
      Store.remove('wrongWords');
      render();
    });

    render();
  }

  return { init: init, render: render };
})();