/* =====================================================================
   Jobility V1: walkthrough (L11, deck 5.6). Frogdog, 2026-10-21; v2 2026-10-22 (redrawn from Kim's portal recordings).
   Job: show the real product in three steps, one tab at a time, at the visitor's pace. It behaves like a player:
   - A tab plays its five beats once (about 10s) when its whole frame is in view, then holds the final frame.
   - It pauses when it leaves the screen and resumes where it was when it comes back; a tab left mid-play resumes
     from the same moment when it is shown again (it never skips to the end).
   - Pause sits beside Replay while a tab is playing (WCAG 2.2.2). Next lives in the caption and never moves the page.
     No auto-advance, no loops. Tab 3 ends on Post a job, with "Watch again" back to tab 1.
   - The five part markers under the frame fill as the beats play (aria-current="step" on the part now playing);
     click one to play from that part.
   - The part now playing is announced (.wt-now) only once the visitor has used a control; autoplay stays quiet.
   - Handoff grammar: nothing ever overprints. A text change is out, then in, inside a clipped box (.wt-x, .wt-status,
     .wt-btnx); a new pane enters only after the old one has left, and the wizard enters over an opaque layer.
     Drawers slide in fully opaque (the wizard, the profile); the interview modal is revealed by a clip, not a fade; a
     list makes room (its rows move down) before a new row fades into the gap; views change out, then in.
   - Phones: a tap dot appears at each target, presses and leaves; no arrow glides across a touch screen.
   - Reduced motion, ?capture=1, no GSAP or any error: the markup's final frames stay, static.
   - Tab selection, arrows, Home/End and Enter are site.js [data-tabs]; this file watches the panels' hidden attribute.
   - Fires walkthrough_tab (dataLayer) on each tab view.
   - v3 (2026-10-22) camera: the app and the cursor sit in one world layer (.fd-wt-world) inside the stage; each beat
     zooms and pans that layer to its region (establishing wide shot, focus, pull back wide at the end of each tab), so
     the action reads at 13px or more on desktop. will-change is set only while the camera moves.
   Every tween is a fromTo with explicit values, so seeking, replaying and rebuilding on
   resize are exact. Cursor targets are measured from layout offsets (transform-free), in stage pixels.
   Hooks: [data-walkthrough], .wt-panel, .fd-wt, .wt-stage, .fd-wt-cursor, .fd-wt-replay, .wt-seg[data-beat], [data-t].
   ===================================================================== */
