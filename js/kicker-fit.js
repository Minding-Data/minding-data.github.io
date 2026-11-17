/* 2026-11-14k: justify the "Minding Data" kicker to the exact width of the subtitle line below it.
   Measures the subtitle's text extent, sets kicker letter-spacing so its first and last letters
   land on the subtitle's left and right edges, and shifts it horizontally to match. Reruns on resize/fonts. */
(function () {
  function fit() {
    var k = document.querySelector(".band--home .hero-kicker"), s = document.querySelector(".band--home .hero-sub");
    if (!k || !s) return;
    k.style.letterSpacing = "0px"; k.style.transform = "none";
    var rs = document.createRange(); rs.selectNodeContents(s);
    var sr = rs.getBoundingClientRect();
    var tn = k.firstChild; if (!tn) return;
    var rk = document.createRange(); rk.selectNodeContents(k);
    var kr = rk.getBoundingClientRect();
    var n = (tn.textContent || "").length;
    if (n < 2 || sr.width <= 0) return;
    /* letter-spacing is added after every character; n-1 gaps span the visible text */
    var ls = (sr.width - kr.width) / (n - 1);
    k.style.letterSpacing = ls.toFixed(3) + "px";
    var kr2 = rk.getBoundingClientRect();
    k.style.transform = "translateX(" + (sr.left - kr2.left).toFixed(2) + "px)";
    k.setAttribute("data-fit", JSON.stringify({ subW: +sr.width.toFixed(1), ls: +ls.toFixed(2), fs: getComputedStyle(k).fontSize }));
  }
  var t; function later() { clearTimeout(t); t = setTimeout(fit, 60); }
  if (document.readyState !== "loading") fit(); else document.addEventListener("DOMContentLoaded", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener("load", fit); window.addEventListener("resize", later);
})();
