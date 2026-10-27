/* =====================================================================
   Whimsy P2 (2026-10-23): copy pages. Loaded with defer after site.js, only on the 11 Package 2 pages
   (pricing, compare-staffing-agency, lp-hire-without-agency-fees, how-it-works, faq, for-workers, about-us,
   privacy-policy, hirer-terms, gigee-terms, accessibility). No GSAP: Web Animations API, CSS transitions and
   SVG pathLength="1" dash offsets. Each module runs inside FD.safe; if one fails the finished markup stays.

   Consumes from Package 1 when present: FD.reduced (also true for the site switch and ?capture=1), FD.setMotion,
   FD.drawLine. Carries a small fallback for each so these pages work on their own.

   Modules
   loop ....... pricing: the pen circles $0 in the lead tile (load + 0.3s; 0.65s draw, 0.25s dot)
   honest ..... pricing #calculator, compare #fee-math: "Good rate. You negotiated well." when the agency quote is under 15%
   gap ........ compare + LP1 hero: bars fill (0.6s land, 0.08s stagger), the pen lands on the self-service bar's end,
                the bracket draws, "$5,400 less". On load if the card is in the first view, else once it is half in view
   tline ...... how it works #when-you-pay: a node-sized Purpose dot walks the rail once, lighting each node; the
                "Then you pay." node stays hollow until it lands, then fills Purpose
   kinds ...... for workers: from a Purpose dot level with the heading (the profile), one ribbon line down the three
                kinds of work, a bead per row, the j's curl and dot
   edison ..... about #facts: the brand guide's location icon drops once on Edison and its ring draws
   tocdot ..... legal pages: a dot on the contents rail beside the section being read
   motion ..... accessibility: the "Motion on this site" switch (role=switch) for the whole site
   ===================================================================== */
