/* =====================================================================
   home-hero.js: the home hero signature (Direction A; round 3, 2026-10-20)
   Three request cards (Full-time, Temp, Shift) threaded by the one j line into the match panel (DESIGN.md brief).
   The ONLY auto-playing moment on the site, 1024px and up. Plays once when the stage is 35% in view, then holds.
   Choosing Full-time / Temp / Shift highlights that request and answers it: the old list leaves, the pen runs
   from the chosen card along the line into the panel, and the count re-lands in the panel title.
   768 to 1023 and phones use the phone layout: the panel alone under the picker, with a static j stroke down its
   left edge (bead per row, a short curl), the count chip as the j's dot, and a 0.25s redraw on a pick.

   Handoff hooks: .fd-hero-tl stage · .fd-req request cards · .fd-draw line masks · .fd-node beads (one per request
   card; the line's terminal is the count chip) · .fd-pen the pen · .fd-dot the count chip (the j's dot) · .fd-dlabel its label
   · .fd-panel · .fd-title · .fd-row
   Needs gsap 3.13.0 + DrawSVGPlugin. Without them, on any error, with reduced motion, or when the head script's
   1.2s failsafe already showed the finished picture (window.FD_LATE), the finished picture shows, it is never
   wiped and replayed on its own, and the picker still swaps content.
   Start state: the finished picture is the default markup. Before GSAP, html.fd-motion holds back only the line,
   beads, count and rows (cards and the panel with its skeleton stay visible). The real start state is set by
   GSAP here, once it is ready, and only then is .fd-motion removed.

   Why each animation exists (motion brief):
   - three request cards, one lit ................ the three kinds of hiring in the headline; the pick is yours
   - panel waits with three skeleton rows ......... "Finding matches": the panel is never an empty slab
   - the pen draws the j through each request ..... one portal gathering every request: the brand's own mark
   - beads light as the pen passes each card ...... each request is picked up, never before the line gets there
   - the line climbs the panel edge to the title .. the moment of match: the j's dot becomes the count
   - skeleton clears, then rows, count 1, 2, 3 ..... vetting shown, not claimed (never both at once)
   - on a new pick the old list leaves first ...... the new request is answered, never two lists at once
   ===================================================================== */
