var Speech = (function () {
  var supported = (typeof window !== 'undefined')
               && ('speechSynthesis' in window)
               && ('SpeechSynthesisUtterance' in window);

  var zhVoice = null;

  function pickVoice() {
    if (!supported) return;
    try {
      var list = window.speechSynthesis.getVoices() || [];
      for (var i = 0; i < list.length; i++) {
        var lang = (list[i].lang || '').toLowerCase();
        if (lang.indexOf('zh') === 0) { zhVoice = list[i]; return; }
      }
      for (var j = 0; j < list.length; j++) {
        var name = (list[j].name || '').toLowerCase();
        if (name.indexOf('chinese') >= 0 || name.indexOf('中文') >= 0
            || name.indexOf('普通话') >= 0) { zhVoice = list[j]; return; }
      }
    } catch (e) {}
  }

  if (supported) {
    pickVoice();
    /* Chrome 语音列表异步加载 */
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = pickVoice;
    }
  }

  function speak(text) {
    if (!supported || !text) return false;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang   = 'zh-CN';
      u.rate   = 0.85;
      u.pitch  = 1;
      u.volume = 1;
      if (zhVoice) u.voice = zhVoice;
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) {
      return false;
    }
  }

  function stop() {
    if (!supported) return;
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }

  return { supported: supported, speak: speak, stop: stop };
})();