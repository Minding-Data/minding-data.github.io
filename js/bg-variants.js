/* Background options (burgundy copy). ?bg=a ring (60 chords), abig big ring (60 chords), a600 / a540 ring radius steps, code=headers colour-coding option, a72 ring (72 chords), b nodes, ab ring + nodes; window.__BGV_DEFAULT sets the default.
   Scratch: background options for the cream section (replacing the neurons). ?bg=a|b|c|d|e
   a chord-arc ring, b network graph, c topographic contours, d flowing trajectories, e correlation-matrix fade.
   Same colour and emboss as the neurons (--sulcus + white offset), same layer opacity. */
(function () {
  if (/[?&]code=headers\b/.test(location.search)) {   // 2026-11-14f option: colour-code by header text + thicker tile outlines; dots all burgundy (js/dot-edge.js)
    document.documentElement.classList.add("code-headers");
    var cs = document.createElement("style");
    cs.textContent = ".code-headers .col--sage{--cc:#6f9c86;--hc:#4a7562}.code-headers .col--mauve{--cc:#2f6fd6;--hc:#2459b0}.code-headers .col--slate{--cc:#7e4bb0;--hc:#7e4bb0}" +
      ".code-headers .areas3 .col-h{color:var(--hc);border-bottom:2.5px solid var(--cc)}" +
      ".code-headers .areas3 .col .tile-media{box-shadow:0 0 0 2.25px var(--cc),0 10px 22px -16px rgba(60,24,26,.35)}" +
      ".code-headers .areas3 .col .tile:hover .tile-media{box-shadow:0 0 0 3px var(--cc),0 22px 36px -18px rgba(60,24,26,.45)}" +
      ".code-headers .areas3 .col .tile-media--edge::after{box-shadow:inset 0 0 0 2.25px var(--cc)}";
    document.head.appendChild(cs);
  }
  var V = (location.search.match(/[?&]bg=(abig|a600|a540|a72|ab|[a-e])/) || [])[1] || window.__BGV_DEFAULT; if (!V) return;
  document.body.classList.add("bgv", "bgv-" + V);
  var st = document.createElement("style");
  st.textContent = ".bgv .sulci-layer{display:none!important}.bgv-layer{position:absolute;left:0;width:100%;z-index:-1;pointer-events:none}@media print{.bgv-layer{display:none}}";
  document.head.appendChild(st);
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var cv = null;
  function hexRgb(h) { var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(h.trim()); if (m) return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]; var n = (h.match(/\d+/g) || [236, 229, 216]).map(Number); return n.slice(0, 3); }
  function mix(a, b, t) { var A = hexRgb(a), B = hexRgb(b); return "rgb(" + [0, 1, 2].map(function (i) { return Math.round(A[i] + (B[i] - A[i]) * t); }).join(",") + ")"; }
  function draw() {
    var band = document.querySelector(".band"), main = document.querySelector(".home-main"); if (!band || !main) return;
    var col = getComputedStyle(document.documentElement).getPropertyValue("--sulcus").trim() || "#ece5d8";
    var bR = band.getBoundingClientRect(), top0 = bR.bottom + scrollY;
    if (!cv) { cv = document.createElement("canvas"); cv.className = "bgv-layer"; cv.setAttribute("aria-hidden", "true"); document.body.insertBefore(cv, document.body.firstChild); }
    cv.style.height = "0px";
    var W = document.documentElement.clientWidth, H = Math.max(10, document.documentElement.scrollHeight - top0), dpr = Math.min(devicePixelRatio || 1, 2);
    cv.style.top = top0 + "px"; cv.style.height = H + "px"; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var mR = main.getBoundingClientRect(), cx = W / 2, mt = mR.top + scrollY - top0, mh = mR.height;
    var r = rng(9 + V.charCodeAt(0));
    function emboss(fn) {   // neuron look: white offset underlay, then the sulcus tone
      c.save(); c.translate(1.6, 1.8); c.globalAlpha = 0.75; c.strokeStyle = c.fillStyle = "#ffffff"; fn(true); c.restore();
      c.save(); c.globalAlpha = 1; c.strokeStyle = c.fillStyle = col; fn(false); c.restore();
    }
    c.lineCap = "round"; c.lineJoin = "round";
    var tm = [].slice.call(document.querySelectorAll(".areas3 .tile-media")).map(function (e) { return e.getBoundingClientRect(); });
    function ring(NC, BIGR) {   // chord-arc ring (connectome style), centred on the tile grid (icons + labels)
      var gx0 = cx, gy0 = mt + mh * 0.5, half = [W * 0.32, 330];
      if (tm.length) { var L = Math.min.apply(null, tm.map(function (q) { return q.left; })), Rr = Math.max.apply(null, tm.map(function (q) { return q.right; })), T = Math.min.apply(null, tm.map(function (q) { return q.top; })) + scrollY - top0, B = Math.max.apply(null, tm.map(function (q) { return q.bottom; })) + scrollY - top0; gx0 = (L + Rr) / 2; gy0 = (T + B) / 2; half = [(Rr - L) / 2, (B - T) / 2]; }
      var ft = document.querySelector(".site-foot"), fTop = ft ? ft.getBoundingClientRect().top + scrollY - top0 : H;
      var R = Math.min(W * 0.42, Math.hypot(half[0], half[1]) * 0.93, fTop - 60 - gy0), oy = gy0, ox = gx0, N = 56, ang = [];
      if (BIGR === true) R = W / 2 - Math.max(30, W * 0.028);
      else if (BIGR) R = BIGR * Math.min(1, W / 1440);   // fixed radius steps (px at 1440 wide)   // abig: sides nearly meet the page edges (outer arcs end ~20px in); top/bottom run under banner and footer
      for (var i = 0; i < N; i++) ang.push(-Math.PI / 2 + i * 2 * Math.PI / N + (r() - 0.5) * 0.04);
      var ch = []; for (var j = 0; j < (NC || 60); j++) { var a = Math.floor(r() * N), span = 4 + Math.floor(Math.pow(r(), 1.7) * (N / 2 - 4)); ch.push([a, (a + span) % N, (1.2 + Math.pow(r(), 2.2) * 5.5) * 1.15]); }
      emboss(function () {
        c.lineWidth = 3.5; c.beginPath(); c.arc(ox, oy, R, 0, 6.2832); c.stroke();
        for (var i = 0; i < N; i++) if (i % 7 === 0) { c.lineWidth = 10; c.beginPath(); c.arc(ox, oy, R + 14, ang[i] + 0.02, ang[Math.min(N - 1, i + 6)] - 0.02); c.stroke(); }
        ch.forEach(function (q) {
          var x1 = ox + R * Math.cos(ang[q[0]]), y1 = oy + R * Math.sin(ang[q[0]]), x2 = ox + R * Math.cos(ang[q[1]]), y2 = oy + R * Math.sin(ang[q[1]]);
          var k = 0.42; c.lineWidth = q[2]; c.beginPath(); c.moveTo(x1, y1); c.bezierCurveTo(ox + (x1 - ox) * k, oy + (y1 - oy) * k, ox + (x2 - ox) * k, oy + (y2 - oy) * k, x2, y2); c.stroke();
        });
        for (var n = 0; n < N; n++) { c.beginPath(); c.arc(ox + R * Math.cos(ang[n]), oy + R * Math.sin(ang[n]), 5, 0, 6.2832); c.fill(); }
      });
      window.__bgvRing = [Math.round(ox), Math.round(oy), Math.round(R)];
      return [ox, oy, R];
    }
    function net(avoid) {   // network graph: soft round nodes (a little darker), curved edges to nearest neighbours
      var P = [], tries = 0, y0 = 60, y1 = H - 60;
      while (P.length < Math.round(W * (y1 - y0) / 52000) && tries++ < 6000) {
        var p = [r() * W, y0 + r() * (y1 - y0)];
        if (avoid && Math.hypot(p[0] - avoid[0], p[1] - avoid[1]) < avoid[2] + 40) continue;   // with the ring: nodes stay outside it
        if (P.every(function (q) { return Math.hypot(p[0] - q[0], p[1] - q[1]) > 130; })) P.push(p);
      }
      P.forEach(function (p) { p.push(4 + Math.pow(r(), 2.5) * 16); });
      var E = [];
      P.forEach(function (p, i) {
        var d = P.map(function (q, j) { return [Math.hypot(p[0] - q[0], p[1] - q[1]), j]; }).sort(function (a, b) { return a[0] - b[0]; });
        for (var k = 1; k <= 2 + (r() < 0.4 ? 1 : 0) && k < d.length; k++) { var j = d[k][1]; if (j > i || r() < 0.3) E.push([i, j]); }
      });
      var eCol = mix(col, "#7d6650", 0.14), nCol = mix(col, "#7d6650", 0.30);
      c.save(); c.translate(1.6, 1.8); c.globalAlpha = 0.75; c.strokeStyle = c.fillStyle = "#ffffff";
      var bends = E.map(function () { return (r() - 0.5) * 0.5; }), widths = E.map(function () { return 1.6 + r() * 2.2; });
      function edges() { E.forEach(function (e, ei) { var a = P[e[0]], b = P[e[1]], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], bend = bends[ei]; c.lineWidth = widths[ei]; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(mx - dy * bend, my + dx * bend, b[0], b[1]); c.stroke(); }); }
      function nodes() { P.forEach(function (p) { c.beginPath(); c.arc(p[0], p[1], p[2], 0, 6.2832); c.fill(); }); }
      edges(); nodes(); c.restore();
      c.save(); c.strokeStyle = eCol; edges(); c.fillStyle = nCol; nodes(); c.restore();
    }
    if (V === "a") ring(60);
    else if (V === "a72") ring(72);
    else if (V === "abig") ring(60, true);
    else if (V === "a600") ring(60, 600);
    else if (V === "a540") ring(60, 540);
    else if (V === "ab") { var rg = ring(60); net(rg); }
    else if (V === "b") { net(null);
    } else if (V === "c") {   // topographic contours of a smooth "activity" field
      var G = []; for (var g = 0; g < 14; g++) G.push([r() * W, 80 + r() * (H - 160), 120 + r() * 260, (r() < 0.75 ? 1 : -0.7) * (0.6 + r())]);
      var S = 12, nx = Math.ceil(W / S) + 1, ny = Math.ceil(H / S) + 1, F = new Float32Array(nx * ny);
      for (var yy = 0; yy < ny; yy++) for (var xx = 0; xx < nx; xx++) { var v = 0, X = xx * S, Yq = yy * S; G.forEach(function (q) { var d2 = ((X - q[0]) * (X - q[0]) + (Yq - q[1]) * (Yq - q[1])) / (q[2] * q[2]); v += q[3] * Math.exp(-d2); }); F[yy * nx + xx] = v; }
      var levels = []; for (var L = -0.6; L <= 1.8; L += 0.2) levels.push(L);
      emboss(function () {
        levels.forEach(function (L, li) {
          c.lineWidth = li % 4 === 0 ? 3.2 : 1.7; c.beginPath();
          for (var yy = 0; yy < ny - 1; yy++) for (var xx = 0; xx < nx - 1; xx++) {
            var a = F[yy * nx + xx], b = F[yy * nx + xx + 1], d = F[(yy + 1) * nx + xx], e = F[(yy + 1) * nx + xx + 1], X = xx * S, Yq = yy * S, pts = [];
            function ed(v1, v2, x1, y1, x2, y2) { if ((v1 < L) !== (v2 < L)) { var t = (L - v1) / (v2 - v1); pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]); } }
            ed(a, b, X, Yq, X + S, Yq); ed(b, e, X + S, Yq, X + S, Yq + S); ed(e, d, X + S, Yq + S, X, Yq + S); ed(d, a, X, Yq + S, X, Yq);
            for (var k = 0; k + 1 < pts.length; k += 2) { c.moveTo(pts[k][0], pts[k][1]); c.lineTo(pts[k + 1][0], pts[k + 1][1]); }
          }
          c.stroke();
        });
      });
    } else if (V === "d") {   // flowing trajectories (HyperTools-like), with sample points along each path
      var T = [];
      for (var t = 0; t < 11; t++) {
        var y = 80 + r() * (H - 200), ph = [r() * 6, r() * 6, r() * 6], am = [40 + r() * 90, 20 + r() * 50, 8 + r() * 20], fq = [0.0022 + r() * 0.002, 0.006 + r() * 0.004, 0.015 + r() * 0.01];
        var pts = []; for (var x = -40; x <= W + 40; x += 8) pts.push([x, y + am[0] * Math.sin(x * fq[0] + ph[0]) + am[1] * Math.sin(x * fq[1] + ph[1]) + am[2] * Math.sin(x * fq[2] + ph[2]) + (x - W / 2) * (r() < 2 ? (t % 2 ? 0.08 : -0.06) : 0)]);
        T.push([pts, 1.4 + r() * 3.2]);
      }
      emboss(function () {
        T.forEach(function (q) {
          c.lineWidth = q[1]; c.beginPath(); q[0].forEach(function (p, i) { if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke();
          for (var i = 6; i < q[0].length; i += 9) { c.beginPath(); c.arc(q[0][i][0], q[0][i][1], q[1] + 2.4, 0, 6.2832); c.fill(); }
        });
      });
    } else if (V === "e") {   // correlation-matrix triangle fading out (nod to the Childhood Adversity figure)
      var n = 26, cell = Math.min(46, (W * 0.92) / n), ox = cx - n * cell / 2, oy2 = 40;
      c.save();
      for (var i = 0; i < n; i++) for (var j = 0; j <= i; j++) {
        var x = ox + j * cell, y = oy2 + i * cell, dist = (i - j) / n, fade = Math.max(0, 1 - Math.pow((i + j) / (2 * n), 1.2) * 0.85);
        var v = Math.max(0, Math.min(1, (1 - dist) * 0.7 + (r() - 0.5) * 0.6)) * fade;
        if (v < 0.08) continue;
        c.globalAlpha = 0.75 * v; c.fillStyle = "#ffffff"; c.fillRect(x + 1.6 + 2, y + 1.8 + 2, cell - 4, cell - 4);
        c.globalAlpha = Math.min(1, 0.35 + v); c.fillStyle = col; c.fillRect(x + 2, y + 2, cell - 4, cell - 4);
      }
      c.restore();
    }
    // soft fade near the dots and the footer so the pattern only sits behind the tiles
    c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.globalCompositeOperation = "destination-in";
    var fg = c.createLinearGradient(0, 0, 0, H); fg.addColorStop(0, "rgba(0,0,0,0)"); fg.addColorStop(Math.min(0.2, (V.charAt(0) === "a" ? 95 : 170) / H), "rgba(0,0,0,1)"); fg.addColorStop(1, "rgba(0,0,0,1)");
    c.fillStyle = fg; c.fillRect(0, 0, W, H); c.restore();
    cv.style.opacity = /^(a|a72|abig|a600|a540|ab|b)$/.test(V) ? ".92" : ".82";
    window.__bgvDone = V;
  }
  function go() { setTimeout(draw, 60); }
  if (document.readyState === "complete") go(); else addEventListener("load", go);
  var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(draw, 150); });
})();