(function(){
  'use strict';
  var root = document.documentElement, doc = document, NS = 'http://www.w3.org/2000/svg';
  var stage = doc.getElementById('hh-stage'); if(!stage) return;
  var field = stage.querySelector('.hh-field'), panel = doc.getElementById('hh-panel'), pen = doc.getElementById('hh-pen');
  var chip = doc.getElementById('hh-n'), num = chip.querySelector('.n'), nlabel = doc.getElementById('hh-nl');
  var srCount = stage.querySelector('[data-hh-sr]'), live = doc.getElementById('hh-live');
  var skel = stage.querySelector('.hh-skel'), skRows = skel ? [].slice.call(skel.children) : [];
  var ledes = [].slice.call(stage.querySelectorAll('.hh-lede span'));
  var radios = [].slice.call(doc.querySelectorAll('#hh-seg [role=radio]'));
  var reqs = [].slice.call(stage.querySelectorAll('.hh-req'));
  var roles = [].slice.call(stage.querySelectorAll('.hh-for [data-mode]'));
  var lists = [].slice.call(stage.querySelectorAll('.hh-list'));
  var svg = stage.querySelector('.hh-line--d'), path = svg && svg.querySelector('.jpath');
  var draws = svg ? [].slice.call(svg.querySelectorAll('.fd-draw')) : [];
  var beads = svg ? [].slice.call(svg.querySelectorAll('.hh-beads .fd-node')) : [];
  var heroCta = doc.querySelector('[data-hero-cta]'), mbarCta = doc.querySelector('[data-mbar-cta]');
  var talks = [].slice.call(doc.querySelectorAll('[data-hero-talk]'));
  var MODES = ['ft','temp','shift'];
  var SAY = {ft:'a full-time warehouse supervisor', temp:'4 temp warehouse associates', shift:'a Saturday CNA shift'};
  /* CTA hierarchy (r6, matches the offering pages): Full-time leads with Post a job; Temp and Shift are quoted by the hour,
     so they lead with Talk to us and keep Post a temp job / Post a shift as the outlined secondary. Every mode also links
     to its own page (the picker is where Ops and the healthcare buyer say who they are). */
  var SIGNUP = (window.FD && FD.PRICES && FD.PRICES.signup) || 'https://enterprise.jobility.com/signup';
  /* R9: Temp and Shift lead with the outcome, a rate from the page's own rate card; Post a temp job / Post a shift stay
     the outlined secondary. The small print under the buttons says what the rate card asks for. */
  var CTA = { ft:{post:'Post a job', topic:'direct', lead:'post', go:'See direct hiring', page:'direct-hiring.html', note:'Choose how you pay when you post.'},
              temp:{post:'Post a temp job', topic:'temp', lead:'rate', rate:'Get a temp rate', go:'See temp staffing', page:'contingent-labor.html', note:'Tell us the roles, headcount and dates.'},
              shift:{post:'Post a shift', topic:'shift', lead:'rate', rate:'Get a shift rate', go:'See shift coverage', page:'gig-work.html', note:'Tell us the role, the ZIP and the shift length.'} };
  var heroNote = doc.querySelector('[data-hero-note]'), subs = [].slice.call(doc.querySelectorAll('[data-hero-sub] [data-sub]'));
  var goLink = doc.querySelector('[data-hero-go]');
  var desk = window.matchMedia('(min-width: 1024px)');
  var G = !!(window.gsap && window.DrawSVGPlugin), motion = false, played = false, tl = null, mode = 'ft', kt = null;
  var BL = [];   /* length along the j where it passes each request card's bead */

  function pick(arr, m){ for(var i=0;i<arr.length;i++){ if(arr[i].getAttribute('data-mode')===m) return arr[i]; } }
  function rowsOf(m){ return [].slice.call(pick(lists, m).querySelectorAll('.fd-row')); }
  function allRows(){ return [].slice.call(stage.querySelectorAll('.hh-list .fd-row')); }
  function clr(els){ els = [].concat(els).filter(Boolean); if(G){ gsap.set(els,{clearProps:'all'}); } else { els.forEach(function(e){ e.style.opacity=''; e.style.visibility=''; e.style.transform=''; }); } }
  function swap(m){ roles.concat(lists).forEach(function(e){ e.classList.toggle('on', e.getAttribute('data-mode')===m); }); }
  function setActive(m){ reqs.forEach(function(r, i){ var on = r.getAttribute('data-mode')===m; r.classList.toggle('is-on', on); if(beads[i]) beads[i].classList.toggle('is-pick', on); }); }
  function lede(finding){ ledes.forEach(function(e){ e.classList.toggle('on', e.hasAttribute('data-finding') === finding); }); }
  function ledeNow(finding){ ledes.forEach(function(e){ e.style.transition = 'none'; }); lede(finding); void stage.offsetWidth; ledes.forEach(function(e){ e.style.transition = ''; }); }
  /* Shift reads like the gig hero it routes to: 2 of 2 filled (R7) */
  function words(n, m){ if((m || mode) === 'shift') return 'of ' + rowsOf('shift').length + ' filled'; return n === 1 ? 'vetted match' : 'vetted matches'; }
  function count(n){ num.textContent = String(n); nlabel.textContent = words(n); }
  function sr(m){ var n = rowsOf(m).length; if(srCount) srCount.textContent = n+' '+words(n, m); return n; }
  function announce(m){ live.textContent = 'Example view: '+sr(m)+' '+words(rowsOf(m).length, m)+' for '+SAY[m]+'.'; }

  /* the hero's two buttons and the phone bar follow the pick. Post links go to the portal sign-up with no parameters;
     Talk to us carries the matching contact topic. The filled button is always the first one. */
  function asPost(a, label){ a.textContent = label; a.setAttribute('href', SIGNUP); a.removeAttribute('data-topic'); }
  function asTalk(a, topic){ a.textContent = 'Talk to us'; a.setAttribute('data-topic', topic); a.setAttribute('href', 'contact.html?topic='+topic); }
  function asRate(a, c){ a.textContent = c.rate; a.setAttribute('href', c.page + '#pricing'); a.removeAttribute('data-topic'); }
  function setCta(m){
    var c = CTA[m];
    [heroCta, mbarCta].forEach(function(a){ if(!a) return; if(c.lead === 'post') asPost(a, c.post); else asRate(a, c); });
    talks.forEach(function(a){ if(c.lead === 'post') asTalk(a, c.topic); else asPost(a, c.post); });
    if(goLink){ goLink.textContent = c.go; goLink.setAttribute('href', c.page); }
    if(heroNote) heroNote.textContent = c.note;
    subs.forEach(function(e){ e.classList.toggle('on', e.getAttribute('data-sub') === m); });
  }

  /* The ribbon gradient follows the line: Optimism at the first request, Passion at the panel.
     Built as short colored segments so the color runs along the path, not across the box. */
  var STOPS = [[0,[255,146,65]],[.3,[255,102,52]],[.65,[255,59,88]],[1,[211,0,91]]];
  function col(t){ for(var i=1;i<STOPS.length;i++){ if(t<=STOPS[i][0]){ var a=STOPS[i-1], b=STOPS[i], k=(t-a[0])/(b[0]-a[0]); return 'rgb('+a[1].map(function(v,j){ return Math.round(v+(b[1][j]-v)*k); }).join(',')+')'; } } return 'rgb(211,0,91)'; }
  function ribbon(){
    if(!svg || svg.getAttribute('data-rib')) return;
    var gs = svg.querySelectorAll('.rib'), L = path.getTotalLength(); if(!L) return;
    var LA = draws[0].getTotalLength();
    var n = Math.ceil(L/5), prev = path.getPointAtLength(0), fa = doc.createDocumentFragment(), fb = doc.createDocumentFragment();
    for(var i=1;i<=n;i++){
      var q = path.getPointAtLength(L*i/n), s = doc.createElementNS(NS,'path');
      s.setAttribute('d','M'+prev.x.toFixed(2)+' '+prev.y.toFixed(2)+'L'+q.x.toFixed(2)+' '+q.y.toFixed(2)); s.setAttribute('stroke', col((i-.5)/n));
      (L*(i-.5)/n < LA ? fa : fb).appendChild(s); prev = q;
    }
    [].forEach.call(gs, function(g){ g.setAttribute('fill','none'); g.setAttribute('stroke-width', path.getAttribute('stroke-width')); g.setAttribute('stroke-linecap','round'); });
    gs[0].appendChild(fa); gs[1].appendChild(fb); path.setAttribute('stroke','none'); svg.setAttribute('data-rib','1');
  }

  /* beads sit where the line passes each card's vertical center (measured, so Divi spacing can move the cards) */
  function placeBeads(){
    if(!svg || !path) return;
    var sr0 = svg.getBoundingClientRect(); if(!sr0.width) return;
    var K = sr0.width / 720, stemEnd = draws[0].getTotalLength() * .62;
    reqs.forEach(function(r, i){
      var rr = r.getBoundingClientRect(), cy = (rr.top + rr.height/2 - sr0.top) / K, best = 0, bd = 1e9;
      for(var l = 0; l <= stemEnd; l += 2){ var d = Math.abs(path.getPointAtLength(l).y - cy); if(d < bd){ bd = d; best = l; } }
      var p = path.getPointAtLength(best); BL[i] = best;
      if(beads[i]){ beads[i].setAttribute('cx', p.x.toFixed(1)); beads[i].setAttribute('cy', p.y.toFixed(1)); }
    });
  }

  /* ---- phones and 768 to 1023: a static j down the panel's left edge, the count chip as its dot ---- */
  var pl = null, plPath = null, plBeads = null, plArmed = false, plDone = false;
  function buildPhone(redraw){
    if(desk.matches || !panel.offsetWidth) return;
    if(!pl){
      pl = doc.createElementNS(NS,'svg'); pl.setAttribute('class','hh-pline'); pl.setAttribute('aria-hidden','true'); pl.setAttribute('focusable','false');
      pl.innerHTML = '<defs><linearGradient id="hh-prib" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="400"><stop offset="0" stop-color="#FF9241"/><stop offset=".3" stop-color="#FF6634"/><stop offset=".65" stop-color="#FF3B58"/><stop offset="1" stop-color="#D3005B"/></linearGradient></defs><path class="fd-draw" pathLength="1" stroke="url(#hh-prib)"/><g class="hh-pbeads"></g>';
      panel.insertBefore(pl, panel.firstChild);
      plPath = pl.querySelector('path'); plBeads = pl.querySelector('.hh-pbeads');
    }
    var pr = panel.getBoundingClientRect(), cr = chip.getBoundingClientRect(), W = pr.width, H = pr.height;
    var rows = rowsOf(mode); if(!rows.length || !cr.width) return;
    var x = cr.left + cr.width/2 - pr.left, y0 = cr.bottom - pr.top + 8;
    var cys = rows.map(function(r){ var b = r.getBoundingClientRect(); return b.top + b.height/2 - pr.top; });
    var y1 = cys[cys.length-1];
    function f(n){ return n.toFixed(1); }
    var d = 'M'+f(x)+' '+f(y0)+' L'+f(x)+' '+f(y1)+' C'+f(x)+' '+f(y1+18)+' '+f(x-4)+' '+f(y1+30)+' '+f(x-13)+' '+f(y1+28)+' C'+f(x-20)+' '+f(y1+26)+' '+f(x-22)+' '+f(y1+16)+' '+f(x-18)+' '+f(y1+10);
    pl.setAttribute('viewBox','0 0 '+f(W)+' '+f(H)); plPath.setAttribute('d', d);
    var g = pl.querySelector('linearGradient'); g.setAttribute('y1', f(y0)); g.setAttribute('y2', f(y1+30));
    while(plBeads.firstChild) plBeads.removeChild(plBeads.firstChild);
    cys.forEach(function(cy){ var c = doc.createElementNS(NS,'circle'); c.setAttribute('class','fd-node'); c.setAttribute('cx', f(x)); c.setAttribute('cy', f(cy)); c.setAttribute('r','5'); plBeads.appendChild(c); });
    plGeo = {y0:y0, y1:y1 + 30, cys:cys};
    if(!plDone && !redraw) phoneIntro();
    if(plArmed) [].forEach.call(plBeads.children, function(b){ b.style.opacity = '0'; });
    if(redraw && plArmed){ phoneSettle(); }
    if(redraw && !(window.FD && FD.reduced && FD.reduced())){
      plPath.style.transition = 'none'; plPath.style.strokeDashoffset = '1'; void plPath.getBoundingClientRect();
      plPath.style.transition = ''; plPath.style.strokeDashoffset = '0';
    }
  }

  /* R9: the phone and tablet j draws once, the first time the panel is 40% on screen: the stroke runs top to bottom
     (0.9s, ease in-out), each bead pops as the stroke reaches its row and the count ticks with it. Reduced motion,
     ?capture=1 or no IntersectionObserver: the finished picture, as before. Transform and opacity only, plus the
     stroke's dash offset; the layout never moves. */
  var plGeo = null;
  function phoneIntro(){
    plDone = true;
    if((window.FD && FD.reduced && FD.reduced()) || root.classList.contains('capture') || !('IntersectionObserver' in window)) return;
    plArmed = true;
    plPath.style.transition = 'none'; plPath.style.strokeDashoffset = '1';
    count(1);   /* pre-mortem: never rest on "0 vetted matches" (screenshots, Atarim pins); the tick runs 1 to n */
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ io.disconnect(); phonePlay(); } }); }, {threshold:.4});
    io.observe(panel); plIO = io;
  }
  var plIO = null, plT = [];
  function phonePlay(){
    if(!plArmed) return;
    void plPath.getBoundingClientRect();
    plPath.style.transition = 'stroke-dashoffset .9s cubic-bezier(.65,0,.35,1)'; plPath.style.strokeDashoffset = '0';
    var g = plGeo, span = Math.max(1, g.y1 - g.y0), beads = [].slice.call(plBeads.children);
    g.cys.forEach(function(cy, i){
      var u = Math.min(1, Math.max(0, (cy - g.y0) / span)), t = 900 * (u < .5 ? Math.cbrt(u / 4) : 1 - Math.cbrt((1 - u) / 4));   /* inverse of the ease, near enough */
      plT.push(setTimeout(function(){ if(beads[i]){ beads[i].style.transition = 'opacity .2s'; beads[i].style.opacity = '1'; } count(i + 1); }, t));
    });
    plT.push(setTimeout(phoneSettle, 1000));
  }
  function phoneSettle(){
    plArmed = false; plT.forEach(clearTimeout); plT = []; if(plIO){ plIO.disconnect(); plIO = null; }
    if(plPath){ plPath.style.transition = ''; plPath.style.strokeDashoffset = ''; }
    if(plBeads) [].forEach.call(plBeads.children, function(b){ b.style.transition = ''; b.style.opacity = ''; });
    count(rowsOf(mode).length);
  }

  /* stop a running timeline without letting its onComplete fire into the next one */
  function stop(jump){
    if(!tl) return;
    var old = tl; tl = null;
    old.eventCallback('onComplete', null);
    if(jump){ old.progress(1); ledeNow(false); }   /* rapid picks: the jumped-to end state reads settled at once (r5) */
    old.kill();
  }

  /* Finished picture for the current mode, no motion (failsafe, reduced motion, phones, resize).
     Restores every element a timeline can touch, including the count. */
  function finish(){
    stop(false);
    swap(mode); setActive(mode); lede(false);
    clr([panel,pen,chip,nlabel,skel].concat(reqs, roles, allRows(), skRows, draws, beads));
    count(rowsOf(mode).length); sr(mode);
    beads.forEach(function(b){ b.classList.add('on'); });
    root.classList.remove('fd-motion');
  }

  /* The signature. Intro: the pen draws the j from the first request through all three into the panel and lands as the
     count. Re-pick: the line stays (it is the one portal); the pen runs from the chosen request into the panel. */
  function run(m, intro){
    stop(true);
    ribbon(); placeBeads();
    var L = path.getTotalLength(), LA = draws[0].getTotalLength(), LB = draws[1].getTotalLength();
    function seg(el, a, b, len){ a = Math.max(0, Math.min(len, a)); b = Math.max(0, Math.min(len, b)); if(b-a < .5){ gsap.set(el,{opacity:0}); } else { gsap.set(el,{opacity:1, drawSVG:a+' '+b}); } }
    function line(a, b){ seg(draws[0], a, b, LA); seg(draws[1], a-LA, b-LA, LB); }
    var sr0 = svg.getBoundingClientRect(), K = sr0.width / 720, S0 = path.getPointAtLength(0);
    function off(q){ return {x:(q.x-S0.x)*K, y:(q.y-S0.y)*K}; }
    var oldM = mode, oldRole = pick(roles, oldM), oldRows = rowsOf(oldM);
    mode = m;
    var k = Math.max(0, MODES.indexOf(m)), newRole = pick(roles, m), newRows = rowsOf(m), n = newRows.length;
    var setX = gsap.quickSetter(pen,'x','px'), setY = gsap.quickSetter(pen,'y','px'), pp = {l:0}, t0, from, dur;
    var shown = beads.map(function(){ return false; });
    function passBeads(len){
      for(var i=0;i<beads.length;i++){
        var at = i < BL.length ? BL[i] : L - 1;
        if(!shown[i] && len >= at){ shown[i] = true; gsap.to(beads[i],{autoAlpha:1, duration:.15, overwrite:true}); beads[i].classList.add('on'); }
      }
    }

    tl = gsap.timeline({defaults:{ease:'power3.out'}, onComplete:function(){
      tl = null; clr([newRole,skel,pen,chip,nlabel].concat(newRows, skRows, beads)); lede(false); count(n);
      beads.forEach(function(b){ b.classList.add('on'); });
    }});

    if(intro){
      /* the start state, applied now that GSAP is ready; .fd-motion held the same picture until this moment */
      swap(m); setActive(m); lede(true);
      gsap.set(allRows(),{autoAlpha:0, y:8}); gsap.set(skel,{autoAlpha:1}); gsap.set(skRows,{autoAlpha:1});
      gsap.set(chip,{autoAlpha:0, scale:.5}); gsap.set(nlabel,{autoAlpha:0});
      gsap.set(beads,{autoAlpha:0}); beads.forEach(function(b){ b.classList.remove('on'); });
      gsap.set(pen,{autoAlpha:0, x:0, y:0});
      clr(draws); line(0,0);
      root.classList.remove('fd-motion');
      tl.to(pen,{autoAlpha:1, duration:.15}, .15);
      from = 0; t0 = .3; dur = 1.6;
    } else {
      /* the old answer leaves first (rows together, count, role), then the skeleton; the line stays drawn */
      setActive(m);
      tl.to(oldRows,{autoAlpha:0, y:-6, duration:.14, ease:'power2.in'}, 0)
        .to([chip, nlabel],{autoAlpha:0, duration:.12, ease:'power2.in'}, 0)
        .to(oldRole,{autoAlpha:0, x:-8, duration:.12, ease:'power2.in'}, 0)
        .fromTo(skel,{autoAlpha:0},{autoAlpha:1, duration:.18}, .14)
        .set(skRows,{autoAlpha:1}, .14)
        .add(function(){ lede(true); }, .14)   /* "Finding matches" only once the old rows are gone */
        .add(function(){ swap(m); clr([oldRole].concat(oldRows)); if(oldRole !== newRole) gsap.set(newRole,{autoAlpha:0, x:8}); gsap.set(newRows,{autoAlpha:0, y:8}); gsap.set(chip,{scale:.5}); }, .16)
        .to(newRole,{autoAlpha:1, x:0, duration:.26}, .17);
      from = BL[k] || 0;
      var p0 = off(path.getPointAtLength(from));
      tl.set(pen,{x:p0.x, y:p0.y}, 0).fromTo(pen,{autoAlpha:0},{autoAlpha:1, duration:.12}, .08);
      if(beads[k]) tl.fromTo(beads[k],{scale:1.35, transformOrigin:'50% 50%'},{scale:1, duration:.3, ease:'expo.out'}, .08);
      shown = shown.map(function(){ return true; });
      t0 = .2; dur = .35 + .7 * ((L - from) / L);
    }

    /* the pen leads the line (intro) or runs along it (re-pick) into the panel */
    pp.l = from;
    tl.to(pp,{l:L, duration:dur, ease:'power2.inOut', onUpdate:function(){ var o = off(path.getPointAtLength(pp.l)); if(intro){ line(0, pp.l); passBeads(pp.l); } setX(o.x); setY(o.y); }}, t0);
    /* the line ends in the panel title, so the pen's last step is the count: it fades as the chip lands as the j's dot.
       The skeleton clears as the pen arrives, and "Finding matches" gives way in the same beat, so the skeleton
       and the rows are never on screen together. */
    var land = t0 + dur + .04;
    tl.to(skel,{autoAlpha:0, duration:.16, ease:'power2.in'}, land-.2)
      .to(pen,{autoAlpha:0, duration:.1}, land-.04)
      .add(function(){ count(1); lede(false); }, land-.06)
      .to(chip,{autoAlpha:1, duration:.08}, land-.06).to(chip,{scale:1, duration:.45, ease:'expo.out'}, land-.06)
      .to(nlabel,{autoAlpha:1, duration:.25}, land);
    /* the short list enters row by row once the skeleton is gone, and the count ticks with each match */
    newRows.forEach(function(r, i){
      var at = land + .06 + i*.2;
      tl.to(r,{autoAlpha:1, y:0, duration:.38}, at);
      if(i > 0) tl.add(function(){ count(i+1); }, at+.04).fromTo(chip,{scale:1.12},{scale:1, duration:.22, ease:'expo.out', immediateRender:false}, at+.04);
    });
    var done = land + .1 + (n-1)*.2;
    tl.add(function(){ count(n); lede(false); }, done);
    return tl;
  }

  /* The live control: a radiogroup with roving focus (arrows, Home, End).
     Arrowing through options replays only the last one (180ms debounce); clicks answer at once. */
  function choose(m, focus){
    var same = m === mode && played;
    radios.forEach(function(r){ var on = r.getAttribute('data-mode')===m; r.setAttribute('aria-checked', on ? 'true' : 'false'); r.tabIndex = on ? 0 : -1; if(on && focus) r.focus(); });
    setCta(m);
    clearTimeout(kt);
    if(same && !tl) return;
    announce(m);
    if(motion && G && desk.matches){
      var go = function(){ try{ var intro = !played; played = true; run(m, intro); }catch(e){ if(window.console) console.warn('[FD] hero replay off:', e); mode = m; finish(); } };
      if(focus) kt = setTimeout(go, 180); else go();
    } else { mode = m; finish(); buildPhone(true); }
  }
  radios.forEach(function(r, i){
    r.addEventListener('click', function(){ choose(r.getAttribute('data-mode'), false); });
    r.addEventListener('keydown', function(e){
      var key = e.key, j = null;
      if(key==='ArrowRight'||key==='ArrowDown') j = (i+1)%radios.length;
      else if(key==='ArrowLeft'||key==='ArrowUp') j = (i+radios.length-1)%radios.length;
      else if(key==='Home') j = 0; else if(key==='End') j = radios.length-1;
      if(j!==null){ e.preventDefault(); choose(radios[j].getAttribute('data-mode'), true); }
    });
  });
  /* a card is also a way to pick (pointer only; the radiogroup is the keyboard and screen-reader control) */
  reqs.forEach(function(r){ r.addEventListener('click', function(){ choose(r.getAttribute('data-mode'), false); }); });

  /* phone stroke follows layout changes (fonts, rotation, Divi spacing) */
  var rq; function relayout(){ cancelAnimationFrame(rq); rq = requestAnimationFrame(function(){ if(!desk.matches) buildPhone(false); else if(!tl) placeBeads(); }); }
  if('ResizeObserver' in window) new ResizeObserver(relayout).observe(stage); else window.addEventListener('resize', relayout);
  if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(relayout);

  try{
    try{ ribbon(); placeBeads(); }catch(e){}                      /* the ribbon colors work with or without GSAP */
    if(!G || root.classList.contains('fd-calm')){ finish(); buildPhone(false); return; }   /* Whimsy P1 (D2): the site motion switch shows the finished picture */
    gsap.registerPlugin(DrawSVGPlugin);
    /* the failsafe or capture mode already showed the finished picture: never wipe it to replay the intro */
    if(window.FD_LATE || root.classList.contains('capture')) played = true;
    var mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px)', function(){
      motion = true;
      var io = null;
      if(played){ finish(); }
      else {
        io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ io.disconnect(); if(!played){ played = true; try{ run(mode, true); }catch(err){ if(window.console) console.warn('[FD] hero intro off:', err); finish(); } } } }); }, {threshold:.35});
        io.observe(stage);
      }
      var rt; function onResize(){ clearTimeout(rt); rt = setTimeout(function(){ if(tl) finish(); }, 200); }
      window.addEventListener('resize', onResize);
      return function(){ motion = false; if(io) io.disconnect(); clearTimeout(kt); window.removeEventListener('resize', onResize); finish(); };
    });
    /* reduced motion, tablets and phones: the finished picture, instantly */
    mm.add('(prefers-reduced-motion: reduce), (max-width: 1023px)', function(){ motion = false; finish(); buildPhone(false); });
  }catch(err){ motion = false; try{ finish(); buildPhone(false); }catch(e){ root.classList.remove('fd-motion'); } }
})();