(function(){
  'use strict';
  var doc = document, box = doc.querySelector('[data-walkthrough]');
  if(!box) return;
  var panels = Array.prototype.slice.call(box.querySelectorAll('.wt-panel'));
  function track(n){ try{ (window.dataLayer = window.dataLayer || []).push({event:'walkthrough_tab', tab:n}); }catch(e){} }

  var gsap = window.gsap;
  var reduced = !window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.classList.contains('fd-calm') || !!(window.FD && FD.reduced && FD.reduced());   /* Whimsy P1 (D2): the site motion switch */
  var live = !!gsap && !reduced && !/[?&]capture=1/.test(location.search) && 'IntersectionObserver' in window;

  var states = panels.map(function(p, i){
    return { p:p, n:i+1, stage:p.querySelector('.wt-stage'), fit:p.querySelector('.wt-fit'),
             now:p.querySelector('.wt-now'), segs:p.querySelectorAll('.wt-seg'), tl:null, played:false, beat:0, w:0,
             labels:(p.querySelector('.fd-wt').getAttribute('data-beats') || '').split('|') };
  });

  (window.FD = window.FD || {}).wt = states;   /* QA hook: FD.wt[i].tl */
  /* tracking works with or without motion */
  states.forEach(function(st){
    new MutationObserver(function(){ if(!st.p.hidden){ track(st.n); if(live) safe(function(){ onShow(st); }); } else if(live) safe(function(){ onHide(st); }); })
      .observe(st.p, {attributes:true, attributeFilter:['hidden']});
  });
  /* ---------- v4 (2026-10-22): the j thread ----------
     The brand's j line (DESIGN.md: "one line that gathers every kind of hire and lands on the right person") is the one
     gesture that runs through the three tabs, drawn the way the home hero draws it: the ribbon gradient (Optimism at the
     line's start, Passion at its end), one weight (.5em, never under 8px), and the dot is the pen (a Purpose dot leads
     the line as it draws and becomes the j's dot where it lands).
     - Tab 1: once Post has sent the wizard away and the new post has taken the top row, the pen appears at the row's end
       and leads the line across the gutter and down into the Edison pin, which drops as it arrives; the line then runs
       into the pin (the job goes out).
     - Tab 2: each match streaks a short line into Edison as it lands (the count climbs as each arrives); then the j is
       written through the match list: from Priya's card (the top match) down a column gutter through every card into the
       curl under the last, and the pen runs back up and lands as the j's dot on Priya's card. Then it all fades back.
     - Tab 3: the pen comes out of Priya's match badge and carries the request down to her interview button, where it
       becomes the button's new state; at Hired it rises from the button into the status; back on the dashboard it leaves
       the Hired tag and leads the line into the Edison pin (the R7/R8 ending).
     Rules: one line per view; it runs only through gutters and the map (never over text; probe w4_jtext.js); it lives in
     the app's own layer, so the camera scales it; lines are built from layout offsets (transform-free) in the app body's
     pixels; phones keep the streaks and the dot (their stacked layout has no clean route for a line).
     Reduced motion, ?capture=1, no GSAP: each tab's final state, still (tab 3: the line in the pin; the other lines have
     gone out or faded back by their tab's end). */
  var J = (function(){
    var NS = 'http://www.w3.org/2000/svg', uid = 0, RIB = [[0, '#FF9241'], [.3, '#FF6634'], [.65, '#FF3B58'], [1, '#D3005B']];
    function f(n){ return (+n).toFixed(1); }
    function mk(tag, a, parent){ var e = doc.createElementNS(NS, tag); for(var k in a) e.setAttribute(k, typeof a[k] === 'number' ? f(a[k]) : a[k]); if(parent) parent.appendChild(e); return e; }
    function off(el, ref){ if(!el || el.offsetParent === null) return null; var x = 0, y = 0, e = el; while(e && e !== ref){ x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return e === ref ? {x:x, y:y, w:el.offsetWidth, h:el.offsetHeight} : null; }
    /* one svg per host (a view, or the app body when it must sit above the wizard), in the body's pixels */
    function svg(host){
      var b = host.classList.contains('wt-body') ? host : host.closest('.wt-body'), s = host.querySelector(':scope>svg.wt-j');
      if(!s){ s = mk('svg', {'class':'wt-j fd-wt-j', 'aria-hidden':'true', focusable:'false'}); host.appendChild(s); }
      while(s.firstChild) s.removeChild(s.firstChild);
      var W = b.offsetWidth, H = b.offsetHeight; s.style.display = W ? '' : 'none';
      if(W){ s.setAttribute('width', W); s.setAttribute('height', H); s.setAttribute('viewBox', '0 0 ' + W + ' ' + H); }
      var em = parseFloat(getComputedStyle(b).fontSize) || 16;
      return {s:s, b:b, em:em, sw:Math.max(8, em * .5), defs:mk('defs', {}, s), box:function(el){ return off(el, b); }};
    }
    /* a ribbon line: the gradient runs from its start to its end; pathLength 1, so the dash offset is the drawn share */
    function line(G, d, w, cls){
      var id = 'wt-jg' + (++uid), p = mk('path', {d:d, 'class':'wt-jl' + (cls ? ' ' + cls : ''), 'stroke-width':w, stroke:'url(#' + id + ')'}, G.s);
      var L = p.getTotalLength(), P = [], n = 96;
      for(var i = 0; i <= n; i++){ var q = p.getPointAtLength(L * i / n); P.push([q.x, q.y]); }
      p.setAttribute('pathLength', '1'); p.setAttribute('stroke-dasharray', '1 2'); p.setAttribute('stroke-dashoffset', '0');
      var g = mk('linearGradient', {id:id, gradientUnits:'userSpaceOnUse', x1:P[0][0], y1:P[0][1], x2:P[n][0] + .01, y2:P[n][1] + .01}, G.defs);
      RIB.forEach(function(r){ mk('stop', {offset:r[0], 'stop-color':r[1]}, g); });
      return {p:p, L:L, w:w, P:P,
        at:function(u){ u = Math.max(0, Math.min(1, u)) * n; var i = Math.min(n - 1, Math.floor(u)), k = u - i; return {x:P[i][0] + (P[i + 1][0] - P[i][0]) * k, y:P[i][1] + (P[i + 1][1] - P[i][1]) * k}; },
        near:function(x, y){ var bi = 0, bd = 1e9; P.forEach(function(q, i){ var d2 = (q[0] - x) * (q[0] - x) + (q[1] - y) * (q[1] - y); if(d2 < bd){ bd = d2; bi = i; } }); return bi / n; }};
    }
    function dot(G, c, r, cls){ return mk('circle', {cx:c.x, cy:c.y, r:r, 'class':cls}, G.s); }
    /* a dashboard row to the Edison pin: across from the row, then one soft descent into the pin's head (the R8 curve) */
    function toPin(G, from, pin, gap){
      var a = G.box(from), q = G.box(pin), m = pin && G.box(pin.closest('.wt-map'));
      if(!a || !q || !m || m.x < a.x + a.w + 4) return null;   /* only where the map sits beside the list */
      var sx = a.x + a.w + gap, sy = a.y + a.h / 2, ex = q.x + q.w / 2, ey = q.y + q.h * .39, dy = ey - sy, R = Math.min(dy * .9, (ex - sx) * .55, 64);
      if(R < 14 || ex - R < sx + 8) return null;
      var kx = ex - R, ln = line(G, 'M' + f(sx) + ' ' + f(sy) + ' L' + f(kx) + ' ' + f(sy) + ' C' + f(kx + R * .62) + ' ' + f(sy) + ' ' + f(ex) + ' ' + f(sy + dy * .3) + ' ' + f(ex) + ' ' + f(ey), G.sw);
      ln.end = {x:ex, y:ey, r:Math.max(3.5, q.w * .2)}; return ln;
    }
    /* a match streaks into Edison: from the dot's edge to the pin's head, a thin stroke; none where it would cross a label or another pin */
    function streak(G, from, pin, avoid){
      var a = G.box(from), q = G.box(pin); if(!a || !q) return null;
      var cx = a.x + a.w / 2, cy = a.y + a.h / 2, ex = q.x + q.w / 2, ey = q.y + q.h * .39, dx = ex - cx, dy = ey - cy, L = Math.sqrt(dx * dx + dy * dy);
      var w = Math.max(3, G.em * .3), s0 = a.w / 2 + 2, s1 = q.w * .5;
      if(L - s0 - s1 < G.em * 1.1) return null;
      var x0 = cx + dx / L * s0, y0 = cy + dy / L * s0, x1 = ex - dx / L * s1, y1 = ey - dy / L * s1, pad = w / 2 + 2;
      for(var i = 0; i < avoid.length; i++){ var r = G.box(avoid[i]); if(!r) continue;
        for(var t = 0; t <= 1; t += .05){ var x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; if(x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad) return null; } }
      return line(G, 'M' + f(x0) + ' ' + f(y0) + ' L' + f(x1) + ' ' + f(y1), w, 'wt-jst');
    }
    /* the match list: a column gutter that runs through every card (desktop), and the dot's place on the first card */
    function cards(G, mv){
      var cs = [].filter.call(mv.querySelectorAll('.wt-card'), function(c){ return c.offsetParent !== null; }); if(!cs.length) return null;
      var c0 = cs[0], b0 = G.box(c0), cw = G.box(c0.querySelector('.wt-cw')), ca = G.box(c0.querySelector('.wt-ca')); if(!b0 || !cw || !ca) return null;
      var desk = cs.length >= 3 && ca.x - (cw.x + cw.w) >= G.sw + 4 && ca.y < cw.y + cw.h;
      var gx = desk ? (cw.x + cw.w + ca.x) / 2 : b0.x + b0.w - 1.5 * G.em;
      return {cs:cs, desk:desk, gx:gx, top:b0.y, dot:{x:gx, y:b0.y}, r:G.sw * .72,
        at:function(sel){ var e = G.box(c0.querySelector(sel)); return e ? {x:gx, y:e.y + e.h / 2} : {x:gx, y:b0.y}; }};
    }
    /* the thread: the j written as the hero writes it. From under the first card's top edge (the dot's place above it),
       down the gutter through every card, into the j's curl under the last card (the hero's curl, scaled 2.4em deep).
       Only where the gutter has room (stroke plus 16px) and the curl fits inside the view. */
    function thread(G, C){
      if(!C || !C.desk) return null;
      var e = G.em, k = 2.4 * e / 136, last = G.box(C.cs[C.cs.length - 1]), yB = last.y + last.h + .2 * e, gx = C.gx, yS = C.top + 1.3 * e;
      var cw = G.box(C.cs[0].querySelector('.wt-cw')), ca = G.box(C.cs[0].querySelector('.wt-ca'));
      if(ca.x - (cw.x + cw.w) < G.sw + 16 || yB + 2.4 * e + G.sw > G.b.offsetHeight - .4 * e) return null;
      function P(x, y){ return f(gx + (x - 276) * k) + ' ' + f(yB + (y - 380) * k); }
      var ln = line(G, 'M' + f(gx) + ' ' + f(yS) + ' L' + P(276, 380) + ' C' + P(276, 466) + ' ' + P(242, 516) + ' ' + P(188, 516) + ' C' + P(136, 516) + ' ' + P(106, 486) + ' ' + P(112, 456), G.sw);
      ln.turn = {x:gx, y:yB}; ln.top = {x:gx, y:C.top};
      return ln;
    }
    /* final frames without motion (reduced motion, ?capture=1, no GSAP, a failed build) */
    function still(st){
      if(st.p.hidden) return;
      var S = st.stage, body = S.querySelector('.wt-body'); if(!body) return;
      if(st.n === 1){ svg(body); return; }
      var mv = S.querySelector('.fd-wt-mv'), dash = S.querySelector('.fd-wt-dash');
      svg(mv); if(st.n === 2){ svg(dash); return; }
      var G = svg(dash), ln = toPin(G, S.querySelector('.fd-wt-hired'), dash.querySelector('.wt-pin--2'), G.sw * .15);
      if(ln) dot(G, ln.end, ln.end.r, 'wt-jeye');
    }
    return {svg:svg, line:line, dot:dot, toPin:toPin, streak:streak, cards:cards, thread:thread, still:still};
  })();
  function stillAll(){ states.forEach(function(st){ try{ J.still(st); }catch(e){} }); }
  if(!live){
    states.forEach(function(st){ new MutationObserver(function(){ if(!st.p.hidden) J.still(st); }).observe(st.p, {attributes:true, attributeFilter:['hidden']}); });
    window.addEventListener('resize', stillAll, {passive:true}); if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(stillAll); stillAll();
  }

  if(!live){ states.forEach(function(st){ st.p.classList.add('is-played'); }); return; }

  function safe(fn){ try{ fn(); }catch(err){ if(window.console) console.warn('[FD] walkthrough off:', err && err.stack || err); bail(); } }
  function bail(){ live = false; box.classList.remove('wt-live');
    states.forEach(function(st){ if(st.tl){ st.tl.kill(); st.tl = null; } clear(st); setNow(st, st.labels.length - 1);
      Array.prototype.forEach.call(st.segs, function(b){ b.disabled = true; }); }); stillAll(); }
  function clear(st){ var els = st.p.querySelectorAll('[style]'); if(els.length) gsap.set(els, {clearProps:'all'}); st.stage.classList.remove('is-zoom'); }

  /* ---------- helpers ---------- */
  var NEUTRAL = {x:0, y:0, xPercent:0, yPercent:0, scale:1, scaleX:1, scaleY:1, rotation:0};
  function to(from, extra){ var o = {}, k; for(k in from){ if(k in NEUTRAL) o[k] = NEUTRAL[k]; } for(k in extra) o[k] = extra[k]; return o; }
  function pt(stage, el, ax, ay){
    if(el && el.fx != null) return {x:stage.offsetWidth * el.fx, y:stage.offsetHeight * el.fy};
    if(el && el.el) return pt(stage, typeof el.el === 'string' ? stage.querySelector(el.el) : el.el, el.ax, el.ay);   /* an offset from an element */
    while(el && el !== stage && el.offsetParent === null) el = el.parentElement;   /* hidden at this width: aim at the nearest shown ancestor */
    var x = 0, y = 0, e = el;
    while(e && e !== stage){ x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return {x:x + el.offsetWidth * (ax == null ? .5 : ax), y:y + el.offsetHeight * (ay == null ? .55 : ay)};
  }
  function kit(st){
    var S = st.stage, tl = gsap.timeline({paused:true, defaults:{duration:.45, ease:'power3.out'},
      onUpdate:function(){ beatUI(st); }, onComplete:function(){ st.p.classList.add('is-played'); }});
    tl.timeScale(0.8);   /* Adam 2026-10-23: play the tour about 25% slower */
    var cur = S.querySelector('.fd-wt-cursor'), rip = cur.querySelector('.wt-ripple'), last = null;
    function $(s){ return typeof s === 'string' ? S.querySelector(s) : s; }
    function $$(s){ return Array.prototype.slice.call(S.querySelectorAll(s)); }
    var K = {
      tl:tl, $:$, $$:$$, phone:st.fit.clientWidth <= 520,
      show:function(el, at, from, d, ease){ from = from || {}; tl.fromTo($(el), Object.assign({autoAlpha:0}, from), to(from, {autoAlpha:1, duration:d || .4, ease:ease || 'power3.out'}), at); },
      hide:function(el, at, toV, d){ toV = toV || {}; var from = {autoAlpha:1}; for(var k in toV){ if(k in NEUTRAL) from[k] = NEUTRAL[k]; }
        tl.fromTo($(el), from, Object.assign({autoAlpha:0, duration:d || .3, ease:'power2.in'}, toV), at); },
      /* out, then in: the old text leaves upward and only then does the new one rise into the same clipped box */
      swap:function(a, b, at, d){ K.hide(a, at, {yPercent:-40}, .14); K.show(b, at + .14, {yPercent:40}, d || .22); },
      roll:function(a, b, at){ K.hide(a, at, {yPercent:-60}, .07); K.show(b, at + .07, {yPercent:60}, .13); },
      cursorIn:function(p, at){ last = p; if(K.phone) return;
        tl.fromTo(cur, {autoAlpha:0, x:function(){ return pt(S, p).x; }, y:function(){ return pt(S, p).y; }, scale:1},
        {autoAlpha:1, x:function(){ return pt(S, p).x; }, y:function(){ return pt(S, p).y; }, scale:1, duration:.3}, at); },
      move:function(target, at, d){ var a = last, b = $(target); last = b; d = d || .7;
        if(K.phone){   /* touch: no glide; the dot is placed (hidden) just before the tap */
          tl.fromTo(cur, {x:function(){ return pt(S, b).x; }, y:function(){ return pt(S, b).y; }},
            {x:function(){ return pt(S, b).x; }, y:function(){ return pt(S, b).y; }, duration:.01}, at + d - .22); return; }
        tl.fromTo(cur, {x:function(){ return pt(S, a).x; }, y:function(){ return pt(S, a).y; }},
          {x:function(){ return pt(S, b).x; }, y:function(){ return pt(S, b).y; }, duration:d, ease:'power2.inOut'}, at); },
      click:function(at, el, rd){
        if(K.phone) tl.fromTo(cur, {autoAlpha:0, scale:1}, {autoAlpha:1, scale:1, duration:.14, ease:'power2.out'}, at - .16);
        tl.fromTo(cur, {scale:1}, {scale:.82, duration:.09, ease:'power2.in'}, at);
        tl.fromTo(cur, {scale:.82}, {scale:1, duration:.2, ease:'power3.out'}, at + .09);
        tl.fromTo(rip, {scale:.3, autoAlpha:.75}, {scale:rd ? .9 : 1.5, autoAlpha:0, duration:rd || .5, ease:'power2.out'}, at);
        if(el){ el = $(el); tl.fromTo(el, {scale:1}, {scale:.95, duration:.09, ease:'power2.in'}, at); tl.fromTo(el, {scale:.95}, {scale:1, duration:.22}, at + .09); }
        if(K.phone) tl.fromTo(cur, {autoAlpha:1}, {autoAlpha:0, duration:.12, ease:'power2.in'}, at + .16);
      },
      set:function(el, v){ tl.fromTo(typeof el === 'string' ? $$(el) : el, Object.assign({}, v), Object.assign({}, v, {duration:.01}), 0); },
      cursorOut:function(at){ if(K.phone) return; tl.fromTo(cur, {autoAlpha:1}, {autoAlpha:0, duration:.4, ease:'power2.in'}, at); },
      type:function(el, at, d){ el = $(el); var n = Math.max(4, Math.min(60, (el.textContent || '').length));   /* one step per character */
        tl.fromTo(el, {clipPath:'inset(0% 100% 0% 0%)'}, {clipPath:'inset(0% 0% 0% 0%)', duration:d || .5, ease:'steps(' + n + ')'}, at); },
      box:function(el, ref){ el = $(el); var p = pt(S, el, 0, 0), o = ref ? pt(S, ref, 0, 0) : {x:0, y:0}; return {x:p.x - o.x, y:p.y - o.y, w:el.offsetWidth, h:el.offsetHeight}; },
      pulse:function(el, at){ el = $(el); tl.fromTo(el, {scale:1}, {scale:1.07, duration:.16, ease:'power2.out'}, at); tl.fromTo(el, {scale:1.07}, {scale:1, duration:.32, ease:'power2.inOut'}, at + .16); },
      stamp:function(scope, at){ var lis = S.querySelectorAll(scope + ' .wt-checked li'), rev = S.querySelector(scope + ' .wt-rev');
        Array.prototype.forEach.call(lis, function(li, i){ K.show(li, at + i * .16, {scale:.6}, .35, 'expo.out'); });
        K.show(rev, at + lis.length * .16 + .1, {y:4}, .35); },
      fill:function(el, at, d, ease){ tl.fromTo($(el), {scaleX:0}, {scaleX:1, duration:d || .35, ease:ease || 'power2.inOut'}, at); },
      beats:function(times, end){
        var fills = st.p.querySelectorAll('.wt-segfill');
        times.forEach(function(t, i){ tl.addLabel('b' + (i+1), t);
          tl.fromTo(fills[i], {scaleX:0}, {scaleX:1, duration:(i < times.length - 1 ? times[i+1] : end) - t, ease:'none'}, t); });
        st.times = times;
      }
    };
    cur.classList.toggle('is-touch', K.phone);
    return K;
  }

  /* ---------- v2 helpers (2026-10-22) ---------- */
  /* the parts of a clipped swap box: .fd-a (start), .fd-m (middle, optional), .fd-b (final) */
  function parts(box){ return {a:box.querySelector(':scope>.fd-a'), m:box.querySelector(':scope>.fd-m'), b:box.querySelector(':scope>.fd-b')}; }
  /* a view change inside the app: the old view leaves, then the new one rises in (never both at once) */
  function go(K, from, to, at){ K.hide(from, at, {}, .16); K.show(to, at + .17, {y:8}, .3); }
  /* the sub-nav underline moves with the view */
  function nav(K, off, on, at){ K.hide(off, at, {}, .14); K.show(on, at + .06, {scaleX:.4}, .26); }

  /* ---------- v4: the j thread on the timeline (geometry: J, above) ----------
     Every step is a fromTo with explicit values, so seeking is exact. jdraw: the line's dash offset and the pen move
     together in short linear steps that follow one ease, so the pen is always the line's tip (the hero's "the dot is the pen"). */
  function jdraw(K, ln, pen, at, d, ease){
    var e = gsap.parseEase(ease || 'power2.inOut'), n = Math.max(6, Math.round(d * 30)), tl = K.tl;
    K.show(ln.p, at, {}, .01);
    for(var i = 0; i < n; i++){ var u0 = e(i / n), u1 = e((i + 1) / n), t = at + d * i / n;
      tl.fromTo(ln.p, {attr:{'stroke-dashoffset':1 - u0}}, {attr:{'stroke-dashoffset':1 - u1}, duration:d / n, ease:'none', immediateRender:false}, t);
      if(pen){ var a = ln.at(u0), b = ln.at(u1); tl.fromTo(pen, {attr:{cx:a.x, cy:a.y}}, {attr:{cx:b.x, cy:b.y}, duration:d / n, ease:'none', immediateRender:false}, t); } }
  }
  /* the tail follows the head into the line's end (the line goes out), then it is gone */
  function jout(K, ln, at, d, ease){ K.tl.fromTo(ln.p, {attr:{'stroke-dashoffset':0}}, {attr:{'stroke-dashoffset':-1}, duration:d, ease:ease || 'power2.in', immediateRender:false}, at); K.hide(ln.p, at + d, {}, .01); }
  /* the time at which a draw reaches share u of its line */
  function jwhen(at, d, ease, u){ var e = gsap.parseEase(ease || 'power2.inOut'); for(var k = 0; k <= 200; k++){ if(e(k / 200) >= u) return at + d * k / 200; } return at + d; }
  /* the pen lifts in an arc from a to b (the hero's lift onto the j's dot) */
  function jhop(K, pen, a, b, at, d, lift){
    var n = Math.max(6, Math.round(d * 30)), e = gsap.parseEase('power2.inOut'), c = {x:(a.x + b.x) / 2, y:Math.min(a.y, b.y) - lift};
    function q(u){ var v = 1 - u; return {x:v * v * a.x + 2 * v * u * c.x + u * u * b.x, y:v * v * a.y + 2 * v * u * c.y + u * u * b.y}; }
    for(var i = 0; i < n; i++){ var p0 = q(e(i / n)), p1 = q(e((i + 1) / n));
      K.tl.fromTo(pen, {attr:{cx:p0.x, cy:p0.y}}, {attr:{cx:p1.x, cy:p1.y}, duration:d / n, ease:'none', immediateRender:false}, at + d * i / n); }
  }
  /* the notification feed steps down one line. Phones show one line at a time, so there the line leaves, the feed moves
     while hidden, and the new line comes in (no row is ever cut through its letters) */
  function nstep(K, nl, y0, y1, t){
    if(!K.phone){ K.tl.fromTo(nl, {y:y0}, {y:y1, duration:.35, ease:'power3.inOut'}, t); return; }
    var box = nl.parentElement; K.hide(box, t, {}, .12); K.tl.fromTo(nl, {y:y0}, {y:y1, duration:.01, immediateRender:false}, t + .12); K.show(box, t + .14, {}, .24);
  }
  function jmove(K, el, a, b, at, d){ K.tl.fromTo(el, {attr:{cx:a.x, cy:a.y}}, {attr:{cx:b.x, cy:b.y}, duration:d || .45, ease:'power2.inOut', immediateRender:false}, at); }
  function jr(K, el, r0, r1, at, d, ease){ K.tl.fromTo(el, {attr:{r:r0}}, {attr:{r:r1}, duration:d, ease:ease || 'expo.out', immediateRender:false}, at); }
  function jpulse(K, el, r, at){ jr(K, el, r, r * 1.45, at, .16, 'power2.out'); jr(K, el, r * 1.45, r, at + .16, .34, 'power2.inOut'); }

  /* ---------- v3 camera (2026-10-22) ----------
     The stage holds one "world" layer (.fd-wt-world: the app and the cursor). The camera is a GSAP x / y / scale on that
     layer (transform-origin 0 0), so the cursor and the tap dot live in world coordinates and follow every move.
     A shot frames a set of elements: the scale is the largest that fits them (plus padding), capped per shot (desktop
     cap s, phone cap ps; pel: the phone's own elements, where its reflowed layout allows a tighter frame), never under 1, and the world always covers the stage (no empty edge). Every tab opens wide
     (the establishing shot), each beat moves to its region (power2.inOut, about .7s), and every tab ends wide, which is
     also the reduced-motion and no-GSAP frame. Shots are measured from layout offsets (transform-free) when the timeline
     is built; a resize rebuilds it. st.camIv lists the moves; the player sets will-change only inside them, so the
     text is re-rasterized crisp at rest (no blurry scaled bitmap on a hold). */
  function camera(K, st){
    var S = st.stage, W = S.querySelector('.fd-wt-world'), tl = K.tl, prev = {x:0, y:0, s:1};
    st.world = W; st.camIv = [];
    /* every line of text in the world, as a box in world coordinates, measured once at build (layout offsets plus the
       text's place inside its element), so a shot can refuse to cut a word at the frame's edge */
    var TX = [], tw = doc.createTreeWalker(W, NodeFilter.SHOW_TEXT), tn;
    while((tn = tw.nextNode())){
      if(!tn.nodeValue.trim()) continue;
      var te = tn.parentElement; if(te.closest('.wt-cursor') || te.offsetParent === null) continue;
      var rg = doc.createRange(); rg.selectNodeContents(tn); var rr = rg.getBoundingClientRect(); if(rr.width < 1) continue;
      var er = te.getBoundingClientRect(), eb = K.box(te);
      TX.push({e:te, x:eb.x + rr.left - er.left, y:eb.y + rr.top - er.top, w:rr.width, h:rr.height});
    }
    function shot(o){
      if(!o || o === 'wide') return {x:0, y:0, s:1};
      var sw = S.offsetWidth, sh = S.offsetHeight, em = parseFloat(getComputedStyle(S).fontSize) || 16;
      var els = [].concat(K.phone && o.pel ? o.pel : o.el).map(function(e){ return K.$(e); }).filter(function(e){ return e && e.offsetParent !== null; });
      if(!els.length) return {x:0, y:0, s:1};
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      els.forEach(function(e){ var b = K.box(e); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); });
      if(o.eb && !K.phone) y1 += o.eb * em;   /* v4: room under the subject (the j's curl under the last card) */
      var px = (o.px == null ? (o.pad == null ? 1 : o.pad) : o.px) * em, py = (o.py == null ? (o.pad == null ? 1 : o.pad) : o.py) * em;
      var cap = K.phone ? (o.ps || Math.min(o.s || 1.5, 1.5)) : (o.s || 1.5);
      var s0 = Math.max(1, Math.min(cap, sw / (x1 - x0 + 2 * px), sh / (y1 - y0 + 2 * py)));
      var cx = x0 + (x1 - x0) * (o.ax == null ? .5 : o.ax), cy = y0 + (y1 - y0) * (o.ay == null ? .5 : o.ay);
      function place(s){ return {s:s, x:Math.min(0, Math.max(sw - sw * s, o.left ? -(x0 - px) * s : sw / 2 - cx * s)), y:Math.min(0, Math.max(sh - sh * s, sh / 2 - cy * s))}; }   /* left: the frame starts on the first column */
      /* the shot's subject (its own elements, or o.keep) is never cut; anything else at the frame's edge is feathered
         by the lens (see .wt-lens). Closed menus are ignored unless the shot is about the menu (o.menu). */
      var keep = o.keep ? [].concat(o.keep).map(function(e){ return K.$(e); }).filter(Boolean) : els;
      var tx = TX.filter(function(t){ return keep.some(function(k){ return k.contains(t.e); }) && (o.menu || !t.e.closest('.fd-wt-menu')) && !t.e.closest('.wt-nlist'); }), m = 1.5;   /* the feed scrolls inside its clipped box */
      var FX = 1.6 * em, FY = 1.1 * em;   /* the lens's feather (see .wt-lens): a kept line must sit wholly inside it or wholly out */
      function cuts(v){ var fx0 = (FX - v.x) / v.s, fy0 = (FY - v.y) / v.s, fx1 = (sw - FX - v.x) / v.s, fy1 = (sh - FY - v.y) / v.s;
        if(v.x > -1) fx0 = -1e9; if(v.y > -1) fy0 = -1e9; if(v.x < sw - sw * v.s + 1) fx1 = 1e9; if(v.y < sh - sh * v.s + 1) fy1 = 1e9;   /* a frame edge on the world's own edge has nothing beyond it to feather */
        return tx.some(function(t){ var inY = t.y < fy1 - m && t.y + t.h > fy0 + m, inX = t.x < fx1 - m && t.x + t.w > fx0 + m;
          return (inY && ((t.x < fx0 - m && t.x + t.w > fx0 + m) || (t.x < fx1 - m && t.x + t.w > fx1 + m)))
              || (inX && ((t.y < fy0 - m && t.y + t.h > fy0 + m) || (t.y < fy1 - m && t.y + t.h > fy1 + m))); }); }
      /* never cut a word: step the scale down until every line of the layer is either wholly in or wholly out */
      if(window.FD && FD.camDebug){ var v0 = place(s0), fx0 = -v0.x / s0, fx1 = fx0 + sw / s0, fy0 = -v0.y / s0, fy1 = fy0 + sh / s0;
        (FD.camLog = FD.camLog || []).push({tab:st.n, s0:+s0.toFixed(2), cut:tx.filter(function(t){ return cuts({x:v0.x, y:v0.y, s:s0}) && ((t.x < fx0 - m && t.x + t.w > fx0 + m) || (t.x < fx1 - m && t.x + t.w > fx1 + m) || (t.y < fy0 - m && t.y + t.h > fy0 + m) || (t.y < fy1 - m && t.y + t.h > fy1 + m)) && t.y < fy1 && t.y + t.h > fy0 && t.x < fx1 && t.x + t.w > fx0; }).slice(0, 6).map(function(t){ return t.e.textContent.trim().slice(0, 18); })}); }
      var sub = {x:0, y:0, s:1}, all = tx;
      for(var s = s0; s > 1.0001; s -= .01){ var v = place(s); if(!cuts(v)){ sub = s < 1.06 ? {x:0, y:0, s:1} : v; break; } }
      /* v4: prefer a frame that cuts no word anywhere on screen (not only the subject's), when it costs at most .16 of scale
         and keeps desktop focus type at 15px or more (scale 1.28 on 12px) */
      var host = els[0].closest('.wt-modal, .wt-drawer, .wt-wiz, .wt-view') || W;   /* the layer the subject lives in (others are hidden or covered) */
      tx = TX.filter(function(t){ return host.contains(t.e) && (o.menu || !t.e.closest('.fd-wt-menu')) && !t.e.closest('.wt-nlist') && t.e.offsetParent !== null; });
      if(sub.s > 1) for(var s2 = sub.s; s2 >= Math.max(1.06, sub.s - .16, K.phone ? 1.06 : 1.28); s2 -= .01){ var v2 = place(s2); if(!cuts(v2)){ tx = all; return v2; } }
      tx = all; return sub;
    }
    var C = {
      set:function(o){ var v = shot(o); prev = v; tl.fromTo(W, {x:v.x, y:v.y, scale:v.s}, {x:v.x, y:v.y, scale:v.s, duration:.01}, 0); },
      to:function(o, at, d, ease){ var v = shot(o), p = prev; prev = v; d = d || .7;
        tl.fromTo(W, {x:p.x, y:p.y, scale:p.s}, {x:v.x, y:v.y, scale:v.s, duration:d, ease:ease || 'power2.inOut', immediateRender:false}, at);
        st.camIv.push([at, at + d]); },
      shot:shot
    };
    return C;
  }

  /* ---------- Tab 1: Post your job (Kim's recording, video 1) ----------
     The real wizard over the dashboard: Basics (template, post title, pricing type, worker type and the terms panel),
     What, Where, When, Terms (cost summary, no price), Review with Post / Save as draft. v3: about 13s. Wide on the
     dashboard, push in on the post title as the wizard opens, pan to pricing and worker type, hold the wizard (fields
     and Next in one shot) for What, Where, When, Terms and Review, then pull back wide as the post takes the top row,
     Active ticks 4 to 5 and the Edison pin drops. */
  function tab1(st){
    var K = kit(st), tl = K.tl, $ = K.$, $$ = K.$$, C = camera(K, st);
    var wiz = $('.fd-wt-wiz'), panes = [1, 2, 3, 4, 5, 6].map(function(i){ return $('.fd-wt-p' + i); }), sons = $$('.wt-son'), sfill = $('.fd-wt-sfill');
    var rings = $$('.wt-scur'), nx = $('[data-t=next]'), po = $('[data-t=post]'), newRow = $('.fd-wt-new'), list = $('.fd-wt-plist');
    var olds = Array.prototype.slice.call(list.children).filter(function(r){ return r !== newRow; });
    /* v4: the j thread (desktop: the map sits beside the list), in the app body's own layer */
    var G1 = J.svg($('.wt-body')), ln1 = K.phone ? null : J.toPin(G1, $('.fd-wt-new .wt-act'), $('.fd-wt-dash .wt-pin--2'), G1.sw * .6);
    var pen1 = ln1 ? J.dot(G1, ln1.at(0), G1.sw * .55, 'wt-jpen') : null;
    K.beats([0, 1.75, 3.85, 5.85, 9.62], ln1 ? 14.7 : 13.07);
    K.set(panes[0], {autoAlpha:1}); K.set(panes.slice(1), {autoAlpha:0});
    K.set(rings[0], {autoAlpha:1}); K.set(rings.slice(1), {autoAlpha:0}); K.set(sons[0], {autoAlpha:1}); K.set(sons.slice(1), {autoAlpha:0}); K.set(sfill, {scaleX:0});
    K.set(['.fd-wt-terms', '.fd-wt-ft', '.fd-wt-rd2', '.fd-wt-cost', '.fd-wt-draft', '.fd-wt-pin', '.fd-wt-wpin', newRow].map($), {autoAlpha:0});
    K.set('.fd-wt-sk', {autoAlpha:0}); K.set('.fd-wt-rd1', {autoAlpha:1});
    K.set(nx, {autoAlpha:1}); K.set(po, {autoAlpha:0});
    K.set($$('.wt-pane .wt-type'), {clipPath:'inset(0% 100% 0% 0%)'});
    var tp = parts($('[data-t=tpl] .wt-x')), tt = parts($('.fd-wt-title').closest('.wt-x')), tin = $('.fd-wt-title').closest('.wt-in'), tfl = tin.closest('.wt-fl');
    K.set(tp.a, {autoAlpha:0}); K.set(tp.b, {autoAlpha:1}); K.set(tt.a, {autoAlpha:0}); K.set(tt.m, {autoAlpha:1}); K.set(tt.b, {autoAlpha:0});
    if(K.phone){   /* phones: the new post's slot opens when it lands (no empty gap in the list before) */
      var nh = newRow.offsetHeight, cs = getComputedStyle(newRow), slot = {height:nh, paddingTop:cs.paddingTop, paddingBottom:cs.paddingBottom, borderBottomWidth:cs.borderBottomWidth};
      var shut = {height:0, paddingTop:0, paddingBottom:0, borderBottomWidth:0};
      K.set(newRow, shut);
    } else {
      var dy = function(){ return -newRow.offsetHeight; };
      tl.fromTo(olds, {y:dy}, {y:dy, duration:.01}, 0);
    }
    var off = {el:nx, ax:1.5, ay:.2};   /* after a click on Next the pointer drifts clear of its label */
    var WIZ = {el:['.wt-steps', '.wt-wfoot'], s:1.5, ps:1.12, px:-1.6, py:.4};   /* the wizard shot: stepper, fields and Next together */
    C.set('wide');
    // 1. + Add post opens the wizard; the camera pushes in on the template and the post title, which is edited to the role
    K.cursorIn({el:'[data-t=add]', ax:-.4, ay:2.6}, .05);
    K.move('[data-t=add]', .12, .45); K.click(.6, '[data-t=add]');
    K.show('.fd-wt-scrim', .66, {}, .3);
    tl.fromTo(wiz, {autoAlpha:1, xPercent:100}, {autoAlpha:1, xPercent:0, duration:.5, ease:'power3.out'}, .7);
    C.to({el:['.fd-wt-p1 [data-t=tpl]', tfl, '.wt-steps .wt-step'], pel:tfl, s:1.75, ps:1.3, px:.15, py:.6, left:K.phone}, .82, .75);
    K.move(tin, 1.1, .35); K.click(1.48, tin);
    K.hide(tt.m, 1.52, {}, .08); K.show(tt.b, 1.6, {}, .01); K.type('.fd-wt-title', 1.6, .36);
    // 2. Pricing type: Placement fee. Worker type: Full time; the terms panel explains the choice and is held to be read
    C.to({el:['.wt-steps', '.fd-wt-p1 .wt-price', '.fd-wt-p1 .wt-wk'], pel:['.fd-wt-p1 .wt-price', '.fd-wt-p1 .wt-wk'], s:1.6, ps:1.25, px:-1.6, py:.5}, 1.75, .7);
    K.move('[data-t=fee]', 1.85, .4); K.click(2.28, '[data-t=fee]');
    K.hide('.fd-wt-rd1', 2.32, {}, .15); K.show('.fd-wt-rd2', 2.32, {scale:.4}, .3, 'expo.out');
    K.move('[data-t=ft]', 2.45, .38); K.click(2.86, '[data-t=ft]');
    K.show('.fd-wt-ft', 2.9, {}, .22); K.show('.fd-wt-terms', 2.95, {y:6}, .35);
    K.move({el:'[data-t=ft]', ax:1.05, ay:.85}, 3.1, .35);   /* the pointer steps into the gap beside Full time while the panel is read */
    // 3-5. The wizard shot. Next walks the six steps: each click fills the line, lights the next circle and swaps the pane
    function next(i, c, back){
      if(back) K.move(nx, c - .38, .3);
      K.click(c, nx);
      if(!K.phone) K.move(off, c + .2, .28);
      tl.fromTo(sfill, {scaleX:(i - 1) / 5}, {scaleX:i / 5, duration:.38, ease:'power2.inOut'}, c + .02);
      K.show(sons[i], c + .26, {scale:.6}, .35, 'expo.out');
      K.hide(rings[i - 1], c + .05, {}, .15); K.show(rings[i], c + .26, {scale:.7}, .35, 'expo.out');
      K.hide(panes[i - 1], c + .04, {x:-14}, .16); K.show(panes[i], c + .2, {x:14}, .3);
    }
    C.to(WIZ, 3.85, .7);
    K.move(nx, 3.95, .45); next(1, 4.45);
    var t2 = $$('.fd-wt-p2 .wt-type');
    K.type(t2[0], 4.72, .32); K.type(t2[1], 5.04, .1); K.type(t2[2], 5.14, .42);
    K.move('[data-t=skill]', 5.14, .36); K.click(5.53, '[data-t=skill]');
    $$('.fd-wt-sk').forEach(function(c, i){ K.show(c, 5.62 + i * .1, {scale:.7}, .3, 'expo.out'); });
    K.move(nx, 5.9, .36); next(2, 6.3);
    K.type('.fd-wt-p3 .wt-type', 6.56, .28);
    K.show('.fd-wt-wpin', 6.78, {y:-14}, .45, 'expo.out');
    next(3, 7.1, true);
    var t4 = $$('.fd-wt-p4 .wt-type'); K.type(t4[0], 7.37, .1); K.type(t4[1], 7.49, .28);
    next(4, 8.4, true);
    K.show('.fd-wt-cost', 8.62, {y:6}, .32);
    var sal = $('.fd-wt-p5 .wt-in'); K.move(sal, 8.9, .3); K.click(9.22, sal); K.type('.fd-wt-p5 .wt-type', 9.26, .32);
    // 5. Review: the summary blocks arrive one by one, a held read, then Post; the camera pulls back as the post lands
    next(5, 10.0, true);
    $$('.fd-wt-p6 .wt-rgrid>div').forEach(function(d, i){ K.show(d, 10.27 + i * .08, {y:8}, .3); });
    K.swap(nx, po, 10.12, .2); K.show('.fd-wt-draft', 10.22, {}, .3);
    K.move(po, 11.32, .3); K.click(11.67, po);
    K.cursorOut(11.77);
    tl.fromTo(wiz, {xPercent:0}, {xPercent:100, duration:.36, ease:'power2.in'}, 11.77);
    K.hide(wiz, 12.13, {}, .01); K.hide('.fd-wt-scrim', 11.87, {}, .3);
    C.to('wide', 11.77, .75);
    if(K.phone) tl.fromTo(newRow, shut, Object.assign({duration:.36, ease:'power3.inOut', immediateRender:false}, slot), 12.1);
    else tl.fromTo(olds, {y:dy}, {y:0, duration:.36, ease:'power3.inOut'}, 12.1);
    K.show(newRow, 12.36, {}, .3);
    K.show(newRow.querySelector('.wt-flash'), 12.38, {}, .2); K.hide(newRow.querySelector('.wt-flash'), 12.66, {}, .4);
    var ta = parts($('.fd-wt-ta .wt-x')); K.swap(ta.a, ta.b, 12.36, .2); K.pulse('.fd-wt-ta', 12.41);
    /* v4: the job goes out. One thing at a time: Post sends the wizard away and the camera pulls back; the new post takes
       the top row; then the pen appears at the row's end, leads the line across the gutter and down into Edison, the pin
       drops as it arrives, and the line runs into the pin */
    var pinAt = 12.44;
    if(ln1){
      var r1 = G1.sw * .55, LD = 12.85, DD = .8, a1 = ln1.at(0);
      K.set(ln1.p, {autoAlpha:0, attr:{'stroke-dashoffset':1}}); K.set(pen1, {autoAlpha:0, attr:{cx:a1.x, cy:a1.y, r:r1}});
      K.show(pen1, LD - .2, {}, .01); jr(K, pen1, 0, r1, LD - .2, .3);
      jdraw(K, ln1, pen1, LD, DD, 'power2.inOut');
      pinAt = LD + DD - .12;
      jr(K, pen1, r1, r1 * .4, LD + DD - .05, .2, 'power2.in'); K.hide(pen1, LD + DD + .1, {}, .05);   /* the pen becomes the pin */
      jout(K, ln1, 14.25, .45, 'power2.in');
    }
    K.show('.fd-wt-pin', pinAt, {y:-14}, .45, 'expo.out');
    tl.fromTo($('.fd-wt-pulse'), {autoAlpha:.85, scale:.3}, {autoAlpha:0, scale:1.5, duration:.45, ease:'power2.out'}, pinAt + .18);
    return tl;
  }

  /* ---------- Tab 2: Review vetted matches (video 1) ----------
     Signature: the post is live; its match count climbs 0, 9, 17 while candidates land on the map around Edison and
     the notifications fill. Then the match list, Priya's profile drawer (Overview, then Skills & credentials), and Priya
     moves to Short listed. v3 camera: wide; push in on the count and the map; a slow drift closer as the second wave
     lands; the match list; the profile; Priya's status; pull back wide on the short list. About 12.4s. */
  function tab2(st){
    var K = kit(st), tl = K.tl, $ = K.$, $$ = K.$$, C = camera(K, st);
    var dash = $('.fd-wt-dash'), mv = $('.fd-wt-mv'), prof = $('.fd-wt-prof'), dots = $$('.fd-wt-cd');
    var nl = $('.fd-wt-nlist'), nn = $$('.fd-wt-nlist .wt-nn'), L = function(){ return nn[0].offsetHeight; };
    /* v4: the j thread. Map: each match streaks into Edison as it lands. List: the thread runs up the cards' gutter to
       Priya (the top match) and the pen lands as the j's dot on her card; then the mark fades back */
    var G2d = J.svg(dash), G2m = J.svg(mv), C2 = J.cards(G2m, mv), th = J.thread(G2m, C2), pin2 = $('.fd-wt-dash .wt-pin--2');
    var avoid = $$('.fd-wt-dash .wt-ml').concat($$('.fd-wt-dash .wt-pin--1, .fd-wt-dash .wt-pin--3'));
    var streaks = dots.map(function(d){ return J.streak(G2d, d, pin2, avoid); });
    var pen2 = th ? J.dot(G2m, th.at(0), G2m.sw * .55, 'wt-jpen') : null;
    var S = 1.6;   /* v4: the thread's beat; everything after it moves later by S */
    K.beats([0, 2.1, 3.8, 5.9 + S, 9.2 + S], 12.4 + S);
    K.set(dash, {autoAlpha:1}); K.set(mv, {autoAlpha:0}); K.set(prof, {autoAlpha:0});
    K.set('.fd-wt-ul-dash', {autoAlpha:1}); K.set('.fd-wt-ul-gigs', {autoAlpha:0});
    K.set(nn, {autoAlpha:0}); K.set(['.fd-wt-ptsel', '.fd-wt-slring'].map($), {autoAlpha:0}); K.set('.fd-wt-ov', {autoAlpha:1}); K.set('.fd-wt-dt1', {autoAlpha:1}); K.set('.fd-wt-sk2', {autoAlpha:0}); K.set('.fd-wt-dt2', {autoAlpha:0});
    tl.fromTo(nl, {y:function(){ return -3 * L(); }}, {y:function(){ return -3 * L(); }, duration:.01}, 0);
    C.set('wide');
    // 1. live: the camera pushes in on the post's count and the map; the pin rings, the first nine arrive
    var pill = $('[data-t=view]'), row = pill.closest('.wt-prow'), edison = $('.fd-wt-dash .wt-pin--2');
    C.to({el:['.fd-wt-dash .wt-posts', '.fd-wt-dash .wt-map'], keep:['.fd-wt-dash .wt-posts', '.fd-wt-dash .wt-map'], s:1.45, ps:1.3, px:.45, py:.6, left:true}, .3, .8);
    K.show(row.querySelector('.wt-flash'), .2, {}, .2); K.hide(row.querySelector('.wt-flash'), .55, {}, .5);
    tl.fromTo($('.fd-wt-pulse'), {autoAlpha:.85, scale:.3}, {autoAlpha:0, scale:1.5, duration:.9, ease:'power2.out'}, .35);
    dots.forEach(function(d, i){ K.show(d, i < 9 ? .95 + i * .08 : 2.3 + (i - 9) * .08, {scale:.2}, .4, 'expo.out'); });
    /* the count rolls with the pins: one masked swap from "Finding matches" at the third pin, then the number counts up
       in step with each pin landing (the same number in the pill and in the callout) */
    /* callouts are wiped in and out by a clip (never faded), so they cover what is under them and never overprint it */
    function wipe(el, a, b){ el = $(el);
      tl.fromTo(el, {autoAlpha:1, clipPath:'inset(0% 100% 0% 0%)'}, {autoAlpha:1, clipPath:'inset(0% 0% 0% 0%)', duration:.45, ease:'power3.inOut'}, a);
      tl.fromTo(el, {clipPath:'inset(0% 0% 0% 0%)'}, {clipPath:'inset(0% 0% 100% 0%)', duration:.2, ease:'power2.in', immediateRender:false}, b);   /* out: closes upward in .2s, whole lines at a time */
      K.hide(el, b + .21, {}, .01); }
    var cx = parts($('[data-t=view] .wt-x')), nums = [$('.fd-wt-n'), $('.fd-wt-cn')];
    K.set(nums, {textContent:3});
    K.swap(cx.a, cx.b, 1.3, .22);
    /* v4: each match streaks into Edison as it lands; the count ticks as its line arrives */
    dots.forEach(function(d, i){ var t = i < 9 ? .95 + i * .08 : 2.3 + (i - 9) * .08, ln = streaks[i];
      if(ln){ K.set(ln.p, {autoAlpha:0, attr:{'stroke-dashoffset':1}}); jdraw(K, ln, null, t + .1, .3, 'power2.in'); jout(K, ln, t + .42, .26, 'power2.out'); }
      if(i >= 3) tl.fromTo(nums, {textContent:i}, {textContent:i + 1, duration:.01, snap:{textContent:1}, immediateRender:false}, t + .4); });
    K.pulse('[data-t=view]', 1.72);
    var rx = parts($('.fd-wt-tr .wt-x')); K.swap(rx.a, rx.b, 1.7); K.pulse('.fd-wt-tr', 1.75);
    /* notifications: the list steps down one line and the new line fades in at the top (nothing overprints) */
    [1.75, 2.6, 3.2].forEach(function(t, k){
      nstep(K, nl, function(){ return -(3 - k) * L(); }, function(){ return -(2 - k) * L(); }, t);
      K.show(nn[2 - k], t + .14, {y:-4}, .34);
    });
    // 2. the next eight; 9 becomes 17. The camera drifts closer, the count and Edison in one frame
    C.to({el:['.fd-wt-dash .wt-posts', edison, '.fd-wt-dash .wt-ml--ed'], pel:[pill, edison, '.fd-wt-dash .wt-ml--ed'], s:1.62, ps:1.3, px:.45, py:3.2, ay:.62, left:true}, 2.1, 1.5, 'power1.inOut');
    K.pulse('[data-t=view]', 3.0);
    /* the type moment: the count, large, on the map's corner (an opaque callout outside the camera) */
    var ny = '.fd-wt-dash .wt-ml--ny'; if(!K.phone){ K.hide(ny, 2.05, {}, .15); K.show(ny, 3.75, {}, .25); }   /* the callout sits where the New York label was */
    if(!K.phone) wipe('.fd-wt-call1', 2.2, 3.5);   /* phones: the pill carries the count (the callout would cover the tiles) */
    // 3. View 17 matches: the match list
    K.cursorIn({el:pill, ax:.7, ay:2.6}, 3.8);
    K.move(pill, 3.9, .55); K.click(4.5, pill);
    nav(K, '.fd-wt-ul-dash', '.fd-wt-ul-gigs', 4.55);
    go(K, dash, mv, 4.55);
    var cs = C2 ? C2.cs : $$('.wt-card');
    C.to({el:['.fd-wt-mv .wt-count', cs[0].querySelector('.wt-cc')].concat(cs.map(function(c){ return c.querySelector('.wt-ca'); })), pel:['.fd-wt-mv .wt-count', '.wt-card--ps .wt-cw', '.wt-card--ps .wt-ca'], s:1.42, ps:1.3, px:1.2, py:.9, eb:th ? 2.9 : 0, left:true}, 4.55, .75);   /* px 1.2: the frame starts on the world's left edge (no feather across the count) */
    K.cursorOut(4.62);   /* the pointer leaves while the cards arrive (no parking on a card); it returns for Priya's name */
    $$('.wt-card').forEach(function(c, i){ K.show(c, 4.95 + i * .12, {y:10}, .35); });
    $$('.wt-mb').forEach(function(b, i){ K.show(b, 5.2 + i * .12, {scale:.6}, .3, 'expo.out'); });
    /* the j, written as the hero writes it: down from Priya's card (the top match) through every card into the curl under
       the last; the pen runs back up the stem and lands as the j's dot on her card, her badge answers; then the whole mark
       fades back. Phones (no gutter through the cards): the streaks only */
    if(th){
      var TA = 5.6, TD = 1.0, pr = G2m.sw * .55, a2 = th.at(0), T2 = TA + TD + .04;
      K.set(th.p, {autoAlpha:0, attr:{'stroke-dashoffset':1}}); K.set(pen2, {autoAlpha:0, attr:{cx:a2.x, cy:a2.y, r:pr}});
      K.show(pen2, TA - .15, {}, .01); jr(K, pen2, 0, pr, TA - .15, .25);
      jdraw(K, th, pen2, TA, TD, 'power2.inOut');
      jmove(K, pen2, th.at(1), th.turn, T2, .2); jmove(K, pen2, th.turn, th.top, T2 + .2, .34);
      jr(K, pen2, pr, C2.r, T2 + .54, .35);   /* the pen lands as the j's dot */
      K.pulse(cs[0].querySelector('.wt-mb'), T2 + .58);
      K.hide([th.p, pen2], T2 + .95, {}, .5);   /* read, then the mark fades back */
    }
    // 4. Priya's profile: Overview, then Skills & credentials
    K.cursorIn({el:'[data-t=name2]', ax:1.7, ay:2.2}, 5.75 + S); K.move('[data-t=name2]', 5.9 + S, .5); K.click(6.42 + S, '[data-t=name2]');
    K.show('.fd-wt-scrim2', 6.47 + S, {}, .3);
    if(K.phone) tl.fromTo(prof, {autoAlpha:1, clipPath:'inset(100% 0% 0% 0%)'}, {autoAlpha:1, clipPath:'inset(0% 0% 0% 0%)', duration:.5, ease:'power3.out'}, 6.47 + S);
    else tl.fromTo(prof, {autoAlpha:1, xPercent:100}, {autoAlpha:1, xPercent:0, duration:.5, ease:'power3.out'}, 6.47 + S);
    C.to({el:['.fd-wt-prof [data-t=dback]', '.fd-wt-prof .wt-facts', '.fd-wt-prof .wt-dtabs', '.fd-wt-sk2 .wt-skl'], s:1.55, ps:1.25, px:1, py:.8}, 6.5 + S, .75);
    K.cursorOut(6.5 + S); K.cursorIn({el:'[data-t=skills]', ax:.4, ay:3}, 7.05 + S);   /* the pointer leaves with the list and returns inside the drawer */
    K.move('[data-t=skills]', 7.17 + S, .42); K.click(7.62 + S, '[data-t=skills]'); K.cursorOut(7.85 + S);   /* off while the skills are read; back for Back */
    K.hide('.fd-wt-dt1', 7.67 + S, {}, .12); K.show('.fd-wt-dt2', 7.71 + S, {scaleX:.4}, .25);
    K.hide('.fd-wt-ov', 7.67 + S, {}, .15); K.show('.fd-wt-sk2', 7.84 + S, {}, .01);
    $$('.fd-wt-skl').forEach(function(r, i){ K.show(r, 7.87 + S + i * .1, {y:6}, .3); });   /* every match is reviewed by a person: said once, as an annotation */
    // 5. Back, then Priya to Short listed; the pipeline counts move; the camera pulls back on the short list
    K.cursorIn({el:'[data-t=dback]', ax:2.2, ay:1.6}, 9.1 + S); K.move('[data-t=dback]', 9.2 + S, .42); K.click(9.65 + S, '[data-t=dback]');
    if(K.phone) tl.fromTo(prof, {clipPath:'inset(0% 0% 0% 0%)'}, {clipPath:'inset(100% 0% 0% 0%)', duration:.35, ease:'power2.in'}, 9.7 + S);
    else tl.fromTo(prof, {xPercent:0}, {xPercent:100, duration:.35, ease:'power2.in'}, 9.7 + S);
    K.hide(prof, 10.07 + S, {}, .01); K.hide('.fd-wt-scrim2', 9.8 + S, {}, .25);
    var menu = $('[data-t=st2] .fd-wt-menu');
    C.to({el:['.wt-card--ps .wt-mb', '.wt-card--ps .wt-av', '.wt-card--ps .wt-cw', '[data-t=st2]', menu], menu:true, s:1.7, ps:1.4, pad:1}, 9.75 + S, .75);
    K.move('[data-t=st2]', 9.74 + S, .55); K.click(10.5 + S, '[data-t=st2]');
    K.show(menu, 10.55 + S, {}, .01); K.move('[data-t=o-sl]', 10.6 + S, .3); K.click(10.95 + S);
    K.move({el:'[data-t=st2]', ax:1.12, ay:-.5}, 11.0 + S, .22); K.cursorOut(11.05 + S);   /* the pointer leaves with the menu (never over the next card) */
    K.hide(menu, 11.2 + S, {}, .01);   /* the option's ripple ends inside the menu */
    var sx = parts($('[data-t=st2] .wt-x')); K.swap(sx.a, sx.b, 11.22 + S);
    C.to('wide', 11.15 + S, .8);
    var pn = parts($$('.wt-ptab .wt-x')[0]), ps = parts($('.fd-wt-pt-sl .wt-x'));
    K.roll(pn.a, pn.b, 11.3 + S); K.roll(ps.a, ps.b, 11.3 + S); K.pulse('.fd-wt-pt-sl', 11.36 + S);
    /* the payoff: the short list is selected, Priya's card is ringed and the others step back */
    var others = $$('.wt-card').filter(function(c){ return !c.classList.contains('wt-card--ps'); });
    K.show('.fd-wt-ptsel', 11.5 + S, {}, .3); K.show('.fd-wt-slring', 11.6 + S, {}, .35);
    tl.fromTo(others, {opacity:1}, {opacity:.45, duration:.45, ease:'power2.out', immediateRender:false}, 11.6 + S);
    K.pulse('.wt-card--ps .wt-mb', 11.8 + S);
    return tl;
  }

  /* ---------- Tab 3: Interview and hire (video 2) ----------
     The real Schedule interview modal (date, time, a backup date and time, duration, title, message, optional meeting
     link) -> Interviewing, "Pending interview confirmation" -> the dashboard's Requested ticks 2 to 3 -> Priya confirms
     -> Interviewed, Hired, Accept / Close position -> back on the dashboard Priya's row reads hired, Active 5 to 4,
     Workers hired 12 to 13, and the j line leaves her row for the Edison pin, which rings (R7/R8 ending, kept).
     v3 camera: the modal; Priya's card and the pipeline; the interviews and notifications; her status; Close position;
     wide for the ending. About 14.4s. */
  function tab3(st){
    var K = kit(st), tl = K.tl, $ = K.$, $$ = K.$$, C = camera(K, st);
    var dash = $('.fd-wt-dash'), mv = $('.fd-wt-mv'), modal = $('.fd-wt-modal');
    var nl = $('.fd-wt-nlist'), hire = nl.children[0], first = nl.children[1], second = nl.children[2], L = function(){ return first.offsetHeight; };
    /* v4: the dot that landed on Priya in tab 2 is her marker here: beside her interview button once requested, beside
       Hired once hired; back on the dashboard the pen leaves the Hired tag and leads the line into the Edison pin */
    var G3m = J.svg(mv), C3 = J.cards(G3m, mv), pen3m = C3 && C3.desk ? J.dot(G3m, C3.dot, G3m.sw * .55, 'wt-jpen') : null;
    var G3 = J.svg(dash), ln3 = J.toPin(G3, $('.fd-wt-hired'), $('.fd-wt-dash .wt-pin--2'), G3.sw * .15);
    var pen3 = ln3 ? J.dot(G3, ln3.at(0), G3.sw * .55, 'wt-jpen') : null, eye3 = ln3 ? J.dot(G3, ln3.end, ln3.end.r, 'wt-jeye') : null;
    K.beats([0, 3.2, 5.0, 7.3, 11.0], 14.5);
    K.set(mv, {autoAlpha:1, y:0}); K.set(dash, {autoAlpha:0, y:0}); K.set(modal, {autoAlpha:0});   /* y:0: a later re-entry must not leave the first view 8px low */
    K.set('.fd-wt-ul-gigs', {autoAlpha:1}); K.set('.fd-wt-ul-dash', {autoAlpha:0});
    K.set($$('.fd-wt-ty3'), {clipPath:'inset(0% 100% 0% 0%)'}); K.set([hire, first, second], {autoAlpha:0});
    tl.fromTo(nl, {y:function(){ return -3 * L(); }}, {y:function(){ return -3 * L(); }, duration:.01}, 0);
    K.set('.fd-wt-force .wt-mapbg', {opacity:1});
    C.set('wide');
    if(pen3m) K.set(pen3m, {autoAlpha:0, attr:{cx:C3.dot.x, cy:C3.dot.y, r:0}});
    var CARD = ['.wt-card--ps .wt-mb', '.wt-card--ps .wt-av', '.wt-card--ps .wt-cw', '[data-t=st2]', '[data-t=sch2]'], menu = $('[data-t=st2] .fd-wt-menu');
    // 1. Schedule interview: the modal, date and time, a backup
    K.cursorIn({el:'[data-t=sch2]', ax:.6, ay:2.4}, .1);
    K.move('[data-t=sch2]', .2, .55); K.click(.78, '[data-t=sch2]');
    K.show('.fd-wt-scrim3', .83, {}, .25);
    tl.fromTo(modal, {autoAlpha:1, y:-6, clipPath:'inset(0% 0% 100% 0%)'}, {autoAlpha:1, y:0, clipPath:'inset(0% 0% 0% 0%)', duration:.42, ease:'power3.out'}, .93);
    C.to({el:modal, s:1.5, ps:1.08, px:.8, py:.5, ay:.48}, .9, .75);
    var ty = $$('.fd-wt-ty3');
    K.move('[data-t=date]', 1.25, .4); K.click(1.68, '[data-t=date]');
    K.type(ty[0], 1.72, .35); K.type(ty[1], 2.02, .25); K.type(ty[2], 2.28, .35); K.type(ty[3], 2.58, .25);
    K.move('[data-t=schedule]', 2.75, .42);
    // 2. Schedule: Interviewing, pending the candidate's confirmation
    K.click(3.2, '[data-t=schedule]');
    tl.fromTo(modal, {clipPath:'inset(0% 0% 0% 0%)'}, {clipPath:'inset(0% 0% 100% 0%)', duration:.3, ease:'power2.in'}, 3.3);
    K.hide(modal, 3.62, {}, .01); K.hide('.fd-wt-scrim3', 3.4, {}, .3);
    C.to({el:CARD.concat(['.wt-card--ps .wt-av', '.fd-wt-pt-iv', '[data-t=nav-dash]']), pel:CARD.concat(['.wt-card--ps .wt-av', '.fd-wt-pt-iv']), s:1.55, ps:1.35, px:.7, py:1, left:true}, 3.35, .75);
    K.move({el:'[data-t=sch2]', ax:.5, ay:2.2}, 3.45, .4);
    var sx = parts($('[data-t=st2] .wt-x')), bx = parts($('[data-t=sch2]'));
    K.swap(sx.a, sx.m, 3.75); K.swap(bx.a, bx.m, pen3m ? 4.17 : 3.81, .22);
    var sl = parts($('.fd-wt-pt-sl .wt-x')), iv = parts($('.fd-wt-pt-iv .wt-x')), hi = parts($('.fd-wt-pt-hi .wt-x'));
    K.roll(sl.a, sl.b, 3.95); K.roll(iv.a, iv.m, 3.95); K.pulse('.fd-wt-pt-iv', 4.01);
    /* v4: the pen comes out of Priya's match badge, runs along her card's top edge and down the gutter, and goes into her
       interview button, which turns to "Pending interview confirmation" as it arrives (desktop; phones have no gutter) */
    var pr3m = G3m.sw * .55, inB = function(sel){ var q = C3.at(sel), c = G3m.box($('.wt-card--ps .wt-ca')); return {x:c.x + .3 * G3m.em, y:q.y}; };
    if(pen3m){ var mb = G3m.box($('.wt-card--ps .wt-mb')), A3 = {x:mb.x + mb.w + pr3m + 4, y:C3.top};
      K.show(pen3m, 3.55, {}, .01); jr(K, pen3m, 0, pr3m, 3.55, .2); jmove(K, pen3m, A3, C3.dot, 3.6, .25); jmove(K, pen3m, C3.dot, C3.at('[data-t=sch2]'), 3.85, .3);
      jmove(K, pen3m, C3.at('[data-t=sch2]'), inB('[data-t=sch2]'), 4.15, .16); jr(K, pen3m, pr3m, 0, 4.15, .18, 'power2.in'); }
    // 3. Dashboard: the camera opens up for the nav, then holds Interviews and Notifications; Requested 2 to 3
    K.move('[data-t=nav-dash]', 4.95, .5); K.click(5.5, '[data-t=nav-dash]');
    nav(K, '.fd-wt-ul-gigs', '.fd-wt-ul-dash', 5.55); go(K, mv, dash, 5.55);
    C.to({el:['.fd-wt-dash .wt-iv', '.fd-wt-dash .wt-notes'], s:1.6, ps:1.3, px:.8, py:.8}, 5.75, .75);
    K.cursorOut(5.62);   /* the pointer leaves while the counts and the feed move; it comes back for View 17 matches */
    var rq = parts($('.fd-wt-ivr .wt-x')); K.swap(rq.a, rq.m, 6.2); K.pulse('.fd-wt-ivr', 6.25);
    nstep(K, nl, function(){ return -3 * L(); }, function(){ return -2 * L(); }, 6.3); K.show(second, 6.44, {y:-4}, .34);
    // 4. Priya confirms: Requested 3 to 2, Scheduled 1 to 2. Then on her card: Interviewed, Hired, Close position
    nstep(K, nl, function(){ return -2 * L(); }, function(){ return -L(); }, 7.4); K.show(first, 7.54, {y:-4}, .34);
    var ag = parts(second.querySelector('.wt-x')), cf = parts(first.querySelector('.wt-x')); K.swap(ag.a, ag.m, 7.68);
    var sc = parts($('.fd-wt-ivs .wt-x'));
    K.swap(rq.m, rq.b, 7.68); K.swap(sc.a, sc.m, 7.68); K.pulse('.fd-wt-ivs', 7.74);
    var bm2 = $('[data-t=sch2]>.fd-m2'); K.set(bm2, {autoAlpha:0}); K.swap(bx.m, bm2, 7.68);   /* her card (not on screen) now reads the confirmed time */
    /* v4 (fewer camera moves): her confirmation in the feed opens the match list, so the camera never goes wide here.
       The feed is shifted up one line, so its top line sits in the first slot's layout box */
    var hit = {el:hire, ax:.3, ay:.55};
    K.cursorIn({el:hire, ax:.5, ay:2.2}, 8.3); K.move(hit, 8.4, .45); K.click(8.9, first, .1); K.cursorOut(8.96);
    nav(K, '.fd-wt-ul-dash', '.fd-wt-ul-gigs', 8.95); go(K, dash, mv, 8.95);
    C.to({el:CARD.concat([menu]), menu:true, s:1.7, ps:1.4, pad:1}, 9.0, .7);
    K.cursorIn({el:'[data-t=st2]', ax:1.15, ay:.5}, 9.38); K.move('[data-t=st2]', 9.42, .2); K.click(9.65, '[data-t=st2]');
    K.show(menu, 9.7, {}, .01); K.move('[data-t=o-hired]', 9.75, .3); K.click(10.08);
    K.move({el:'[data-t=st2]', ax:1.12, ay:-.5}, 10.13, .22); K.hide(menu, 10.25, {}, .01);   /* the pointer leaves with the menu; the ripple ends inside it */
    K.swap(bm2, bx.b, 10.3, .22); K.swap(sx.m, sx.b, pen3m ? 10.72 : 10.3);   /* the interview has happened: Interviewed, then Hired */
    /* v4: the pen rises out of the interview button, up the gutter and into her status, which turns to Hired as it arrives */
    if(pen3m){ var B3 = inB('[data-t=sch2]'), H3 = inB('[data-t=st2]');
      K.tl.fromTo(pen3m, {autoAlpha:1, attr:{cx:B3.x, cy:B3.y}}, {autoAlpha:1, attr:{cx:B3.x, cy:B3.y}, duration:.01, immediateRender:false}, 10.3); jr(K, pen3m, 0, pr3m, 10.3, .18);
      jmove(K, pen3m, B3, C3.at('[data-t=sch2]'), 10.32, .14); jmove(K, pen3m, C3.at('[data-t=sch2]'), C3.at('[data-t=st2]'), 10.46, .24);
      jmove(K, pen3m, C3.at('[data-t=st2]'), H3, 10.7, .16); jr(K, pen3m, pr3m, 0, 10.7, .18, 'power2.in'); K.hide(pen3m, 10.9, {}, .01); }
    C.to({el:['[data-t=close]', '.fd-wt-pt-hi', '.wt-card--ps .wt-cw', '.wt-card--ps .wt-ca'], s:1.45, ps:1.3, px:1.1, py:.9}, 10.35, .7);
    K.roll(iv.m, iv.b, 10.75); K.roll(hi.a, hi.b, 10.75); K.pulse('.fd-wt-pt-hi', 10.81);
    var cl = parts($('[data-t=close]'));
    K.move('[data-t=close]', 10.45, .55); K.click(11.05, '[data-t=close]'); K.swap(cl.a, cl.b, 11.1, .22);
    // 5. Wide on the dashboard: the hire in her row, the counts move, the line runs to Edison
    C.to('wide', 11.4, .75);
    K.move('[data-t=nav-dash]', 11.45, .55); K.click(12.05, '[data-t=nav-dash]'); K.cursorOut(12.2);
    nav(K, '.fd-wt-ul-gigs', '.fd-wt-ul-dash', 12.1); go(K, mv, dash, 12.1);
    var hr = $('.fd-wt-hi'), mx = parts(hr.querySelector('.wt-pm .wt-x')), lx = parts(hr.querySelector('.wt-xl'));
    K.swap(mx.a, mx.b, 12.6, .22); K.swap(lx.a, lx.b, 12.6, .22);
    K.show(hr.querySelector('.wt-flash'), 12.62, {}, .2); K.hide(hr.querySelector('.wt-flash'), 13.0, {}, .55);
    K.pulse('.fd-wt-rowav', 12.8);
    var ta = parts($('.fd-wt-ta .wt-x')), th = parts($('.fd-wt-th .wt-x'));
    var tq = parts($('.fd-wt-tr .wt-x'));
    K.swap(ta.a, ta.b, 12.7); K.swap(tq.a, tq.b, 12.7); K.swap(sc.m, sc.b, 12.7); K.pulse('.fd-wt-ivs', 12.76); K.swap(th.a, th.b, 12.7); K.pulse('.fd-wt-ta', 12.76); K.pulse('.fd-wt-tr', 12.76); K.pulse('.fd-wt-th', 12.76);
    /* the feed catches up with the story: "You hired Priya S." is the newest line; the interview lines age */
    nstep(K, nl, function(){ return -L(); }, 0, 12.72); K.show(hire, 12.86, {y:-4}, .34);
    K.swap(cf.a, cf.b, 12.9); K.swap(ag.m, ag.b, 12.9);
    var T = 13.1, lineOn = !!ln3;
    tl.fromTo('.fd-wt-force .wt-mapbg', {opacity:1}, {opacity:.42, duration:.5, ease:'power2.out', immediateRender:false}, T - .3);   /* the streets step back so the line reads as placement */
    if(lineOn){   /* the pen leaves the Hired tag and leads the line into the pin's head, where it becomes the pin's white eye */
      var pr3 = G3.sw * .55, LD3 = .8;
      K.set(ln3.p, {autoAlpha:0, attr:{'stroke-dashoffset':1}}); K.set(pen3, {autoAlpha:0, attr:{cx:ln3.at(0).x, cy:ln3.at(0).y, r:pr3}}); K.set(eye3, {autoAlpha:0});
      K.show(pen3, T - .15, {}, .01); jr(K, pen3, pr3 * .3, pr3, T - .15, .25);
      jdraw(K, ln3, pen3, T, LD3, 'power2.inOut');
      K.hide(pen3, T + LD3, {}, .08); K.show(eye3, T + LD3, {}, .01); jr(K, eye3, ln3.end.r * .3, ln3.end.r, T + LD3, .3);
    }
    tl.fromTo($('.fd-wt-pulse'), {autoAlpha:.85, scale:.3}, {autoAlpha:0, scale:1.5, duration:.6, ease:'power2.out'}, lineOn ? T + LD3 : T);
    if(!lineOn) K.show('.fd-wt-ring', T + .45, {scale:.4}, .55, 'expo.out');   /* phones: the map sits under the list, so the hire ends on a still ring around Edison */
    return tl;
  }
  var BUILD = [tab1, tab2, tab3];

  /* ---------- playback: a small player ----------
     st.mode: 'idle' (not started) | 'playing' | 'parked' (off screen or tab hidden, mid-play) | 'paused' (Pause pressed) | 'done' */
  function setNow(st, i){
    if(!st.now) return;
    Array.prototype.forEach.call(st.segs, function(b, k){ if(k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    if(st.beat === i + 1) return; st.beat = i + 1;
    st.now.querySelector('.wt-of').textContent = (i + 1) + ' of ' + st.labels.length;
    st.now.querySelector('.wt-lab').textContent = st.labels[i] || '';
  }
  function beatUI(st){ var t = st.tl.time(), i = 0; (st.times || []).forEach(function(x, k){ if(t >= x - .001) i = k; }); setNow(st, i);
    /* v3 camera: will-change only while the camera moves, so text is re-rasterized crisp on every hold */
    if(st.world){ var mv = (st.camIv || []).some(function(r){ return t > r[0] - .04 && t < r[1] + .02; });
      if(mv !== st.wc){ st.wc = mv; st.world.style.willChange = mv ? 'transform' : ''; }
      var z = gsap.getProperty(st.world, 'scale') > 1.01; if(z !== st.wz){ st.wz = z; st.stage.classList.toggle('is-zoom', z); } } }   /* the lens feathers the frame's edges only while zoomed */
  function ui(st){
    var running = st.mode === 'playing' || st.mode === 'parked' || st.mode === 'paused';
    st.p.classList.toggle('is-running', running);
    st.p.classList.toggle('is-paused', st.mode === 'paused');
    if(st.pz) st.pz.querySelector('.wt-pt').textContent = st.mode === 'paused' ? 'Play' : 'Pause';
  }
  function build(st){
    if(st.tl){ st.tl.kill(); st.tl = null; }
    clear(st); st.w = st.fit.clientWidth; st.wc = null; st.wz = null; st.stage.classList.remove('is-zoom');
    st.tl = BUILD[st.n - 1](st);
    st.tl.eventCallback('onComplete', function(){ st.mode = 'done'; st.p.classList.add('is-played'); ui(st); });
  }
  function reset(st){ st.tl.pause(); st.tl.progress(1, true).progress(0, true); beatUI(st); }
  function start(st, from){ build(st); st.mode = 'playing'; st.p.classList.remove('is-played'); reset(st); st.tl.play(from || 0); ui(st); }
  function hold(st){ if(st.tl){ st.tl.progress(1, true).pause(); beatUI(st); } st.mode = 'done'; st.p.classList.add('is-played'); ui(st); }
  function park(st){ if(st.mode === 'playing'){ st.tl.pause(); st.mode = 'parked'; ui(st); } }
  function unpark(st){ if(st.mode === 'parked' && st.tl){ st.tl.play(); st.mode = 'playing'; ui(st); } }
  /* a visitor used a control: from now on the part now playing is announced */
  function speak(st){ if(st.now) st.now.setAttribute('aria-live', 'polite'); }

  /* in view: 'full' = the whole frame is on screen (or it fills the screen), 'half' = at least half of it shows */
  var view = 'out', picked = false;   /* picked: the visitor chose this tab (tab, arrow key, Next), so half in view is enough */
  window.FD.wtView = function(){ return view; };   /* QA hook */
  function current(){ return states.filter(function(x){ return !x.p.hidden; })[0]; }
  function onView(st){
    if(!st) return;
    if(view === 'out') park(st);
    else if(st.mode === 'parked') unpark(st);
    else if(st.mode === 'idle' && view === 'full') start(st);
  }
  function onShow(st){
    if(st.mode === 'playing') return;                 /* a control already started it (Watch again, a part marker) */
    if(!st.tl){ build(st); if(st.mode === 'idle') reset(st); else if(st.at != null){ st.tl.time(st.at, true); beatUI(st); } }
    if(st.mode === 'done') hold(st);
    else if(st.mode === 'parked'){ if(picked === 2 && view !== 'full') frame(st); else if(view !== 'out') unpark(st); }
    else if(st.mode === 'idle'){
      if(view === 'full') start(st);
      else if(picked === 2 && view !== 'out'){ reset(st); frame(st); }   /* a tab pick: bring the frame into view; measure() starts it once whole */
      else if(picked && view === 'half') start(st);   /* Next never moves the page: it plays half in view */
      else reset(st);
    }
    picked = false; ui(st);
  }
  /* a picked tab that is partly off screen: scroll the frame and its controls into view (user-initiated) */
  function frame(st){
    var fig = st.p.querySelector('.fd-wt'), foot = st.p.querySelector('.wt-ctrl'), r = fig.getBoundingClientRect(), b = foot ? foot.getBoundingClientRect().bottom : r.bottom;
    var hd = st.p.querySelector('.tour-cap h3'), hr = hd && hd.getBoundingClientRect(); if(hr && hr.height && hr.bottom <= r.top + 2 && b - hr.top < innerHeight - 80) r = {top:hr.top, bottom:r.bottom};
    var n = doc.querySelector('.site-nav'), top = n && getComputedStyle(n).position !== 'static' ? n.offsetHeight : 0, dy = 0;
    if(r.top < top) dy = r.top - top - 12; else if(b > innerHeight) dy = Math.min(b - innerHeight + 12, r.top - top - 12);
    if(dy) window.scrollBy({top:dy, behavior:reduced ? 'auto' : 'smooth'});
  }
  function onHide(st){ if(!st.tl) return; if(st.mode === 'done') hold(st); else { park(st); st.at = st.tl.time(); } }

  safe(function(){
    box.classList.add('wt-live');
    states.forEach(function(st){
      st.mode = 'idle'; st.pz = st.p.querySelector('.fd-wt-pause');
      if(st.now) st.now.setAttribute('aria-live', 'off');
      Array.prototype.forEach.call(st.segs, function(b){
        b.disabled = false;
        b.addEventListener('click', function(){ safe(function(){ speak(st); start(st, 'b' + b.getAttribute('data-beat')); }); });
      });
      var r = st.p.querySelector('.fd-wt-replay');
      if(r) r.addEventListener('click', function(){ safe(function(){ speak(st); start(st, 0); }); });
      if(st.pz) st.pz.addEventListener('click', function(){ safe(function(){
        speak(st);
        if(st.mode === 'paused'){ st.tl.play(); st.mode = 'playing'; }
        else if(st.mode === 'playing' || st.mode === 'parked'){ st.tl.pause(); st.mode = 'paused'; }
        ui(st);
      }); });
      Array.prototype.forEach.call(st.p.querySelectorAll('[data-tab-next]'), function(b){
        b.addEventListener('click', function(){ states.forEach(speak); });
      });
      ui(st);
    });
    Array.prototype.forEach.call(box.querySelectorAll('[role=tab]'), function(t){
      t.addEventListener('click', function(){ picked = 2; }, true);   /* 2: a tab pick may scroll the frame into view; Next (true) never does */
      t.addEventListener('keydown', function(){ picked = 2; }, true);
    });
    Array.prototype.forEach.call(box.querySelectorAll('[data-tab-next]'), function(b){ b.addEventListener('click', function(){ picked = true; }, true); });
    /* "Watch again" on tab 3: back to tab 1 (site.js switches the tab) and play it from the start */
    Array.prototype.forEach.call(box.querySelectorAll('.tour-again'), function(b){
      b.addEventListener('click', function(){ safe(function(){ start(states[0], 0); }); });
    });
    var cur = current();
    if(cur){ build(cur); reset(cur); }
    var head = function(){ var n = doc.querySelector('.site-nav'); return n && getComputedStyle(n).position !== 'static' ? n.offsetHeight : 0; };
    function measure(){
      var st = current(); if(!st) return;
      var fig = st.p.querySelector('.fd-wt'), r = fig.getBoundingClientRect(), top = head(), vh = innerHeight - top;
      var foot = st.p.querySelector('.wt-ctrl'), bot = foot ? Math.max(r.bottom, foot.getBoundingClientRect().bottom) : r.bottom;   /* the controls are part of the frame */
      var shown = Math.max(0, Math.min(innerHeight, r.bottom) - Math.max(top, r.top));
      var segTop = foot ? foot.getBoundingClientRect().top + 24 : bot;   /* the part markers row: the frame and its markers on screen count as in view */
      var v = (r.top >= top - 2 && bot <= innerHeight - 8) || shown >= vh * .92 ? 'full' : shown >= r.height * .5 ? 'half' : 'out';   /* R9: Pause must be on screen when it starts */
      if(v !== view){ view = v; safe(function(){ onView(st); }); }
    }
    var io = new IntersectionObserver(measure, {threshold:[0, .1, .25, .5, .6, .75, .85, .9, .95, 1]});
    states.forEach(function(st){ io.observe(st.p.querySelector('.fd-wt')); });
    var mt = 0; window.addEventListener('scroll', function(){ if(!mt) mt = requestAnimationFrame(function(){ mt = 0; measure(); }); }, {passive:true});
    states.forEach(function(st){ new MutationObserver(function(){ if(!st.p.hidden) setTimeout(measure, 0); }).observe(st.p, {attributes:true, attributeFilter:['hidden']}); });
    /* resize: rebuild the visible tab at the same moment; hidden tabs go back to the markup until shown (keeping their time) */
    var rt = 0;
    var ro = new ResizeObserver(function(){ clearTimeout(rt); rt = setTimeout(function(){ safe(function(){
      states.forEach(function(st){
        if(!st.tl || st.fit.clientWidth === st.w) return;
        var t = st.tl.time();
        if(st.p.hidden){ st.tl.kill(); st.tl = null; clear(st); if(st.mode !== 'done' && st.mode !== 'idle') st.at = t; return; }
        build(st); reset(st); st.tl.time(t, true); beatUI(st);
        if(st.mode === 'done') hold(st); else if(st.mode === 'playing') st.tl.play();
      });
      measure();
    }); }, 140); });
    states.forEach(function(st){ ro.observe(st.fit); });
  });
})();
