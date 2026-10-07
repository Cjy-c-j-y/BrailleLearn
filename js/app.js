"use strict";
(function App() {

  var tabs  = document.querySelectorAll('.tab');
  var views = document.querySelectorAll('.view');
  var currentView = 'learn';

  function switchView(name) {
    currentView = name;

    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', tabs[i].getAttribute('data-view') === name);
    }
    for (var j = 0; j < views.length; j++) {
      views[j].classList.toggle('active', views[j].id === 'view-' + name);
    }

    Speech.stop();

    /* 切换后重绘当前视图画布（隐藏时宽度为 0，必须重绘） */
    requestAnimationFrame(function () {
      if (name === 'learn')     LearnModule.refresh();
      if (name === 'translate') TranslateModule.refresh();
      if (name === 'quiz')      QuizModule.refresh();
      if (name === 'me')        MeModule.render();
    });

    /* 记忆上次访问的页面 */
    Store.set('lastView', name);
  }

  /* Tab 点击 */
  for (var i = 0; i < tabs.length; i++) {
    (function (tab) {
      tab.addEventListener('click', function () {
        switchView(tab.getAttribute('data-view'));
      });
    })(tabs[i]);
  }

  /* 窗口尺寸变化 → 重绘（防抖） */
  var onResize = debounce(function () {
    if (currentView === 'learn')     LearnModule.refresh();
    if (currentView === 'translate') TranslateModule.refresh();
    if (currentView === 'quiz')      QuizModule.refresh();
    if (currentView === 'me')        MeModule.render();
  }, 200);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  /* 系统深色模式切换 → 重绘画布 */
  try {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var onTheme = function () {
      if (currentView === 'learn')     LearnModule.refresh();
      if (currentView === 'translate') TranslateModule.refresh();
      if (currentView === 'quiz')      QuizModule.refresh();
      if (currentView === 'me')        MeModule.render();
    };
    if (mq.addEventListener) mq.addEventListener('change', onTheme);
    else if (mq.addListener) mq.addListener(onTheme);
  } catch (e) {}

  /* 页面隐藏时停止朗读，避免后台持续发声 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) Speech.stop();
  });

  /* ---------- 启动 ---------- */
  LearnModule.init();
  TranslateModule.init();
  QuizModule.init();
  MeModule.init();

  /* 恢复上次所在页面 */
  var last = Store.get('lastView', 'learn');
  if (last && last !== 'learn') switchView(last);

  /* 首次使用提示语音能力 */
  if (!Speech.supported) {
    setTimeout(function () {
      var tip = document.createElement('div');
      tip.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);' +
        'background:rgba(30,41,59,.92);color:#fff;font-size:12.5px;padding:9px 16px;' +
        'border-radius:10px;z-index:200;white-space:nowrap;letter-spacing:.04em;';
      tip.textContent = '当前浏览器不支持语音朗读，其余功能可正常使用';
      document.body.appendChild(tip);
      setTimeout(function () { tip.remove(); }, 3200);
    }, 1200);
  }

})();