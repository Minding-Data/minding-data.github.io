/* 2026-11-14l/m: hero lines are left-aligned as one block (CSS). This nudges the "MINDING DATA" kicker and
   the "Sarah H. Kerns" title so the INK of their first letters (M, S) starts exactly where the ink of the
   N in "Neuroscience" starts (optical alignment: corrects for each glyph's side bearing). Reruns on fonts/resize. */
(function () {
  var cv = document.createElement("canvas").getContext("2d");
  function inkL(el, ch) { var c = getComputedStyle(el); cv.font = c.fontStyle + " " + c.fontWeight + " " + c.fontSize + " " + c.fontFamily; return -cv.measureText(ch).actualBoundingBoxLeft; }
  function first(el) { var r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().left; }
  function ch0(el) { var t = (el.textContent || "").trim().charAt(0); return getComputedStyle(el).textTransform === "uppercase" ? t.toUpperCase() : t; }
  function align() {
    var b = document.querySelector(".band--home"); if (!b) return;
    var s = b.querySelector(".hero-sub"); if (!s) return;
    var target = first(s) + inkL(s, ch0(s)), out = {};
    [[".hero-kicker", "k"], [".name-lock h1", "h"]].forEach(function (p) {
      var e = b.querySelector(p[0]); if (!e) return;
      e.style.transform = "none";
      var dx = target - (first(e) + inkL(e, ch0(e)));
      e.style.transform = "translateX(" + dx.toFixed(2) + "px)"; out[p[1]] = +dx.toFixed(2);
    });
    b.setAttribute("data-align", JSON.stringify(out));
  }
  var t; function later() { clearTimeout(t); t = setTimeout(align, 60); }
  if (document.readyState !== "loading") align(); else document.addEventListener("DOMContentLoaded", align);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(align);
  window.addEventListener("load", align); window.addEventListener("resize", later);
})();
