function $(id) { return document.getElementById(id); }

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function debounce(fn, wait) {
  var timer = null;
  return function () {
    var args = arguments, self = this;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(self, args); }, wait);
  };
}