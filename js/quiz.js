var QuizModule = (function () {

  var allPool = BrailleData.DICT;
  var category = 'all';

  var elTag      = $('quizTypeTag');
  var elRound    = $('quizRound');
  var elQuestion = $('quizQuestion');
  var elOpts     = $('quizOpts');
  var elFeedback = $('quizFeedback');
  var elScore    = $('quizScore');
  var elTotal    = $('quizTotal');
  var btnNext    = $('btnQuizNext');
  var elCatBar   = $('quizCatBar');

  var current = null;
  var round   = 0;
  var locked  = false;

  /* ---------- 按分类筛选题库 ---------- */
  function getPool() {
    if (category === 'all') return allPool;
    var list = [];
    for (var i = 0; i < allPool.length; i++) {
      if (allPool[i].cat === category) list.push(allPool[i]);
    }
    return list.length ? list : allPool;
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
          Store.set('quizCat', category);
          buildCatBar();
          newQuestion();
        });
        elCatBar.appendChild(chip);
      })(cats[i]);
    }
  }

  /* ---------- 生成新题 ---------- */
  function newQuestion() {
    var pool = getPool();
    var type = Math.random() < 0.5 ? 'b2c' : 'c2b';   // 盲文辨汉字 / 汉字辨盲文

    var correct = pool[Math.floor(Math.random() * pool.length)];

    /* 生成 3 个不重复干扰项 */
    var distractors = [];
    var guard = 0;
    while (distractors.length < 3 && guard < 200) {
      guard++;
      var r = pool[Math.floor(Math.random() * pool.length)];
      if (r.c === correct.c) continue;
      var dup = false;
      for (var i = 0; i < distractors.length; i++) {
        if (distractors[i].c === r.c) { dup = true; break; }
      }
      if (!dup) distractors.push(r);
    }

    var options = shuffle([correct].concat(distractors));

    current = { type: type, correct: correct, options: options };
    round++;
    locked = false;

    elRound.textContent = '第 ' + round + ' 题';
    elFeedback.textContent = '';
    elTag.textContent = (type === 'b2c') ? '盲文辨汉字' : '汉字辨盲文';

    renderQuestion();
  }

  /* ---------- 渲染题干与选项 ---------- */
  function renderQuestion() {
    var q = current;
    elQuestion.innerHTML = '';
    elOpts.innerHTML = '';

    if (q.type === 'b2c') {
      /* 题面：盲文点阵 */
      var hint = document.createElement('div');
      hint.className = 'q-hint';
      hint.textContent = '这组盲文对应哪个汉字？';

      var wrap = document.createElement('div');
      wrap.className = 'q-canvas-wrap';
      var cvs = document.createElement('canvas');
      wrap.appendChild(cvs);

      elQuestion.appendChild(hint);
      elQuestion.appendChild(wrap);

      requestAnimationFrame(function () {
        var cells = BrailleData.pinyinToCells(q.correct.p);
        BrailleRenderer.draw(cvs, cells, {
          maxWidth: Math.min(300, elQuestion.clientWidth - 20),
          maxDot: 24,
          minDot: 8
        });
      });

      /* 选项：汉字按钮 */
      for (var i = 0; i < q.options.length; i++) {
        (function (opt) {
          var b = document.createElement('button');
          b.className = 'opt';
          b.innerHTML = '<span class="opt-char">' + opt.c + '</span>';
          b.addEventListener('click', function () { answer(opt.c, b); });
          elOpts.appendChild(b);
        })(q.options[i]);
      }

    } else {
      /* 题面：汉字 */
      var h = document.createElement('div');
      h.className = 'q-hanzi';
      h.textContent = q.correct.c;

      var hint2 = document.createElement('div');
      hint2.className = 'q-hint';
      hint2.style.marginTop = '10px';
      hint2.textContent = '它的盲文是下面哪一个？';

      elQuestion.appendChild(h);
      elQuestion.appendChild(hint2);

      /* 选项：盲文画布按钮 */
      for (var j = 0; j < q.options.length; j++) {
        (function (opt) {
          var b = document.createElement('button');
          b.className = 'opt';
          var cvs2 = document.createElement('canvas');
          b.appendChild(cvs2);
          b.addEventListener('click', function () { answer(opt.c, b); });
          elOpts.appendChild(b);

          requestAnimationFrame(function () {
            var cells = BrailleData.pinyinToCells(opt.p);
            BrailleRenderer.draw(cvs2, cells, {
              maxWidth: 72,
              maxDot: 11,
              minDot: 5
            });
          });
        })(q.options[j]);
      }
    }
  }

  /* ---------- 判分 ---------- */
  function answer(chosenChar, btnEl) {
    if (locked) return;
    locked = true;

    var q = current;
    var isRight = (chosenChar === q.correct.c);

    /* 统计写入存储 */
    var score = Store.get('quizScore', 0);
    var total = Store.get('quizTotal', 0);
    total++;
    if (isRight) score++;
    Store.set('quizScore', score);
    Store.set('quizTotal', total);

    /* 错题本 */
    if (!isRight) {
      var wrong = Store.get('wrongWords', []);
      if (wrong.indexOf(q.correct.c) < 0) {
        wrong.push(q.correct.c);
        Store.set('wrongWords', wrong);
      }
    }

    elScore.textContent = score;
    elTotal.textContent = total;

    /* 视觉反馈 */
    var all = elOpts.querySelectorAll('.opt');
    for (var i = 0; i < all.length; i++) {
      all[i].disabled = true;
      var txt = all[i].textContent.trim();
      if (q.type === 'b2c') {
        if (txt === q.correct.c) all[i].classList.add('correct');
      }
    }
    if (isRight) {
      btnEl.classList.add('correct');
      elFeedback.textContent = '✅ 答对啦！';
      elFeedback.style.color = 'var(--ok)';
    } else {
      btnEl.classList.add('wrong');
      /* 汉字模式需要高亮正确项 */
      if (q.type === 'c2b') {
        for (var k = 0; k < all.length; k++) {
          if (k === q.options.indexOf(q.correct)) all[k].classList.add('correct');
        }
      }
      elFeedback.textContent = '❌ 正确答案是「' + q.correct.c + '」';
      elFeedback.style.color = 'var(--err)';
    }

    /* 刷新「我的」页统计 */
    MeModule.render();
  }

  function init() {
    category = Store.get('quizCat', 'all');
    elScore.textContent = Store.get('quizScore', 0);
    elTotal.textContent = Store.get('quizTotal', 0);
    btnNext.addEventListener('click', newQuestion);
    buildCatBar();
    newQuestion();
  }

  function refresh() {
    /* 切换回刷题页时可重新渲染当前题的画布尺寸 */
    if (current) renderQuestion();
  }

  function reset() {
    round = 0;
    locked = false;
    current = null;
    category = 'all';
    Store.remove('quizCat');
    elScore.textContent = '0';
    elTotal.textContent = '0';
    buildCatBar();
    newQuestion();
  }

  return { init: init, refresh: refresh, reset: reset };
})();