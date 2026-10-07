var Store = (function () {
  var PREFIX = 'brl_';

  function get(key, def) {
    try {
      var v = window.localStorage.getItem(PREFIX + key);
      if (v === null) return def;
      return JSON.parse(v);
    } catch (e) {
      return def;
    }
  }

  function set(key, val) {
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(val));
      return true;
    } catch (e) {
      return false;
    }
  }

  function remove(key) {
    try { window.localStorage.removeItem(PREFIX + key); } catch (e) {}
  }

  function clearAll() {
    try {
      var keys = [];
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) keys.push(k);
      }
      for (var j = 0; j < keys.length; j++) window.localStorage.removeItem(keys[j]);
    } catch (e) {}
  }

  return { get: get, set: set, remove: remove, clearAll: clearAll };
})();