(function(){
  'use strict';
  var FD = window.FD = window.FD || {}, doc = document, root = doc.documentElement;
  var $ = FD.$ || function(s,c){ return (c||doc).querySelector(s); };
  var $$ = FD.$$ || function(s,c){ return [].slice.call((c||doc).querySelectorAll(s)); };
  var safe = FD.safe || function(n,f){ try{ f(); }catch(e){ if(window.console) console.warn('[FD] '+n+' off:', e); } };
  var NS = 'http://www.w3.org/2000/svg';
  var E = { io:'cubic-bezier(.455,.03,.515,.955)', out:'cubic-bezier(.215,.61,.355,1)', land:'cubic-bezier(.19,1,.22,1)', inn:'cubic-bezier(.55,.085,.68,.53)' };

  /* ---- the shared setting (fallback for P1's contract: localStorage fd-motion, html.fd-calm) ---- */
  function stored(){ try{ return localStorage.getItem('fd-motion'); }catch(e){ return null; } }
  var osq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:true};
  function calm(){
    if(root.classList.contains('capture') || root.classList.contains('fd-calm') || stored() === 'off' || osq.matches) return true;
    return FD.reduced ? !!FD.reduced() : false;
  }
  if(stored() === 'off') root.classList.add('fd-calm');
  var setMotion = FD.setMotion || function(on){
    try{ localStorage.setItem('fd-motion', on ? 'on' : 'off'); }catch(e){}
    root.classList.toggle('fd-calm', !on);
  };
  var canAnim = !!(doc.body && doc.body.animate);

  /* drawLine(path, {dur, delay, ease}) -> Promise. P1's when present; else WAAPI on stroke-dashoffset. Instant when calm. */
  function drawLine(path, o){
    o = o || {};
    if(FD.drawLine){ try{ var p = FD.drawLine(path, o); if(p && p.then) return p; }catch(e){} }
    path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1 2';
    if(calm() || !canAnim){ path.style.strokeDashoffset = '0'; return Promise.resolve(); }
    path.style.strokeDashoffset = '1.05';
    var a = path.animate([{strokeDashoffset:1.05},{strokeDashoffset:0}], {duration:o.dur || 900, delay:o.delay || 0, easing:o.ease || E.io, fill:'forwards'});
    return new Promise(function(res){ a.onfinish = function(){ path.style.strokeDashoffset = '0'; res(); }; a.oncancel = res; });
  }
  function anim(el, kf, o){
    if(calm() || !canAnim || !el.animate) return null;
    return el.animate(kf, o);
  }
  function svgEl(tag, attrs, parent){ var e = doc.createElementNS(NS, tag); for(var k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; }
  var gid = 0;
  function ribbon(svg, x1, y1, x2, y2){
    var id = 'fd-p2-rb' + (++gid), defs = svgEl('defs', {}, svg);
    var g = svgEl('linearGradient', {id:id, gradientUnits:'userSpaceOnUse', x1:x1, y1:y1, x2:x2, y2:y2}, defs);
    svgEl('stop', {offset:'0', 'stop-color':'#FF9241'}, g); svgEl('stop', {offset:'.3', 'stop-color':'#FF6634'}, g);
    svgEl('stop', {offset:'.65', 'stop-color':'#FF3B58'}, g); svgEl('stop', {offset:'1', 'stop-color':'#D3005B'}, g);
    return 'url(#'+id+')';
  }
  /* run once web fonts have settled (measurements depend on them), or after 800ms at most */
  function whenFonts(fn){ var done = false; function go(){ if(done) return; done = true; fn(); } if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(go, go); setTimeout(go, 800); if(!doc.fonts) go(); }
  /* smooth path through points (Catmull-Rom to cubic Bezier) */
  function smooth(pts){
    var d = 'M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
    for(var i = 0; i < pts.length-1; i++){
      var p0 = pts[i-1] || pts[i], p1 = pts[i], p2 = pts[i+1], p3 = pts[i+2] || p2;
      d += ' C'+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+' '+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+' '+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+' '+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1);
    }
    return d;
  }
  /* The loop recipe (plan 5, shared with P1): a hand-drawn ellipse round a box padded 10px x 8px, starting lower left,
     (the ellipse is sized to clear the box's corners, not only its sides), overshooting its start by about 20% of the way round, exiting up and right into a short tail that ends on the dot. */
  function loopGeom(x, y, w, h, o){
    /* review: 0.1em on the right (clear of "to"); 3px more on the left and 7px up and down, so it clears the $ */
    var em = o && o.em || 16, rx = w/2 + .1*em + 3, ry = h/2 + 7, cx = x + w/2 - 3, cy = y + h/2, pts = [], n = 48;
    var t0 = Math.PI*0.78, t1 = t0 + Math.PI*2*1.2;
    for(var i = 0; i <= n; i++){
      var k = i/n, t = t0 + (t1-t0)*k, grow = 1 + 0.07*k, tilt = -0.05;
      var px = rx*grow*Math.cos(t), py = ry*grow*Math.sin(t);
      pts.push([cx + px*Math.cos(tilt) - py*Math.sin(tilt), cy + px*Math.sin(tilt) + py*Math.cos(tilt)]);
    }
    var last = pts[pts.length-1], prev = pts[pts.length-2];
    var dx = last[0]-prev[0], dy = last[1]-prev[1], L = Math.sqrt(dx*dx+dy*dy) || 1;
    var tail = [last[0] + dx/L*6 + 6, last[1] + dy/L*6 - 6];
    var end = [tail[0] + 10, tail[1] - 6];
    pts.push(tail); pts.push(end);
    return { d:smooth(pts), end:end, box:[cx-rx*1.1, cy-ry*1.1, cx+rx*1.1, cy+ry*1.1] };
  }

  /* ---- loop: pricing, the pen circles $0 ---- */
  safe('loop', function(){
    var t = $('.tile--lead .fd-loop-t'); if(!t) return;
    var host = t.closest('.tile'), svg = null, played = false;
    function build(animate){
      if(svg) svg.remove();
      var hr = host.getBoundingClientRect(), r = t.getBoundingClientRect();
      var phone = window.innerWidth < 600, x = r.left - hr.left, y = r.top - hr.top;
      var gh = r.height, gy = y;
      var g = loopGeom(x, gy, r.width, gh, {em:parseFloat(getComputedStyle(t).fontSize) || 40});
      svg = svgEl('svg', {'class':'fd-loop', 'aria-hidden':'true', focusable:'false', width:hr.width, height:hr.height, viewBox:'0 0 '+hr.width+' '+hr.height});
      var p = svgEl('path', {d:g.d, 'stroke-width':'3', stroke:ribbon(svg, g.box[0], 0, g.box[2], 0)}, svg);
      var dot = svgEl('circle', {cx:g.end[0].toFixed(1), cy:g.end[1].toFixed(1), r:phone ? 3 : 4, fill:'var(--purpose)'}, svg);
      host.appendChild(svg);
      if(!animate || calm()){ drawLineNow(p); return; }
      dot.style.opacity = '0';
      drawLine(p, {dur:650, delay:300, ease:E.io}).then(function(){
        dot.style.opacity = '';
        anim(dot, [{opacity:0, transform:'scale(.4)'},{opacity:1, transform:'scale(1)'}], {duration:250, easing:E.land});
      });
    }
    function drawLineNow(p){ p.setAttribute('pathLength','1'); p.style.strokeDasharray = '1 2'; p.style.strokeDashoffset = '0'; }
    var rw = window.innerWidth;
    whenFonts(function(){ build(true); played = true; });
    window.addEventListener('resize', function(){ if(!played || window.innerWidth === rw) return; rw = window.innerWidth; build(false); });
  });

  /* ---- honest: when the visitor's own agency quote is below 15%, say so, kindly, on the managed row ---- */
  safe('honest', function(){
    $$('#calculator [data-calc], #fee-math [data-calc]').forEach(function(box){
      var dm = $('[data-out="dm"]', box), ar = $('[data-out="arate"]', box); if(!dm) return;
      var p = doc.createElement('p'); p.className = 'fd-honest'; p.hidden = true; p.setAttribute('aria-live', 'polite');
      dm.parentNode.insertBefore(p, dm.nextSibling);
      function check(){
        var more = /more than this agency fee/.test(dm.textContent), rate = ar ? ar.textContent.trim() : '';
        var txt = more ? 'Good rate. You negotiated well.' : '';   /* review: the line above already gives the figures */
        if(txt === p.textContent && !p.hidden === !!txt) return;
        p.textContent = txt; p.hidden = !txt;
        p.classList.remove('is-in');
        if(txt && !calm()){ void p.offsetWidth; p.classList.add('is-in'); }
      }
      if(window.MutationObserver) new MutationObserver(check).observe(dm, {childList:true, characterData:true, subtree:true});
      check();
    });
  });

  /* ---- gap: compare + LP1, the hero bars measure the gap. Plays on load when the card's top is in the first 70% of the
     view; otherwise (phones: compare's card starts below the fold) the card holds its start state and plays once half
     in view. The pen lands centred on the self-service bar's end, then the bracket draws back to the agency bar's end. ---- */
  safe('gap', function(){
    var card = $('.fd-feebars'); if(!card){ root.classList.remove('fd-p2-pre'); return; }
    var gap = $('.fd-gap', card), dot = gap && $('.fd-gap-dot', gap), bars = $$('.bar', card);
    /* the dot sits on the end of the last (self-service) bar, at the bar's vertical centre */
    function seat(){
      if(!dot || !bars.length) return;
      var tr = $('.track', bars[bars.length-1]), gr = gap.getBoundingClientRect(); if(!tr) return;
      var r = tr.getBoundingClientRect(), f = $('.fill', tr), s = f ? (+(getComputedStyle(f).getPropertyValue('--s').trim()) || 1) : 1;
      var dx = r.left + r.width * s - gr.left, dy = r.top + r.height / 2 - gr.top, line = $('.fd-gap-line', gap);
      dot.style.left = (dx - 5).toFixed(1) + 'px'; dot.style.top = (dy - 5).toFixed(1) + 'px';
      /* the bracket starts at the dot: its upright rises from the bracket's foot to the bar's end */
      if(line){ line.style.left = dx.toFixed(1) + 'px'; line.style.top = dy.toFixed(1) + 'px'; line.style.height = Math.max(9, 9 - dy).toFixed(1) + 'px'; }
    }
    seat(); window.addEventListener('resize', seat); whenFonts(seat);
    var pre = root.classList.contains('fd-p2-pre');
    if(!pre || calm() || !canAnim){ root.classList.remove('fd-p2-pre'); return; }
    function play(){
      card.classList.remove('fd-gap-pre');
      var fills = $$('.bar .fill', card), D0 = 150, d = 0;   /* whole sequence ends by about 1.36s */
      fills.forEach(function(f, i){
        var s = getComputedStyle(f).getPropertyValue('--s').trim() || '1';
        s = Math.max(+s || 1, .012);
        f.animate([{transform:'scaleX(0)'},{transform:'scaleX('+s+')'}], {duration:600, delay:D0 + i*80, easing:E.land, fill:'backwards'});
      });
      d = D0 + (fills.length-1)*80 + 600;
      if(gap){
        var line = $('.fd-gap-line', gap), tick = $('.fd-gap-tick', gap), n = $('.fd-gap-n', gap);
        if(dot) dot.animate([{opacity:0, transform:'translateY(-8px) scale(.6)'},{opacity:1, transform:'none'}], {duration:300, delay:d-200, easing:E.land, fill:'backwards'});
        if(line) line.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}], {duration:450, delay:d, easing:E.io, fill:'backwards'});
        if(tick) tick.animate([{opacity:0},{opacity:1}], {duration:200, delay:d+250, easing:E.out, fill:'backwards'});
        if(n) n.animate([{opacity:0},{opacity:1}], {duration:200, delay:d+250, easing:E.out, fill:'backwards'});
      }
    }
    var top = card.getBoundingClientRect().top;
    if(top < window.innerHeight * .7 || !FD.onceInView){ play(); root.classList.remove('fd-p2-pre'); return; }
    card.classList.add('fd-gap-pre'); root.classList.remove('fd-p2-pre');
    FD.onceInView(card, play, .5);
  });

  /* ---- tline: how it works, the pen walks the steps ---- */
  safe('tline', function(){
    var ol = $('#when-you-pay .fd-tline'); if(!ol) return;
    var lis = $$(':scope > li', ol), key = $('.is-key', ol) || lis[lis.length-1]; if(lis.length < 2) return;
    var pen = doc.createElement('span'); pen.className = 'fd-tline-pen'; pen.setAttribute('aria-hidden', 'true'); ol.appendChild(pen);
    function cy(li){ return li.offsetTop + 15; }   /* the pen is node-sized (18px), centred on each node */   /* node centre: li::after top 6px + 9px */
    function place(){ pen.style.transform = 'translateY('+(cy(key) - 9)+'px)'; }
    function finish(){ lis.forEach(function(li){ li.classList.add('is-lit'); }); key.classList.add('is-landed'); place(); }
    if(calm() || !canAnim){ finish(); return; }
    ol.classList.add('is-walk');   /* the key node stays hollow until the pen lands on it */
        function ease(k){ return k < .5 ? 2*k*k : 1 - Math.pow(-2*k+2, 2)/2; }   /* power2.inOut, for when the dot passes a node */
    function when(frac){ var lo = 0, hi = 1; for(var i = 0; i < 24; i++){ var m = (lo+hi)/2; if(ease(m) < frac) lo = m; else hi = m; } return lo; }
    function play(){
      var y0 = cy(lis[0]), y1 = cy(key), T = 900;
      pen.classList.add('is-on');
      pen.animate([{opacity:0},{opacity:1}], {duration:200, easing:E.out});
      var mv = pen.animate([{transform:'translateY('+(y0-9)+'px)'},{transform:'translateY('+(y1-9)+'px)'}], {duration:T, delay:120, easing:E.io, fill:'both'});
      lis.forEach(function(li){
        var f = (cy(li) - y0) / ((y1 - y0) || 1);
        setTimeout(function(){ li.classList.add('is-lit'); }, 120 + when(Math.min(1, Math.max(0, f)))*T);
      });
      mv.onfinish = function(){ place(); mv.cancel(); key.classList.add('is-landed'); pen.classList.remove('is-on'); ol.classList.remove('is-walk'); };   /* the node fills Purpose (0.25s land) as the pen becomes it */
    }
    /* one auto-playing moment per view: wait while the walkthrough player is on screen */
    function wtOnScreen(){ var w = $('#walkthrough .tour-panels') || $('#walkthrough'); if(!w) return false; var r = w.getBoundingClientRect(); return r.bottom > 80 && r.top < window.innerHeight - 80; }
    FD.onceInView ? FD.onceInView(ol, function go(){
      if(!wtOnScreen()) return play();
      function sc(){ if(!wtOnScreen()){ window.removeEventListener('scroll', sc); play(); } }
      window.addEventListener('scroll', sc, {passive:true});
    }, .35) : finish();
  });

  /* ---- kinds: for workers, one profile, three kinds of work ---- */
  safe('kinds', function(){
    var ul = $('.fd-kinds'); if(!ul) return;
    var rows = $$(':scope > li', ul); if(!rows.length) return;
    var svg = null, played = false;
    function build(){
      if(svg) svg.remove();
      var ur = ul.getBoundingClientRect(), phone = window.innerWidth < 600, x = 14, wgt = phone ? 7 : 6;
      var ys = rows.map(function(li){ var h = $('h3', li) || li, r = h.getBoundingClientRect(); return r.top - ur.top + Math.min(r.height, 34)/2; });
      var last = rows[rows.length-1].getBoundingClientRect(), yEnd = last.bottom - ur.top + 6;
      /* the profile: a 10px Purpose dot level with the heading when it sits beside the rows; above the rows when stacked */
      var hd = $('#kinds-h'), hr = hd ? hd.getBoundingClientRect() : null, y0, x0 = x;
      /* side by side: the dot sits in the gap between the heading's column and the rows, level with the heading's first line,
         and the line turns from it into the gutter, so it visibly comes from the heading */
      if(hr && hr.right <= ur.left + 4){ y0 = (hr.top + Math.min(hr.height, 48) / 2) - ur.top; x0 = Math.max(-60, (hr.right - ur.left) / 2 + 4); }
      else { var lead = hd && hd.parentNode.lastElementChild, lr = lead ? lead.getBoundingClientRect() : null; y0 = lr ? Math.min(ys[0] - 30, (lr.bottom + ur.top) / 2 - ur.top) : ys[0] - 30; }
      var top = Math.min(0, Math.floor(y0 - 8));
      svg = svgEl('svg', {'class':'fd-kinds-line', 'aria-hidden':'true', focusable:'false', width:ur.width, height:Math.ceil(yEnd + 30 - top), viewBox:'0 '+top+' '+ur.width+' '+Math.ceil(yEnd + 30 - top)});
      svg.style.top = top + 'px';
      var d = (x0 < x - 1 ? 'M'+x0.toFixed(1)+' '+y0.toFixed(1)+' C'+(x - 8).toFixed(1)+' '+y0.toFixed(1)+' '+x+' '+(y0 + 4).toFixed(1)+' '+x+' '+Math.min(ys[0], y0 + 24).toFixed(1)+' L'+x+' '+yEnd.toFixed(1) : 'M'+x+' '+y0.toFixed(1)+' L'+x+' '+yEnd.toFixed(1))+' C'+x+' '+(yEnd+16).toFixed(1)+' '+(x-14)+' '+(yEnd+18).toFixed(1)+' '+(x-14)+' '+(yEnd+4).toFixed(1);
      var p = svgEl('path', {d:d, 'stroke-width':wgt, stroke:ribbon(svg, 0, y0, 0, yEnd+18)}, svg);
      svgEl('circle', {'class':'fd-kinds-dot fd-kinds-src', cx:x0.toFixed(1), cy:y0.toFixed(1), r:5}, svg);
      var beads = ys.map(function(y){ return svgEl('circle', {'class':'fd-kinds-bead', cx:x, cy:y.toFixed(1), r:7}, svg); });
      var dot = svgEl('circle', {'class':'fd-kinds-dot', cx:x-14, cy:(yEnd-6).toFixed(1), r:phone ? 5 : 6}, svg);
      ul.appendChild(svg);
      return {p:p, beads:beads, dot:dot, ys:ys, yEnd:yEnd, y0:y0};
    }
    function still(){ var g = build(); g.p.setAttribute('pathLength','1'); g.p.style.strokeDasharray = '1 2'; g.p.style.strokeDashoffset = '0'; }
    var rw = window.innerWidth;
    window.addEventListener('resize', function(){ if(window.innerWidth === rw) return; rw = window.innerWidth; if(played) still(); });
    whenFonts(function(){
    if(calm() || !canAnim){ played = true; still(); return; }
    var g0 = build(); g0.p.setAttribute('pathLength','1'); g0.p.style.strokeDasharray = '1 2'; g0.p.style.strokeDashoffset = '1.05';
    g0.beads.forEach(function(b){ b.style.opacity = '0'; }); g0.dot.style.opacity = '0';
    FD.onceInView(ul, function(){
      played = true;
      var g = build(), T = 900, span = (g.yEnd + 18) - g.y0;
      g.beads.forEach(function(b){ b.style.opacity = '0'; }); g.dot.style.opacity = '0';
      drawLine(g.p, {dur:T, ease:E.io}).then(function(){
        g.dot.style.opacity = '';
        anim(g.dot, [{opacity:0, transform:'translateY(-10px)'},{opacity:1, transform:'none'}], {duration:300, easing:E.land});
      });
      g.beads.forEach(function(b, i){
        var f = (g.ys[i] - g.y0) / span, at = Math.max(0, f)*T*0.85 + i*80;
        setTimeout(function(){ b.style.opacity = ''; anim(b, [{opacity:0, transform:'scale(.5)'},{opacity:1, transform:'scale(1)'}], {duration:200, easing:E.out}); }, at);
      });
      g.beads.forEach(function(b){ b.style.transformBox = 'fill-box'; b.style.transformOrigin = '50% 50%'; });
      g.dot.style.transformBox = 'fill-box'; g.dot.style.transformOrigin = '50% 50%';
    }, .35);
    });
  });

  /* ---- edison: about, the pin drops once and its ring draws ---- */
  safe('edison', function(){
    var tile = $('.fd-edison'); if(!tile) return;
    var pin = $('.fd-ed-pinw', tile), ring = $('.fd-ed-ring', tile), lab = $('.fd-ed-l', tile);
    if(ring){ ring.setAttribute('pathLength','1'); ring.style.strokeDasharray = '1 2'; }
    if(calm() || !canAnim) return;
    tile.classList.add('is-pre');
    FD.onceInView(tile, function(){
      tile.classList.remove('is-pre');
      if(pin) pin.animate([{opacity:0, transform:'translateY(-22px)'},{opacity:1, transform:'none'}], {duration:600, easing:E.land, fill:'backwards'});
      if(ring) ring.animate([{strokeDashoffset:1.05},{strokeDashoffset:0}], {duration:450, delay:450, easing:E.io, fill:'backwards'});
      if(lab) lab.animate([{opacity:0},{opacity:1}], {duration:200, delay:700, easing:E.out, fill:'backwards'});
    }, .35);
  });

  /* (the FAQ read map was cut after the whimsy review, 2026-10-23: it read as carousel dots) */

  /* ---- tocdot: legal, a dot beside the section you are reading (1200px and up, where the rail is sticky) ---- */
  safe('tocdot', function(){
    var ol = $('.fd-legal-body .legal-toc ol'); if(!ol) return;
    var links = $$('a[href^="#"]', ol), heads = [];
    links.forEach(function(a){ var t = doc.getElementById(a.getAttribute('href').slice(1)); if(t) heads.push([t, a]); });
    if(!heads.length) return;
    var dot = doc.createElement('span'); dot.className = 'fd-toc-dot'; dot.setAttribute('aria-hidden', 'true'); ol.appendChild(dot);
    var cur = null, mq = window.matchMedia ? matchMedia('(min-width:1200px)') : {matches:true}, raf = 0;
    function pick(){
      raf = 0; if(!mq.matches) return;
      var line = (($('.site-nav') || {}).offsetHeight || 72) + 60, hit = null;
      for(var i = 0; i < heads.length; i++){ if(heads[i][0].getBoundingClientRect().top <= line) hit = heads[i]; else break; }
      if(hit === cur) return; cur = hit;
      if(!hit){ dot.classList.remove('is-on'); return; }
      var y = hit[1].offsetTop + hit[1].offsetHeight/2;
      var first = !dot.classList.contains('is-on');
      if(first || calm()){ dot.style.transition = 'none'; dot.style.transform = 'translateY('+y.toFixed(1)+'px)'; void dot.offsetWidth; dot.style.transition = ''; }
      else dot.style.transform = 'translateY('+y.toFixed(1)+'px)';
      dot.classList.add('is-on');
      /* keep the marked entry inside the rail when the rail itself scrolls (long contents lists) */
      var toc = ol.closest('.legal-toc');
      if(toc && toc.scrollHeight > toc.clientHeight + 1){
        var tr = toc.getBoundingClientRect(), ar = hit[1].getBoundingClientRect();
        if(ar.top < tr.top + 40 || ar.bottom > tr.bottom - 16) toc.scrollTop += (ar.top - tr.top) - tr.height/2;
      }
    }
    function req(){ if(!raf) raf = requestAnimationFrame(pick); }
    window.addEventListener('scroll', req, {passive:true}); window.addEventListener('resize', function(){ cur = null; req(); });
    pick();
  });

  /* ---- motion: accessibility, the site motion switch ---- */
  safe('motion', function(){
    var sw = $('.fd-motion-switch'); if(!sw) return;
    var note = $('.fd-ms-note');
    function paint(){
      var os = !!osq.matches, s = stored(), on = !(s === 'off') && !(os && s !== 'on');
      sw.setAttribute('aria-checked', on ? 'true' : 'false');
      if(note){ note.hidden = !os; sw.setAttribute('aria-describedby', os ? 'fd-mo-l fd-mo-n' : 'fd-mo-l'); }
    }
    sw.addEventListener('click', function(){
      var on = sw.getAttribute('aria-checked') !== 'true';
      setMotion(on);
      if(on) root.classList.remove('fd-calm'); else root.classList.add('fd-calm');
      sw.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    if(osq.addEventListener) osq.addEventListener('change', paint);
    paint();
  });
})();
