/* Dissolving data-matrix edge for the home banner (2026-11-13e).
   The CSS banner background stops --dz above the banner bottom (.has-dots).
   This canvas paints the rest of the banner as overlapping, banner-coloured
   dots whose front wanders (seeded value noise), so the solid purple breaks
   up organically with no straight seam. Below, dots shrink and thin out and
   fall in three streams over the three columns. Faint pale-gray and lavender
   dots rise into the solid banner. Static: drawn once per layout, never
   animated (so prefers-reduced-motion is respected). Deterministic: fixed seed. */
(function () {
  // 2026-11-14: Sarah chose big data dots + fewer, larger neurons (cmp-site "big=1"); the other variants stay in the code, switched off
  var SMALL = false, SULCI = false, BIG = true, BS = 1.8;
  var CODE_HEADERS = !/[?&]code=dots\b/.test(location.search);   // 2026-11-14g default: colour-coding by headers/outlines, all dots burgundy (?code=dots shows the old column dots)   // 2026-11-14f option: colour-code by headers/outlines, all dots burgundy
  "use strict";
  var band = document.querySelector(".band--home");
  var cv = band && band.querySelector(".dot-edge");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var cols3 = document.querySelector(".cols3");
  var eyebrow = null;
  var sub = band.querySelector(".hero-sub");
  band.classList.add("has-dots");

  var VIOLETS = ["#640304", "#640304", "#873939", "#873939", "#9c5b5b", "#b3685c", "#b3685c", "#d0b8b8"];   // logo page-side ramp
  // 2026-11-14c: one shared dot ramp with the v7 logo (circle7_lighter): page side dark at the edge -> pale,
  // facet side pale at the edge -> rose; size and opacity taper with distance from the edge like the logo.
  var RAMP_P = ["#640304", "#873939", "#9c5b5b", "#b3685c", "#d0b8b8"], RAMP_F = ["#f8eeeb", "#e6d2d0", "#d0b8b8", "#c3a5a5", "#b3685c"];
  function rampAt(R, t, rv) { var i = Math.floor(Math.max(0, Math.min(0.999, t)) * R.length + (rv - 0.5) * 1.2); return R[Math.max(0, Math.min(R.length - 1, i))]; }
  var RISE = ["#e4e3ea", "#d0cfd6", "#c7c9d6", "#d0b8b8", "#decbcb"];   // pale cool gray + lavender
  var ACCENT = [
    ["#75b296", "#9dc8b3", "#5f9f81"],                       // fallbacks only; real values read from CSS
    ["#a560db", "#c090e6", "#ccaaea"],
    ["#8f8b94", "#d8d7da", "#aba8af"]
  ];
  var BAND = "__band__";
  // Column accents come from the CSS custom properties (--sage/--mauve/--slate and their
  // -dot/-alt mixes), so one change in css/theme-palette.css updates outlines AND dots.
  var probe = null;
  function cssColor(name, fb) {
    if (!probe) { probe = document.createElement("span"); probe.style.display = "none"; document.body.appendChild(probe); }
    probe.style.color = ""; probe.style.color = "var(" + name + ")";
    var c = getComputedStyle(probe).color;
    var m = /^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)/.exec(c || "");   // color-mix() computes to color(srgb ...)
    if (m) c = "rgb(" + [m[1], m[2], m[3]].map(function (v) { return Math.round(Math.max(0, Math.min(1, +v)) * 255); }).join(",") + ")";
    return (c && c !== "rgba(0, 0, 0, 0)" && probe.style.color) ? c : fb;
  }
  function readAccents() {
    var fam = ["sage", "mauve", "slate"];
    for (var i = 0; i < 3; i++) {
      ACCENT[i] = [cssColor("--" + fam[i], ACCENT[i][0]), cssColor("--" + fam[i] + "-dot", ACCENT[i][1]), cssColor("--" + fam[i] + "-alt", ACCENT[i][2])];
    }
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(r, arr) { return arr[Math.floor(r() * arr.length) % arr.length]; }
  function gauss(r) { var u = 1 - r(), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  // 1-D value noise in [0,1], two octaves, seeded.
  function makeNoise(seed, step) {
    var r = mulberry32(seed), k1 = [], k2 = [];
    for (var i = 0; i < 400; i++) { k1.push(r()); k2.push(r()); }
    function oct(k, x, st) {
      var p = x / st, i = Math.floor(p), f = p - i, s = (1 - Math.cos(f * Math.PI)) / 2;
      var a = k[((i % 400) + 400) % 400], b = k[(((i + 1) % 400) + 400) % 400];
      return a + (b - a) * s;
    }
    return function (x) { return 0.68 * oct(k1, x, step) + 0.32 * oct(k2, x, step / 3); };
  }

  var stats = null, mask = null, mctx = null, meshCv = null, meshCtx = null;
  // Round 12: one data-dot interface. Every coloured dot, falling or rising, snaps to the same
  // five sizes (scatterplot-like), ~45% larger, crisper, ~40% fewer.
  var SIZES = [2.2, 3.2, 4.4, 5.8, 7.4], thin = null;
  function snap(rd) { var b = SIZES[0]; for (var i = 0; i < SIZES.length; i++) if (Math.abs(SIZES[i] - rd) < Math.abs(b - rd)) b = SIZES[i]; return b; }
  function dot(x, y, rad, color, alpha, kind) {
    if (rad <= 0.25) return;
    if (color !== BAND && !SMALL) { if (thin() < 0.4) return; rad = snap(rad * 1.45); alpha = Math.min(0.95, 0.3 + alpha * 0.85); }
    var c = color === BAND ? mctx : ctx;
    c.globalAlpha = alpha;
    c.fillStyle = color === BAND ? "#000" : color;
    c.beginPath();
    c.arc(x, y, rad, 0, Math.PI * 2);
    c.fill();
    if (kind) stats[kind] = (stats[kind] || 0) + 1;
  }
  // Replica of the .band background (css/theme-palette.css) on a box W x Hb.
  function paintBand(c, W, Hb, offY) {
    c.save();
    c.globalCompositeOperation = "source-in";
    c.translate(0, -offY);
    var a = 135 * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a);
    var len = Math.abs(W * Math.sin(a)) + Math.abs(Hb * Math.cos(a));
    var cx = W / 2, cy = Hb / 2;
    var lg = c.createLinearGradient(cx - dx * len / 2, cy - dy * len / 2, cx + dx * len / 2, cy + dy * len / 2);
    lg.addColorStop(0, "#8c3d3e"); lg.addColorStop(0.5, "#7a2a2c"); lg.addColorStop(1, "#6a1416");
    c.fillStyle = lg; c.fillRect(0, 0, W, Hb + 600);
    c.globalCompositeOperation = "source-atop";
    function radial(px, py, rx, ry, rgb, al, stop) {
      c.save(); c.translate(px, py); c.scale(1, ry / rx);
      var g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, "rgba(" + rgb + "," + al + ")"); g.addColorStop(stop, "rgba(" + rgb + ",0)"); g.addColorStop(1, "rgba(" + rgb + ",0)");
      c.fillStyle = g; c.fillRect(-rx * 2, -rx * 2, rx * 4, rx * 4); c.restore();
    }
    radial(W, Hb, 700, 380, "43,6,6", 0.32, 0.62);
    radial(W * 0.08, -0.1 * Hb, 900, 420, "195,120,110", 0.30, 0.60);
    c.restore();
  }

  function draw() {
    var bR = band.getBoundingClientRect();
    var W = Math.round(bR.width), Hb = bR.height;
    var mobile = W < 860;
    var dz = parseFloat(getComputedStyle(band).getPropertyValue("--dz")) || 44;
    var solid = Hb - dz;                                       // where the CSS background stops (band coords)
    var subBottom = sub ? sub.getBoundingClientRect().bottom - bR.top : solid - 120;
    var riseTop = Math.max(14, Math.min(solid - 40, solid - (mobile ? 110 : 160)));   // round 13: taller rise zone; the name block is a keep-out instead
    var keep = [].map.call(band.querySelectorAll(".hero-name,.hero-kicker,.hero-sub,.topnav,.topbar a,.hero-logo"), function (e) { var q = e.getBoundingClientRect(); return [q.left - bR.left - 16, q.top - bR.top - 12, q.right - bR.left + 16, q.bottom - bR.top + 10]; }).filter(function (k) { return k[2] - k[0] > 0; });
    function kept(x, y, rd) { for (var i = 0; i < keep.length; i++) { var k = keep[i]; if (x + rd > k[0] && x - rd < k[2] && y + rd > k[1] && y - rd < k[3]) return true; } return false; }
    var target = cols3 ? cols3.getBoundingClientRect().top - bR.top - 10 : Hb + 200;
    var bottom = Math.max(Hb + 120, Math.min(Hb + (mobile ? 260 : 420), target));
    var H = Math.ceil(bottom - riseTop);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.style.top = riseTop + "px";
    cv.style.height = H + "px";
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    if (!mask) { mask = document.createElement("canvas"); mctx = mask.getContext("2d"); }
    mask.width = cv.width; mask.height = cv.height;
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0); mctx.clearRect(0, 0, W, H);
    stats = {};
    readAccents(); window.__dotEdgeAccents = ACCENT;
    var r = mulberry32(20261113);
    thin = mulberry32(777);
    var noise = makeNoise(7741, mobile ? 44 : 58);
    function Y(yb) { return yb - riseTop; }                   // band coords -> canvas coords

    // Stream centers = column centers, or three even slots when columns stack.
    var centers = [], colEls = cols3 ? cols3.querySelectorAll(".col") : [];
    for (var i = 0; i < colEls.length && i < 3; i++) { var cr = colEls[i].getBoundingClientRect(); centers.push(cr.left - bR.left + cr.width / 2); }
    if (centers.length < 3 || Math.abs(centers[0] - centers[2]) < 40) {
      var cw = cols3 ? cols3.getBoundingClientRect() : { left: bR.left, width: W }, x0 = cw.left - bR.left;
      centers = [x0 + cw.width / 6, x0 + cw.width / 2, x0 + cw.width * 5 / 6];
    }
    var SIG = mobile ? 34 : 72;
    function sw(x) { var s = 0; for (var k = 0; k < 3; k++) { var d = (x - centers[k]) / SIG; s = Math.max(s, Math.exp(-d * d)); } return s; }

    // 1) Halftone dissolve along a gently wandering front (nearly level, so the
    //    drip reads as uniform along the whole edge). Above the front the dots
    //    overlap into solid banner colour, hiding where the CSS background stops.
    var SP = mobile ? 11 : 13;                                // larger halftone (2026-11-13e)
    var FR = mobile ? 26 : 40;                                  // moderate front wander (no straight shelf)
    var E0 = mobile ? 100 : 150, E1 = mobile ? 14 : 24;           // dissolve depth, tiny extra over columns
    var yStart = solid - SP * 2.5, yEnd = solid + SP + FR + E0 + E1;
    function frontAt(x) { return solid + SP + noise(x) * FR; }
    for (var yb = yStart, row = 0; yb < yEnd; yb += SP * 0.87, row++) {
      var off = (row % 2) * SP / 2;
      for (var gx = -SP; gx < W + SP; gx += SP) {
        var x = gx + off, w = sw(x);
        var d = yb - frontAt(x);
        if (d < 0) { dot(x, Y(yb), SP * 0.8, BAND, 1, null); continue; }   // solid fill, not counted
        var E = E0 + E1 * w, t = d / E;
        if (t >= 1) continue;
        var jx = x + (r() - 0.5) * SP * 0.7 * Math.min(1, t * 3), jy = yb + (r() - 0.5) * SP * 0.6 * Math.min(1, t * 3);
        if (t > 0.03 && r() > Math.pow(1 - t, 2.2) * 0.95) continue;   // airier (big-dot set restored 2026-11-14d)
        var rad = SP * 0.62 * Math.pow(1 - t, 0.95) * (0.72 + r() * 0.42);
        if (t < 0.05 + r() * 0.1) { dot(jx, Y(jy), rad, BAND, 1, "violet"); continue; }
        dot(jx, Y(jy), rad, rampAt(RAMP_P, t, r()), (0.82 - 0.5 * t) * (0.9 + r() * 0.1), "violet");
      }
    }

    // 2) Drips, evenly spaced along the WHOLE edge. Each starts inside the dissolve
    //    (so there is no gap below the edge) and falls as a trail of shrinking dots.
    //    Over each column a few drips run a little longer and carry the column accent.
    var STEP = mobile ? 19 : 23, maxDrop = bottom - 4;
    for (var dx0 = STEP * 0.5; dx0 < W; dx0 += STEP) {
      var dxp = dx0 + (r() - 0.5) * STEP * 0.8, wcol, si = 0, bd = 1e9;
      wcol = sw(dxp);
      for (var k = 0; k < 3; k++) { var dd = Math.abs(dxp - centers[k]); if (dd < bd) { bd = dd; si = k; } }
      var y0 = frontAt(dxp) + E0 * (0.15 + r() * 0.2);
      var len = (maxDrop - y0) * Math.min(1, 0.55 + 0.4 * Math.pow(r(), 0.8) + 0.3 * wcol);
      var yy = y0, xx = dxp, step = 0, rr0 = (mobile ? 4.4 : 5.4) * (0.8 + r() * 0.4);
      // some drips begin with a few banner-coloured drops hanging off the edge
      if (r() < 0.45) {
        var hy = frontAt(dxp) - SP * 0.3, hn = 1 + Math.floor(r() * 3), hr = SP * (0.55 + r() * 0.2);
        for (var h = 0; h < hn; h++) { dot(dxp + gauss(r) * 1.2, Y(hy), hr, BAND, 1, "violet"); hy += hr * (1.3 + r() * 0.5); hr *= 0.78; }
        y0 = Math.max(y0, hy);
      }
      while (yy < y0 + len && yy < maxDrop) {
        var tt = (yy - y0) / Math.max(1, len);
        var rr = rr0 * Math.pow(1 - tt, 0.7) + 0.9;
        var acc = r() < 0.55 * wcol;
        var ox = gauss(r) * (2 + tt * 12);                     // trail loosens as it falls
        if (acc) { r(); r(); r(); }                               // 2026-11-14f: column accents now come from one shared pattern below (same RNG use, so burgundy dots stay put)
        else dot(xx + ox, Y(yy), rr * (0.7 + r() * 0.5), rampAt(RAMP_P, 0.35 + tt * 0.65, r()), 0.4 + 0.5 * (1 - tt) * r(), "violet");
        if (r() < 0.35 * (1 - tt)) dot(xx + ox + gauss(r) * 4, Y(yy + gauss(r) * 3), rr * 0.55, rampAt(RAMP_P, 0.5 + tt * 0.5, r()), 0.35 + 0.3 * r(), "violet");
        step = (mobile ? 7 : 8) + tt * (mobile ? 14 : 18) * (0.5 + r()) + r() * 7;
        yy += step; xx += gauss(r) * 2.4;
      }
    }

    mctx.globalAlpha = 1;
    paintBand(mctx, W, solid, riseTop);                        // CSS bg box is W x (Hb - dz)
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "destination-over"; ctx.drawImage(mask, 0, 0); ctx.restore();

    // 2b) Facet mesh continues to the dissolving edge (same coordinates as the CSS
    //     banner-mesh.svg tile, which stops where the canvas fill begins), clipped to the
    //     purple itself, so the lines run to the edge but never turn into dots.
    var G = window.__BG_GEOM;
    if (G && G.mesh) {
      var M = G.mesh, tile0 = (W - M.w) / 2, y0m = yStart - SP * 0.8 - 1;
      if (!meshCv) { meshCv = document.createElement("canvas"); meshCtx = meshCv.getContext("2d"); }
      meshCv.width = cv.width; meshCv.height = cv.height;
      var mc = meshCtx; mc.setTransform(dpr, 0, 0, dpr, 0, 0); mc.clearRect(0, 0, W, H);
      mc.lineCap = "round"; mc.lineJoin = "round"; mc.strokeStyle = M.stroke; mc.lineWidth = M.width; mc.globalAlpha = 1;
      if (M.tri) {                                               // burgundy copy: lit facet fills (logo shading), drawn under the edges
        for (var fx = tile0 - Math.ceil(tile0 / M.w + 1) * M.w; fx < W + M.w; fx += M.w)
          for (var fi = 0; fi < M.tri.length; fi++) {
            var T = M.tri[fi], ty0 = Math.min(T[1], T[3], T[5]), ty1 = Math.max(T[1], T[3], T[5]);
            if (ty1 < y0m - 2 || ty0 > yEnd) continue;
            mc.globalAlpha = Math.min(1, T[7] / M.opacity); mc.fillStyle = T[6];
            mc.beginPath(); mc.moveTo(T[0] + fx, Y(T[1])); mc.lineTo(T[2] + fx, Y(T[3])); mc.lineTo(T[4] + fx, Y(T[5])); mc.closePath(); mc.fill();
          }
        mc.globalAlpha = 1;
      }
      for (var tx = tile0 - Math.ceil(tile0 / M.w + 1) * M.w; tx < W + M.w; tx += M.w) {
        for (var q = 0; q < M.seg.length; q += 4) {
          var ax = M.seg[q] + tx, ay = M.seg[q + 1], bx = M.seg[q + 2] + tx, by = M.seg[q + 3];
          if (Math.max(ay, by) < y0m - 2 || Math.min(ay, by) > yEnd) continue;
          if (Math.max(ax, bx) < -20 || Math.min(ax, bx) > W + 20) continue;
          var Ls = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.ceil(Ls / 3));
          mc.beginPath();
          for (var k3 = 0; k3 <= n; k3++) {
            var u3 = k3 / n, px3 = ax + (bx - ax) * u3, py3 = ay + (by - ay) * u3;
            var wy = Y(py3);
            if (k3 === 0) mc.moveTo(px3, wy); else mc.lineTo(px3, wy);
          }
          mc.stroke();
        }
      }
      mc.setTransform(1, 0, 0, 1, 0, 0);
      mc.globalCompositeOperation = "destination-in"; mc.drawImage(mask, 0, 0);   // only inside the purple
      mc.globalCompositeOperation = "source-over";
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = M.opacity; ctx.drawImage(meshCv, 0, 0); ctx.restore();
      stats.meshLines = 1;
    }

    // 2b) Column accent streams (2026-11-14f): ONE seeded pattern, translated to each column centre, so the
    //     green, mustard and purple streams have identical organisation, density, falloff and spacing.
    if (!CODE_HEADERS) for (var ck = 0; ck < 3; ck++) {
      var rc = mulberry32(4242), cxk = centers[ck];
      for (var aj = 0; aj < (mobile ? 3 : 5); aj++) {
        var ax0 = cxk + gauss(rc) * SIG * 0.42, ay = frontAt(cxk) + E0 * (0.12 + rc() * 0.22), alen = (maxDrop - ay) * (0.4 + 0.55 * rc());
        var arr0 = (mobile ? 4.4 : 5.4) * (0.8 + rc() * 0.4), ayy = ay, axx = ax0;
        while (ayy < ay + alen && ayy < maxDrop) {
          var att = (ayy - ay) / Math.max(1, alen), arr = arr0 * Math.pow(1 - att, 0.7) + 0.9, aox = gauss(rc) * (2 + att * 12);
          if (rc() < 0.62) {
            var aRad = SMALL ? arr * (0.7 + rc() * 0.5) : snap(arr * (0.7 + rc() * 0.5) * 1.45), aAl = Math.min(0.95, 0.3 + (0.7 + 0.3 * (1 - att) * rc()) * 0.85);
            ctx.globalAlpha = aAl; ctx.fillStyle = pick(rc, ACCENT[ck]); ctx.beginPath(); ctx.arc(axx + aox, Y(ayy), aRad, 0, 6.2832); ctx.fill();
            stats["accent" + ck] = (stats["accent" + ck] || 0) + 1;
          }
          ayy += (mobile ? 7 : 8) + att * (mobile ? 14 : 18) * (0.5 + rc()) + rc() * 7; axx += gauss(rc) * 2.4;
        }
      }
    }
    ctx.globalAlpha = 1;
    var RUP = 1.7;                                               // rising dots use the same size set as the falling ones
    // 3) Rising dots (round 13): separate, evenly spread points with minimum-distance (Poisson-disk)
    //    spacing like the falling dots; densest just above the edge, thinning upward; same five sizes.
    var rnoise = makeNoise(9137, mobile ? 34 : 52);
    var span = solid + SP - riseTop, placed = [], want = Math.round(W / (SMALL ? 4 : (mobile ? 9 : 8))), tries = 0;
    while (placed.length < want && tries++ < want * 40) {
      // round 14: start right at the purple edge (continuous with the falling dots) and rise to a
      // random, jagged top boundary; u = 0 at the edge, 1 at the local top.
      var px = r() * W, fy = frontAt(px) - 3, reach = Math.min(fy - riseTop - 4, (mobile ? 45 : 70) + (mobile ? 50 : 85) * rnoise(px) + 26 * r());
      var u = Math.pow(r(), 1.7), q = 1 - u, py = fy - u * reach;
      var rad = SMALL ? (0.9 + (0.4 + 2.2 * q) * r()) : snap(RUP * 1.45 * (0.8 + (0.4 + 1.8 * q) * r())), gap = (SMALL ? 2 : (mobile ? 5 : 6)) + (SMALL ? 9 : 14) * (1 - q), ok = !kept(px, py, rad + 2);
      for (var k = 0; k < placed.length && ok; k++) { var P2 = placed[k]; if (Math.hypot(px - P2[0], py - P2[1]) < rad + P2[2] + gap) ok = false; }
      if (!ok) continue;
      placed.push([px, py, rad]);
      var gcol = rampAt(RAMP_F, u, r());                         // logo facet-side ramp: pale at the edge -> rose higher up
      ctx.globalAlpha = (0.9 - 0.4 * u) * (0.75 + r() * 0.25); ctx.fillStyle = gcol;
      ctx.beginPath(); ctx.arc(px, Y(py), rad, 0, 6.2832); ctx.fill();
      var kk = "riseUp"; stats[kk] = (stats[kk] || 0) + 1;
    }
    ctx.globalAlpha = 1;
    drawSulci(W, Hb, bR, riseTop + H, centers, mobile);
    var tot = 0; for (var k2 in stats) tot += stats[k2];
    stats.total = tot; stats.violetShare = +(stats.violet / tot).toFixed(3);
    window.__dotEdgeStats = stats; cv.setAttribute("data-dots", tot);
  }

  // 4) Cream-body sulci, drawn here (not as CSS backgrounds) so the dots share their geometry.
  //    Placement replicates the old CSS backgrounds exactly. The highest few sulci in each set
  //    get a fading extension up into the drip zone; their top ends dissolve into dots that
  //    gather along the curve and merge with the falling cascade.
  var sl = null, SULC = "#efe3e1", SULC_RGB = "239,227,225";
  function bez(p0, p1, p2, p3, t) { var m = 1 - t; return m * m * m * p0 + 3 * m * m * t * p1 + 3 * m * t * t * p2 + t * t * t * p3; }
  function drawSulci(W, Hb, bR, dotBottom, centers, mobile) {
    var G = window.__BG_GEOM, main = document.querySelector(".home-main");
    var sc = cssColor("--sulcus", SULC), scm = /(\d+)\D+(\d+)\D+(\d+)/.exec(sc); if (scm) { SULC = sc; SULC_RGB = scm[1] + "," + scm[2] + "," + scm[3]; }
    if (!G || !G.left || !main) return;
    var pageTop = bR.top + window.scrollY, top0 = pageTop + Hb;         // layer starts at the banner bottom
    if (sl) sl.style.height = "0px";                                 // measure the page without this layer
    var docH = document.documentElement.scrollHeight;
    if (!sl) { sl = document.createElement("canvas"); sl.className = "sulci-layer"; sl.setAttribute("aria-hidden", "true"); document.body.insertBefore(sl, document.body.firstChild); }
    var LH = Math.max(10, Math.floor(docH - top0)), dpr = Math.min(window.devicePixelRatio || 1, 2);
    sl.style.top = top0 + "px"; sl.style.height = LH + "px";
    sl.width = Math.round(W * dpr); sl.height = Math.round(LH * dpr);
    var NLINE = SULC, NSOMA = SULC;   /* round 15: same colour as the sulci/footer (Sarah: colour is right) */
    var c = sl.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, LH);
    var narrow = window.matchMedia ? window.matchMedia("(max-width:860px)").matches : mobile;
    var mR = main.getBoundingClientRect(), mainL = mR.left - bR.left, mainT = mR.top + window.scrollY;
    var sideW = (narrow ? 150 : 300) * BS, cenW = (narrow ? 700 : 1100) * BS;
    var sets = [
      { g: G.left, s: sideW / G.left.vw, x: BIG ? -260 : -20, y: BIG ? 150 : 330, k: BIG ? 1 : (narrow ? 1 : 3) },
      { g: G.right, s: sideW / G.right.vw, x: W + 20 - sideW + (BIG ? 240 : 0), y: BIG ? 150 : 330, k: BIG ? 1 : (narrow ? 1 : 3) },
      { g: G.center, s: cenW / G.center.vw, x: mainL - 40 + (mR.width + 80 - cenW) / 2 + (BIG ? 160 : 0), y: mainT + (narrow ? 100 : 140) - (BIG ? 260 : 0), k: BIG ? 1 : (narrow ? 2 : 4) }
    ];
    // round 17: a few extra neurons in each set's empty regions (shared coverage), clear of labels and tiles
    var avoidL = [].map.call(document.querySelectorAll(".col-h,.col-affil,.tile,.pill-link,.foot-blurb"), function (e) { var q = e.getBoundingClientRect(); return [q.left - bR.left - 24, q.top + window.scrollY - top0 - 20, q.right - bR.left + 24, q.bottom + window.scrollY - top0 + 20]; });
    var footEl = document.querySelector(".site-foot"), footY = footEl ? footEl.getBoundingClientRect().top + window.scrollY - top0 : LH;
    var colsEl = document.querySelectorAll(".col"), hideL = colsEl[1] ? [].map.call(document.querySelectorAll(".cols3 .tile-media"), function (e) { var q = e.getBoundingClientRect(); return [q.left - bR.left, q.top + window.scrollY - top0, q.right - bR.left, q.bottom + window.scrollY - top0]; }) : [];
    var COV = [], cx0 = sets[2].x, cx1 = sets[2].x + cenW;
    function fl(n, x0, x1) { return { n: BIG ? Math.ceil(n / 2) : n, x0: x0, y0: BIG ? Math.max(190, dotBottom - Hb + 110) : 70, x1: x1, y1: footY - 40, avoid: avoidL, gap: (narrow ? 75 : 88) * (BIG ? 1.6 : 1), space: (narrow ? 130 : 170) * (BIG ? 1.8 : 1), cell: BIG ? 170 : 120 }; }
    sets[0].fill = fl(narrow ? 1 : 2, 0, Math.min(cx0, sideW)); sets[1].fill = fl(narrow ? 1 : 2, Math.max(cx1, W - sideW), W); sets[2].fill = fl(narrow ? 2 : 7, Math.max(0, cx0), Math.min(W, cx1));
    var r = mulberry32(9090), zoneTop = Hb + 34 + pageTop, zoneBot = dotBottom + pageTop;   // page coords of the drip zone
    function L(y) { return y - top0; }
    function stroke(pathFn, s, grad) {                            // embossed stroke, as in the SVGs
      c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = 6.5 * s;    // round 13: thinner rising process (was 10); round 9: a bit more evident (was 9, #f6f4f4)
      c.save(); c.translate(1.6 * s, 1.8 * s); c.globalAlpha = 0.75; c.strokeStyle = grad ? grad("255,255,255") : "#ffffff"; pathFn(); c.stroke(); c.restore();
      c.globalAlpha = 1; c.strokeStyle = grad ? grad(SULC_RGB) : SULC; pathFn(); c.stroke();
    }
    var trails = [];
    sets.forEach(function (S) {
      var cand = [];
      var tp = [];
      S.g.paths.forEach(function (P) {
        var X = function (i) { return S.x + P[i] * S.s; }, Yp = function (i) { return S.y + P[i + 1] * S.s; };
        var q = []; for (var i = 0; i < P.length; i += 2) q.push(X(i), L(Yp(i))); tp.push(q);
        var n = P.length, sY = Yp(0), eY = Yp(n - 2), atStart = sY <= eY;
        var e = atStart ? [X(0), sY, X(2), Yp(2)] : [X(n - 2), eY, X(n - 4), Yp(n - 4)];
        if (e[0] > -5 && e[0] < W + 5) cand.push(e);
      });
      if (SULCI) { var s0 = S.s; tp.forEach(function (q) { function pth() { c.beginPath(); c.moveTo(q[0], q[1]); for (var i = 2; i + 5 < q.length; i += 6) c.bezierCurveTo(q[i], q[i + 1], q[i + 2], q[i + 3], q[i + 4], q[i + 5]); }
        c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = 10 * s0; c.save(); c.translate(1.6 * s0, 1.8 * s0); c.globalAlpha = 0.75; c.strokeStyle = "#ffffff"; pth(); c.stroke(); c.restore(); c.globalAlpha = 1; c.strokeStyle = SULC; pth(); c.stroke(); }); }
      else stats.somas = (stats.somas || 0) + window.__NEURALIZE(c, tp, S.s, NLINE, r, { link: 170, soma: NSOMA, fill: S.fill, cov: COV, ws: BIG ? 0.72 : 1, vis: [W, footY], thinTop: BIG ? Math.max(150, dotBottom - Hb + 80) : 0, thinKeep: 1, axon: BIG ? 340 : 320, hide: narrow ? [] : hideL, stats: stats });   // round 13: sulci -> soft neurons
      cand.sort(function (a, b) { return a[1] - b[1]; });
      for (var j = 0, used = 0; j < cand.length && used < S.k; j++) {
        var e = cand[j];
        if (e[1] > zoneBot + 520) break;
        if (e[1] < zoneTop + 40) continue;
        used++;
        var dx = e[0] - e[2], dy = e[1] - e[3], dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
        if (dy > -0.25) { dy = -0.6; dx = dx * 0.8; }               // keep heading upward
        var ty = zoneTop + 10 + r() * Math.max(10, Math.min(zoneBot - 30, e[1] - 60) - zoneTop - 10);
        var span = e[1] - ty, tx = e[0] + dx * span * 0.35 + gauss(r) * span * 0.18;
        var p0 = [e[0], e[1]], p1 = [e[0] + dx * span * 0.4, e[1] + dy * span * 0.4], p2 = [tx + gauss(r) * span * 0.25, ty + span * 0.3], p3 = [tx, ty];
        var grad = function (rgb) { var g2 = c.createLinearGradient(0, L(ty), 0, L(e[1])); g2.addColorStop(0, "rgba(" + rgb + ",0)"); g2.addColorStop(0.55, "rgba(" + rgb + ",0.75)"); g2.addColorStop(1, "rgba(" + rgb + ",1)"); return g2; };
        stroke(function () { c.beginPath(); c.moveTo(p0[0], L(p0[1])); c.bezierCurveTo(p1[0], L(p1[1]), p2[0], L(p2[1]), p3[0], L(p3[1])); }, S.s, grad);
        trails.push([p0, p1, p2, p3, span]);
      }
    });
    // dots gathering on the extensions: densest and largest at the top (inside the cascade)
    if (false) trails.forEach(function (T) {   // round 13: no dots collecting on the projections (Sarah)
      var n = Math.ceil(T[4] / 7);
      for (var i = 0; i <= n; i++) {
        var u = i / n, px = bez(T[0][0], T[1][0], T[2][0], T[3][0], u), py = bez(T[0][1], T[1][1], T[2][1], T[3][1], u);
        var inZone = py < zoneBot, w = Math.pow(u, 1.25);
        if (r() > 0.12 + 0.8 * w) continue;
        var si = 0, bd = 1e9; for (var k = 0; k < 3; k++) { var d = Math.abs(px - centers[k]); if (d < bd) { bd = d; si = k; } }
        var col = r() < 0.55 ? pick(r, ACCENT[si]) : pick(r, VIOLETS.slice(3));
        var al = inZone ? 0.22 + 0.4 * w * r() : 0.1 + 0.14 * w;    // behind text below the cascade: very faint
        c.globalAlpha = al; c.fillStyle = col;
        c.beginPath(); c.arc(px + gauss(r) * (1 + 4 * u), L(py + gauss(r) * 2), snap(1.6 + 3.4 * w * (0.5 + r() * 0.7)), 0, 6.2832); c.fill();
        stats.sulciDot = (stats.sulciDot || 0) + 1;
      }
    });
    c.globalAlpha = 1;
    stats.sulciTrails = trails.length;
    document.body.classList.add("sulci-js");
  }

  var raf = 0;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
  draw();
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("load", schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(band);
})();
