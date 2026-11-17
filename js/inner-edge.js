/* Inner-page header edge + sulci (2026-11-13 template). A shallow version of the homepage
   dissolve (js/dot-edge.js): the CSS banner stops --dz above the header bottom, this canvas
   paints the rest as banner-coloured halftone dots whose front wanders, the faint facet mesh
   runs to the edge (clipped to the purple, never dotted), and a short fall of dots in the
   page's column colours (body.inner--sage etc. -> --cc family) drops toward the content.
   A very faint sulci layer (same geometry as the homepage, js/bg-geom.js) sits behind the
   page, with a few column-colour dots gathering on the upper sulci ends. Static, seeded. */
(function () {
  // 2026-11-14: big data dots + fewer, larger neurons in the margins (chosen configuration)
  var SMALL = false, BIG = true, BS = 1.8;
  "use strict";
  var band = document.querySelector(".band--inner");
  var cv = band && band.querySelector(".dot-edge");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  band.classList.add("has-dots");
  var VIOLETS = ["#640304", "#640304", "#873939", "#873939", "#9c5b5b", "#b3685c", "#b3685c", "#d0b8b8"];   // logo page-side ramp
  // 2026-11-14c: one shared dot ramp with the v7 logo (circle7_lighter): page side dark at the edge -> pale,
  // facet side pale at the edge -> rose; size and opacity taper with distance from the edge like the logo.
  var RAMP_P = ["#640304", "#873939", "#9c5b5b", "#b3685c", "#d0b8b8"], RAMP_F = ["#f8eeeb", "#e6d2d0", "#d0b8b8", "#c3a5a5", "#b3685c"];
  function rampAt(R, t, rv) { var i = Math.floor(Math.max(0, Math.min(0.999, t)) * R.length + (rv - 0.5) * 1.2); return R[Math.max(0, Math.min(R.length - 1, i))]; }
  // 2026-11-17 (t699u): accent dots follow the area: dots--X override, then area--X (project/profile pages), then inner--X
  var bc = document.body.className, fam = (bc.match(/\bdots--(sage|mauve|slate|maroon)\b/) || bc.match(/\barea--(sage|mauve|slate)\b/) || bc.match(/inner--(sage|mauve|slate|maroon)/) || [0, "sage"])[1];

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function makeNoise(seed, step) {
    var r = mulberry32(seed), k1 = [], k2 = [];
    for (var i = 0; i < 400; i++) { k1.push(r()); k2.push(r()); }
    function oct(k, x, st) { var p = x / st, i = Math.floor(p), f = p - i, s = (1 - Math.cos(f * Math.PI)) / 2; var a = k[((i % 400) + 400) % 400], b = k[(((i + 1) % 400) + 400) % 400]; return a + (b - a) * s; }
    return function (x) { return 0.68 * oct(k1, x, step) + 0.32 * oct(k2, x, step / 3); };
  }
  var probe = null;
  function cssColor(name, fb) {
    if (!probe) { probe = document.createElement("span"); probe.style.display = "none"; document.body.appendChild(probe); }
    probe.style.color = ""; probe.style.color = "var(" + name + ")";
    var c = getComputedStyle(probe).color;
    var m = /^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)/.exec(c || "");
    if (m) c = "rgb(" + [m[1], m[2], m[3]].map(function (v) { return Math.round(Math.max(0, Math.min(1, +v)) * 255); }).join(",") + ")";
    return (c && probe.style.color) ? c : fb;
  }
  function paintBand(c, W, Hb, offY) {                         // replica of the .band background
    c.save(); c.globalCompositeOperation = "source-in"; c.translate(0, -offY);
    var a = 135 * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), len = Math.abs(W * Math.sin(a)) + Math.abs(Hb * Math.cos(a)), cx = W / 2, cy = Hb / 2;
    var lg = c.createLinearGradient(cx - dx * len / 2, cy - dy * len / 2, cx + dx * len / 2, cy + dy * len / 2);
    lg.addColorStop(0, "#8c3d3e"); lg.addColorStop(0.5, "#7a2a2c"); lg.addColorStop(1, "#6a1416");
    c.fillStyle = lg; c.fillRect(0, 0, W, Hb + 600); c.globalCompositeOperation = "source-atop";
    function radial(px, py, rx, ry, rgb, al, stop) { c.save(); c.translate(px, py); c.scale(1, ry / rx); var g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, "rgba(" + rgb + "," + al + ")"); g.addColorStop(stop, "rgba(" + rgb + ",0)"); g.addColorStop(1, "rgba(" + rgb + ",0)"); c.fillStyle = g; c.fillRect(-rx * 2, -rx * 2, rx * 4, rx * 4); c.restore(); }
    radial(W, Hb, 700, 380, "43,6,6", 0.32, 0.62); radial(W * 0.08, -0.1 * Hb, 900, 420, "195,120,110", 0.30, 0.60);
    c.restore();
  }

  var mask = null, mctx = null, meshCv = null, meshCtx = null, sl = null;
  function draw() {
    var bR = band.getBoundingClientRect(), W = Math.round(bR.width), Hb = bR.height, mobile = W < 860;
    var dz = parseFloat(getComputedStyle(band).getPropertyValue("--dz")) || 26, solid = Hb - dz;
    var ACC = [cssColor("--" + fam, "#75b296"), cssColor("--" + fam + "-dot", "#9cc8b3"), cssColor("--" + fam + "-alt", "#62967e")];
    if (/[?&]code=headers\b/.test(location.search)) ACC = ["#873939", "#9c5b5b", "#b3685c"];   // 2026-11-14f option: all dots burgundy
    var SP = mobile ? 9 : 11, FR = mobile ? 12 : 18, E0 = mobile ? 40 : 56;
    var top = Math.min(solid - SP * 3, 8), bottom = Hb + (mobile ? 62 : 86), H = Math.ceil(bottom - top), dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.style.top = top + "px"; cv.style.height = H + "px";
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (!mask) { mask = document.createElement("canvas"); mctx = mask.getContext("2d"); }
    mask.width = cv.width; mask.height = cv.height; mctx.setTransform(dpr, 0, 0, dpr, 0, 0); mctx.clearRect(0, 0, W, H);
    var r = mulberry32(20261114), noise = makeNoise(5521, mobile ? 40 : 54);
    function Y(y) { return y - top; }
    function front(x) { return solid + SP * 0.6 + noise(x) * FR; }
    function band_(x, y, rad) { mctx.globalAlpha = 1; mctx.fillStyle = "#000"; mctx.beginPath(); mctx.arc(x, Y(y), rad, 0, 6.2832); mctx.fill(); }
    var thin = mulberry32(778), SZ = [2.2, 3.2, 4.4, 5.8, 7.4];
    function snap(rd) { var b = SZ[0]; for (var i = 0; i < SZ.length; i++) if (Math.abs(SZ[i] - rd) < Math.abs(b - rd)) b = SZ[i]; return b; }
    function dot(x, y, rad, col, al) { if (rad <= 0.25) return; if (!SMALL) { if (thin() < 0.4) return; rad = snap(rad * 1.45); al = Math.min(0.95, 0.3 + al * 0.85); } ctx.globalAlpha = al; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, Y(y), rad, 0, 6.2832); ctx.fill(); }
    // 1) shallow halftone dissolve
    for (var yb = solid - SP * 2.2, row = 0; yb < solid + SP + FR + E0; yb += SP * 0.87, row++) {
      var off = (row % 2) * SP / 2;
      for (var gx = -SP; gx < W + SP; gx += SP) {
        var x = gx + off, d = yb - front(x);
        if (d < 0) { band_(x, yb, SP * 0.8); continue; }
        var t = d / E0; if (t >= 1) continue;
        if (t > 0.03 && r() > Math.pow(1 - t, 2.2) * 0.95) continue;
        var jx = x + (r() - 0.5) * SP * 0.7 * Math.min(1, t * 3), jy = yb + (r() - 0.5) * SP * 0.6 * Math.min(1, t * 3);
        var rad = SP * 0.62 * Math.pow(1 - t, 0.95) * (0.72 + r() * 0.42);
        if (t < 0.05 + r() * 0.1) { band_(jx, jy, rad); continue; }
        var accent = r() < 0.28 * t + 0.08;
        dot(jx, jy, rad, accent ? pick(r, ACC) : rampAt(RAMP_P, t, r()), (0.82 - 0.5 * t) * (0.9 + r() * 0.1));
      }
    }
    // 2) short fall of dots, column colour mixed with lavender
    var STEP = mobile ? 17 : 21;
    for (var dx0 = STEP * 0.5; dx0 < W; dx0 += STEP) {
      var xx = dx0 + (r() - 0.5) * STEP * 0.8, yy = front(xx) + E0 * (0.2 + r() * 0.25), y1 = yy + (bottom - 4 - yy) * (0.4 + 0.6 * r()), rr0 = (mobile ? 3.2 : 3.9) * (0.8 + r() * 0.4);
      while (yy < y1) {
        var tt = (yy - front(xx)) / Math.max(1, bottom - front(xx)), acc = r() < 0.5;
        dot(xx + gauss(r) * (1.5 + tt * 8), yy, (rr0 * Math.pow(1 - tt, 0.7) + 0.7) * (0.7 + r() * 0.5), acc ? pick(r, ACC) : rampAt(RAMP_P, 0.45 + tt * 0.55, r()), (acc ? 0.55 : 0.35) + 0.35 * (1 - tt) * r());
        yy += (mobile ? 6 : 7) + tt * 14 * (0.5 + r()) + r() * 5; xx += gauss(r) * 2;
      }
    }
    paintBand(mctx, W, solid, top);
    // 2b) sparse up-projection: lighter tints and the column colour rising from the edge into
    //     the purple, thinning and fading upward, kept clear of the CV/Profiles/logo group.
    var nav = band.querySelector(".topnav"), nR = nav ? nav.getBoundingClientRect() : null;
    var keep = nR ? { l: nR.left - bR.left - 22, r: nR.right - bR.left + 22, t: nR.top - bR.top - 14, b: nR.bottom - bR.top + 14 } : null;
    var RISE = ["#f8eeeb", "#e6d2d0", "#d0b8b8", ACC[1], ACC[1], ACC[0]];   // logo facet-side pales + the column colour
    var riseTop = 14, span = solid + SP - riseTop, ru = mulberry32(8282);
    function up(x, y, rad, col, al) { if (keep && x > keep.l && x < keep.r && y > keep.t && y < keep.b) return; ups.push([x, y, rad, col, al]); }
    var ups = [];
    var nCl = Math.round(W / (mobile ? 70 : 85));
    for (var cI = 0; cI < nCl; cI++) {
      var cxu = ru() * W, cq = Math.pow(ru(), 0.6), cyu = riseTop + 4 + cq * (span - 4), nIn = 1 + Math.floor(Math.pow(ru(), 1.4) * (mobile ? 8 : 12));
      var sx = 4 + ru() * 14, sy = 2 + ru() * 6;
      for (var m = 0; m < nIn; m++) {
        var py = Math.min(solid + SP, cyu + gauss(ru) * sy); if (py < riseTop) continue;
        var qq = (py - riseTop) / span;
        up(cxu + gauss(ru) * sx, py, (0.8 + 2.6 * qq * (0.5 + ru() * 0.6)) * 1.5, pick(ru, RISE), Math.min(0.85, 0.11 + 0.56 * qq * (0.4 + ru() * 0.6)));
      }
    }
    for (var uI = 0; uI < W / (mobile ? 16 : 13); uI++) {
      var uq = Math.pow(ru(), 0.9), uy = riseTop + uq * span;
      up(ru() * W, uy, (0.7 + 2 * uq * ru()) * 1.5, pick(ru, RISE), 0.09 + 0.32 * uq + 0.07 * ru());
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "destination-over"; ctx.drawImage(mask, 0, 0); ctx.restore();
    // 3) faint facet mesh to the edge, clipped to the purple (matches the CSS ::before opacity)
    var G = window.__BG_GEOM;
    if (G && G.mesh) {
      var M = G.mesh, tile0 = (W - M.w) / 2;
      if (!meshCv) { meshCv = document.createElement("canvas"); meshCtx = meshCv.getContext("2d"); }
      meshCv.width = cv.width; meshCv.height = cv.height;
      var mc = meshCtx; mc.setTransform(dpr, 0, 0, dpr, 0, 0); mc.clearRect(0, 0, W, H);
      mc.lineCap = "round"; mc.strokeStyle = M.stroke; mc.lineWidth = M.width;
      if (M.tri) {                                               // burgundy copy: lit facet fills (logo shading), drawn under the edges
        for (var fx = tile0 - Math.ceil(tile0 / M.w + 1) * M.w; fx < W + M.w; fx += M.w)
          for (var fi = 0; fi < M.tri.length; fi++) {
            var T = M.tri[fi], ty0 = Math.min(T[1], T[3], T[5]), ty1 = Math.max(T[1], T[3], T[5]);
            if (ty1 < top || ty0 > bottom) continue;
            mc.globalAlpha = Math.min(1, T[7] / M.opacity); mc.fillStyle = T[6];
            mc.beginPath(); mc.moveTo(T[0] + fx, Y(T[1])); mc.lineTo(T[2] + fx, Y(T[3])); mc.lineTo(T[4] + fx, Y(T[5])); mc.closePath(); mc.fill();
          }
        mc.globalAlpha = 1;
      }
      for (var tx = tile0 - Math.ceil(tile0 / M.w + 1) * M.w; tx < W + M.w; tx += M.w)
        for (var q = 0; q < M.seg.length; q += 4) {
          var ay = M.seg[q + 1], by = M.seg[q + 3];
          if (Math.max(ay, by) < top || Math.min(ay, by) > bottom) continue;
          mc.beginPath(); mc.moveTo(M.seg[q] + tx, Y(ay)); mc.lineTo(M.seg[q + 2] + tx, Y(by)); mc.stroke();
        }
      mc.setTransform(1, 0, 0, 1, 0, 0); mc.globalCompositeOperation = "destination-in"; mc.drawImage(mask, 0, 0); mc.globalCompositeOperation = "source-over";
      var op = parseFloat(getComputedStyle(band, "::before").opacity); if (!(op >= 0)) op = 1;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = M.opacity * op; ctx.drawImage(meshCv, 0, 0); ctx.restore();
    }
    for (var ui = 0; ui < ups.length; ui++) dot(ups[ui][0], ups[ui][1], ups[ui][2], ups[ui][3], ups[ui][4]);   // drawn above the edge fill and mesh
    ctx.globalAlpha = 1;
    drawSulci(W, Hb, bR, bottom, ACC, mobile);
  }

  function drawSulci(W, Hb, bR, dotBottom, ACC, mobile) {
    var G = window.__BG_GEOM; if (!G || !G.left) return;
    var pageTop = bR.top + window.scrollY, top0 = pageTop + Hb;
    if (sl) sl.style.height = "0px";
    var docH = document.documentElement.scrollHeight;
    if (!sl) { sl = document.createElement("canvas"); sl.className = "sulci-layer"; sl.setAttribute("aria-hidden", "true"); document.body.insertBefore(sl, document.body.firstChild); }
    var LH = Math.max(10, Math.floor(docH - top0)), dpr = Math.min(window.devicePixelRatio || 1, 2);
    sl.style.top = top0 + "px"; sl.style.height = LH + "px"; sl.width = Math.round(W * dpr); sl.height = Math.round(LH * dpr);
    var c = sl.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, LH);
    var narrow = W <= 860, sideW = (narrow ? 150 : 300) * BS, r = mulberry32(4711), SULC = cssColor("--sulcus", "#efe3e1");
    var NLINE = SULC, NSOMA = SULC;   /* round 15: same colour as the sulci/footer (Sarah: colour is right) */
    // margins only (the centre set would run under the text); placed from just below the header
    var sets = [{ g: G.left, x: BIG ? -300 : -20 }, { g: G.right, x: W + 20 - sideW + (BIG ? 280 : 0) }];
    var yOff = narrow ? -120 : -160;
    // round 17: a few extra neurons in the empty margin areas (not under the text column)
    var mainEl = document.querySelector("main") || document.body, mq = mainEl.getBoundingClientRect(), footEl = document.querySelector(".site-foot");
    var footY = footEl ? footEl.getBoundingClientRect().top + window.scrollY - top0 : LH, avoidI = [[mq.left - bR.left - 10, -1e4, mq.right - bR.left + 10, 1e5]];
    var COV = [];
    sets[0].fill = { n: narrow ? 1 : (BIG ? 1 : 2), x0: 0, y0: BIG ? 190 : 60, x1: mq.left - bR.left - 10, y1: footY - 30, avoid: avoidI, gap: 100, space: 170 };
    sets[1].fill = { n: narrow ? 1 : (BIG ? 1 : 2), x0: mq.right - bR.left + 10, y0: BIG ? 190 : 60, x1: W, y1: footY - 30, avoid: avoidI, gap: 100, space: 170 };                                  // pull the upper sulci up to meet the dots
    sets.forEach(function (S) {                                       // round 13: soft neurons, no end dots
      var s = sideW / S.g.vw, tp = S.g.paths.map(function (P) { var q = []; for (var i = 0; i < P.length; i += 2) q.push(S.x + P[i] * s, P[i + 1] * s + yOff); return q; });
      window.__NEURALIZE(c, tp, s, NLINE, r, { link: 170, soma: NSOMA, fill: S.fill, cov: COV, ws: BIG ? 0.72 : 1, axon: BIG ? 340 : 320, thinTop: BIG ? 150 : 0, thinKeep: 1, vis: [W, LH], stats: (window.__innerStats = {}) });
    });
    c.globalAlpha = 1;
  }

  var raf = 0;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
  draw();
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("load", schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
})();
