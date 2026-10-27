/* =====================================================================
   offering.js: hero visuals for the three offering pages (round 3, 2026-10-20; R5 heroes, 2026-10-21)
   Needs site.js first. No GSAP: CSS transitions on transform and opacity only.
   Every visual's default markup is its finished picture. Each page has ONE entry moment, always in the same
   slot: the hero stage (.fd-entry), played once by FD.onceInView(stage, play, .4). JS adds the start state only
   under html.fd-motion; reduced motion, no IntersectionObserver or a missing script leaves the end state.

   The brand line (R5 decision, supersedes "home only"): each offering hero carries ONE piece of the j line, doing
   one page-specific job. jline() builds it as an SVG over the hero object, in the object's own pixels, rebuilt on
   resize (never redrawn). It draws once, on entry, by a wipe: a mask rect scaled on X (transform only), then the
   j's dot lands. Never more than one line per view.
     direct ...... the line leaves the chosen person and ends on the offer letter's Day one row (the line becomes the hire)
     contingent .. the line marks "This week" on the crew roster
     gig ......... the line is the shift's arc across the day, 7 a.m. to 7 p.m., clock-in bead to clock-out dot

   offer ...... [data-offer]      Direct hiring hero. Entry: the letter settles in (0.5s), a Day fill marks
                                  "Your business" (0.45s), then the line draws (0.85s). A pick swaps the name and
                                  start date in a masked box (old out 0.14s, then new in 0.22s: never overprinted)
                                  and moves the line's start to the new person 150ms later, gliding 0.3s (no redraw).
   roster ..... [data-roster]     Contingent hero: a three-week crew roster. Entry: the days fill week by week,
                                  a Day fill marks the employer, the line marks This week and hooks like the
                                  logo's j under the last column, ending in its dot (about 1.6s in all).
   stub ....... [data-stub]       Contingent signature section: "Whose name is on the pay stub?" toggle
                                  (user-triggered; the employer fill re-runs on each change).
   shift ...... [data-shiftfill]  Gig hero. Entry: the arc draws across the day, then each open slot clears and its
                                  accepted worker settles in; the visible count is an aria-hidden clone that ticks as
                                  each slot lands; the real "2 of 2 filled" text never changes.
   rate ....... [data-rate-ask]   Gig and contingent: a request preview. Role, ZIP and shift length (or headcount
                                  and dates) ride on the filled Get a rate button as query parameters; the label names the role.
   Hooks: .fd-entry .fd-jline .fd-offer .fd-pick .fd-letter .fd-mark .fd-roster .fd-stub .fd-shift .fd-slot
          .fd-draw .fd-dot .fd-node .fd-s2d .fd-shiftline .fd-pband .fd-rate-ask .fd-founder
   ===================================================================== */
(function(){
  'use strict';
  var FD = window.FD = window.FD || {}, doc = document, root = doc.documentElement, NS = 'http://www.w3.org/2000/svg';
  var $ = FD.$, $$ = FD.$$, safe = FD.safe;
  var motion = function(){ return root.classList.contains('fd-motion') && !FD.reduced() && ('IntersectionObserver' in window); };
  FD.offerReady = true;

  function rel(el, box){ var a = el.getBoundingClientRect(), b = box.getBoundingClientRect(); return {l:a.left-b.left, t:a.top-b.top, r:a.right-b.left, b:a.bottom-b.top, w:a.width, h:a.height}; }
  function shown(el){ return !!(el && el.getClientRects().length); }
  function f(n){ return n.toFixed(1); }
  function roll(el){ el.classList.remove('is-roll'); void el.offsetWidth; el.classList.add('is-roll'); }
  /* play an entry once in view; failsafe: if it never comes into view, show the finished picture */
  function entry(box, play, finish){
    var done = false;
    function end(){ if(done) return; done = true; box.classList.add('is-played'); if(finish) finish(); }
    if(!motion()){ end(); return end; }
    FD.onceInView(box, function(){ if(done) return; done = true; play(); }, .4);
    setTimeout(end, 4000);
    return end;
  }

  /* ---- jline: one piece of the j line over a hero object ----
     route() returns {d, sx, sy, ex, ey, x0, x1, bead} in host pixels, or null to hide the line. */
  var JN = 0, STOPS = '<stop offset="0" stop-color="#FF9241"/><stop offset=".3" stop-color="#FF6634"/><stop offset=".65" stop-color="#FF3B58"/><stop offset="1" stop-color="#D3005B"/>';
  function jline(host, route, held){
    var id = 'oj' + (++JN), svg = doc.createElementNS(NS, 'svg');
    /* created already held, with transitions off for its first style resolution: it never shows drawn and then rewinds */
    svg.setAttribute('class', 'oj' + (held ? ' is-pre is-snap' : '')); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.innerHTML = '<defs><linearGradient id="' + id + 'g" gradientUnits="userSpaceOnUse">' + STOPS + '</linearGradient>'
      + '<mask id="' + id + 'm" maskUnits="userSpaceOnUse"><rect class="oj-wipe" fill="#fff"/></mask></defs>'
      + '<path class="oj-path fd-draw" stroke="url(#' + id + 'g)" mask="url(#' + id + 'm)"/>'
      + '<circle class="oj-bead fd-node" r="7"/><circle class="oj-dot fd-dot" r="8.5"/>';
    host.appendChild(svg);
    var path = svg.querySelector('path'), grad = svg.querySelector('linearGradient'), wipe = svg.querySelector('rect'),
        bead = svg.querySelector('.oj-bead'), dot = svg.querySelector('.oj-dot');
    var last = null, gl = 0;
    function build(){
      var W = host.clientWidth, H = host.clientHeight; if(!W) return;
      cancelAnimationFrame(gl);
      var r = route(); svg.style.display = r ? '' : 'none'; if(!r) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); last = r; paint(r);
    }
    function paint(r){
      var H = host.clientHeight;
      path.setAttribute('d', r.d);
      grad.setAttribute('x1', f(r.sx)); grad.setAttribute('y1', f(r.sy)); grad.setAttribute('x2', f(r.ex)); grad.setAttribute('y2', f(r.ey + .01));
      var a = Math.min(r.x0, r.sx) - 24, b = Math.max(r.x1, r.ex) + 24;
      wipe.setAttribute('x', f(a)); wipe.setAttribute('y', '-200'); wipe.setAttribute('width', f(b - a)); wipe.setAttribute('height', f(H + 400));
      bead.style.display = r.bead ? '' : 'none'; bead.setAttribute('cx', f(r.sx)); bead.setAttribute('cy', f(r.sy));
      dot.setAttribute('cx', f(r.ex)); dot.setAttribute('cy', f(r.ey));
    }
    /* glide (R7): the start point travels to its new place (0.3s, power2.inOut); path, bead and gradient follow each frame */
    function glide(){
      var to = route(), from = last; if(!to || !from || FD.reduced() || svg.style.display === 'none'){ build(); return; }
      cancelAnimationFrame(gl); var t0 = performance.now();
      (function step(now){
        var k = Math.min(1, Math.max(0, (now - t0) / 300)), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        var r = route({ sx: from.sx + (to.sx - from.sx) * e, sy: from.sy + (to.sy - from.sy) * e }); if(r) paint(r);
        if(k < 1) gl = requestAnimationFrame(step); else last = to;
      })(t0);
    }
    var raf;
    function soon(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(build); }
    build();
    if(held){ svg.getBoundingClientRect(); svg.classList.remove('is-snap'); }
    if('ResizeObserver' in window) new ResizeObserver(soon).observe(host);
    window.addEventListener('resize', soon, {passive:true});
    if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(soon);
    return {
      build: build, glide: glide,
      draw: function(){ build(); svg.classList.add('is-wiping'); void svg.getBoundingClientRect(); svg.classList.remove('is-pre'); },
      done: function(){ build(); svg.classList.remove('is-pre'); }
    };
  }
  /* a hook into a straight run: the line arrives from above-left, turns, and runs under the target to the dot */
  function hookUnder(x0, x1, y, rise){
    return 'M' + f(x0 - 14) + ' ' + f(y - rise) + ' C' + f(x0 - 14) + ' ' + f(y - 6) + ' ' + f(x0 - 8) + ' ' + f(y) + ' ' + f(x0 + 6) + ' ' + f(y) + ' L' + f(x1) + ' ' + f(y);
  }

  /* masked swap of a value in place: old and new share one grid cell inside an overflow-hidden box. The old one leaves
     first (0.14s), the new one arrives after it (0.22s, delayed in CSS), so the two are never on top of each other. */
  function xval(el){
    if(el._xv) return el._xv;
    var s = doc.createElement('span'); s.className = 'xv'; s.textContent = el.textContent;
    el.textContent = ''; el.appendChild(s); el.classList.add('xstack'); el._xv = s; return s;
  }
  function xswap(el, txt){
    var cur = xval(el); if(cur.textContent === txt) return;
    $$('.xv.is-leaving', el).forEach(function(n){ n.parentNode.removeChild(n); });
    if(FD.reduced()){ cur.textContent = txt; return; }
    var nx = doc.createElement('span'); nx.className = 'xv is-entering'; nx.textContent = txt;
    cur.classList.add('is-leaving'); cur.setAttribute('aria-hidden', 'true');
    el.appendChild(nx); el._xv = nx;
    void nx.offsetWidth; nx.classList.remove('is-entering');
    setTimeout(function(){ if(cur.parentNode) cur.parentNode.removeChild(cur); }, 420);
  }

  /* ---- offer: shortlist -> offer letter; the line becomes the hire ---- */
  safe('offer', function(){
    var box = $('[data-offer]'); if(!box) return;
    var group = $('[data-seg]', box), nameEl = $('[data-offer-name]', box), startEl = $('[data-offer-start]', box), live = $('[data-offer-live]', box);
    xval(nameEl); xval(startEl);
    var line = jline(box, function(o){
      var pick = $('.offer-pick[aria-checked="true"]', box) || $('.offer-pick', box), letter = $('.offer-letter', box);
      if(!pick) return null;
      if(shown(letter)){
        /* desktop and tablet: from the chosen row, across the gap, into the letter, under the Day one row */
        var p = rel(pick, box), L = rel(letter, box), dt = rel($('dt.ol-day', box), box), v = rel($('.xv', startEl) || startEl, box);
        var sx = o ? o.sx : p.r, sy = o ? o.sy : p.t + p.h / 2, y = Math.max(dt.b, v.b) + 5, x0 = dt.l - 2, ex = Math.min(v.r + 10, L.r - 12);
        if(L.l - sx < 16) return null;
        var k = (x0 - sx) * .55;
        return { d: 'M' + f(sx) + ' ' + f(sy) + ' C' + f(sx + k) + ' ' + f(sy) + ' ' + f(x0 - k) + ' ' + f(y) + ' ' + f(x0) + ' ' + f(y) + ' L' + f(ex) + ' ' + f(y),
                 sx: sx, sy: sy, ex: ex, ey: y, x0: sx, x1: ex, bead: true };
      }
      /* phones: the letter folds into one line under the list; the line hooks under "Day one" */
      var t = $('.offer-mini .oj-end', box); if(!shown(t)) return null;
      var q = rel(t, box), yy = q.b + 6;
      return { d: hookUnder(q.l, q.r + 4, yy, 20), sx: q.l - 14, sy: yy - 20, ex: q.r + 4, ey: yy, x0: q.l - 14, x1: q.r + 4, bead: false };
    }, motion());
    entry(box, function(){
      box.classList.add('is-played');
      setTimeout(function(){ line.draw(); }, 820);   /* after the letter has settled and the employer is marked */
    }, function(){ line.done(); });
    group.addEventListener('fd:seg', function(e){
      var b = e.detail.el;
      xswap(nameEl, b.getAttribute('data-name'));
      xswap(startEl, b.getAttribute('data-start'));
      var mini = $('[data-offer-mini]', box); if(mini) mini.textContent = b.getAttribute('data-name');
      /* the line follows the choice into the letter: it moves once the new name has arrived (no redraw) */
      setTimeout(line.glide, 150); setTimeout(line.build, 520);
      if(live) live.textContent = 'Offer letter now addressed to ' + b.getAttribute('data-name').replace(/\.+$/, '') + '. Employer: your business.';
    });
  });

  /* ---- roster: the crew roster fills week by week, the employer is marked, the line marks This week ---- */
  safe('roster', function(){
    var box = $('[data-roster]'); if(!box) return;
    var card = $('.rs-card', box) || box;
    var line = jline(card, function(){
      var row = $('tr.is-now', card); if(!row) return null;
      var cells = [].slice.call(row.cells).filter(shown); if(cells.length < 2) return null;
      var a = rel(cells[0], card), z = rel(cells[cells.length - 1], card), nx = row.nextElementSibling;
      var gap = nx ? rel(nx.cells[1] || nx.cells[0], card).t - z.b : 30;
      /* R7: the j's hook. Along the opened This week gap, then down the card's right channel, and a hook left under the
         last column of the next week, ending in the dot (the logo's j, at the line's weight). Clears every cell. */
      var y = z.b + gap / 2, x0 = a.l + 4;
      var nl = nx ? [].slice.call(nx.cells).filter(shown) : [], n = nl.length ? rel(nl[nl.length - 1], card) : z;
      /* R8: an open top corner at the logo's radius (up to 20), a deeper bowl, and a terminal that lifts as it ends
         between the last two columns, like the j's tail; it sits 16px under the cells, and the grid's bottom margin
         (CSS) keeps 24px+ clear above the footer rule. */
      var xd = z.r + (card.clientWidth - z.r) / 2, R = Math.min(20, (card.clientWidth - z.r) / 2 + 2);
      var pl = nl.length > 1 ? rel(nl[nl.length - 2], card) : null;
      var yb = n.b + 16, xt = pl ? (pl.r + n.l) / 2 : n.l + n.w * .3, R2 = Math.min(22, (xd - xt) / 3), lift = 6;
      var d = 'M' + f(x0) + ' ' + f(y) + ' L' + f(xd - R) + ' ' + f(y) + ' C' + f(xd - R * .45) + ' ' + f(y) + ' ' + f(xd) + ' ' + f(y + R * .45) + ' ' + f(xd) + ' ' + f(y + R)
            + ' L' + f(xd) + ' ' + f(yb - R2) + ' C' + f(xd) + ' ' + f(yb - R2 * .4) + ' ' + f(xd - R2 * .4) + ' ' + f(yb) + ' ' + f(xd - R2) + ' ' + f(yb)
            + ' L' + f(xt + 26) + ' ' + f(yb) + ' C' + f(xt + 12) + ' ' + f(yb) + ' ' + f(xt + 3) + ' ' + f(yb - lift * .35) + ' ' + f(xt) + ' ' + f(yb - lift);
      return { d: d, sx: x0, sy: y, ex: xt, ey: yb - lift, x0: x0, x1: xd + R, bead: false };
    }, motion());
    if(motion()){
      $$('tbody tr', box).forEach(function(tr, r){
        $$('.rs-c', tr).forEach(function(td, c){ td.style.transitionDelay = (r * .16 + c * .03).toFixed(2) + 's'; });
      });
    }
    entry(box, function(){
      box.classList.add('is-played');
      setTimeout(function(){ line.draw(); }, 620);
      setTimeout(function(){ $$('.rs-c', box).forEach(function(td){ td.style.transitionDelay = ''; }); }, 1400);
    }, function(){ line.done(); });
  });

  /* ---- stub: whose name is on the pay stub (signature section, user-triggered) ---- */
  safe('stub', function(){
    var box = $('[data-stub]'); if(!box) return;
    var group = $('[data-seg]', box), live = $('[data-stub-live]', box);
    var SAY = { jobility: box.getAttribute('data-say-jobility'), you: box.getAttribute('data-say-you') };
    group.addEventListener('fd:seg', function(e){
      var v = e.detail.value; box.setAttribute('data-state', v);
      if(live) live.textContent = SAY[v] || '';
      if(!FD.reduced()){ box.classList.remove('is-swap'); void box.offsetWidth; box.classList.add('is-swap'); }
    });
  });

  /* ---- shift: the arc across the day (the j line), then the open slots fill ---- */
  safe('shift', function(){
    var box = $('[data-shiftfill]'); if(!box) return;
    var card = $('.sc-card', box), day = $('.sc-day', box), slots = $$('.fd-slot', box), vis = $('.sc-n', box), real = $('[data-sc-live]', box);
    var line = day ? jline(card, function(){
      var d = rel(day, card), lin = rel($('.sc-day-l--in', day), card);
      var x0 = d.l + 14, x1 = d.r - 14, yb = lin.t - 9, top = d.t + 8, cy = yb - (yb - top) / .75, w = x1 - x0;
      return { d: 'M' + f(x0) + ' ' + f(yb) + ' C' + f(x0 + w * .1) + ' ' + f(cy) + ' ' + f(x1 - w * .1) + ' ' + f(cy) + ' ' + f(x1) + ' ' + f(yb),
               sx: x0, sy: yb, ex: x1, ey: yb, x0: x0, x1: x1, bead: true };
    }, motion()) : null;
    function done(){ if(real) real.setAttribute('aria-live', 'polite'); }
    var n = slots.length;
    if(!motion()){ box.classList.add('is-played'); if(line) line.done(); done(); return; }
    vis.textContent = '0';
    var played = false;
    function finish(){ if(line) line.done(); vis.textContent = String(n); done(); }
    FD.onceInView(box, function(){
      if(played) return; played = true;
      if(line) line.draw();
      /* the arc draws first (0.85s); the slots start filling while its dot lands. Each number lands as its slot
         settles (the open text clears in 0.14s, then the worker settles in; slot 2 runs 0.32s behind slot 1) */
      setTimeout(function(){
        box.classList.add('is-played');
        slots.forEach(function(s, i){ setTimeout(function(){ vis.textContent = String(i+1); roll(vis); if(i === n-1) done(); }, 360 + i*320); });
      }, 640);
    }, .4);
    setTimeout(function(){ if(!played){ played = true; box.classList.add('is-played'); finish(); } }, 4000);
  });

  /* ---- rate (R7): a request preview. Role chips, ZIP, and shift length (shift) or headcount and dates (temp) all ride on
     the filled button as query parameters (contact.html?topic=shift&role=cna&zip=08820&len=12). Nothing is submitted
     here: the button is a link to the contact form, and Enter in a field presses it. The label follows the chip. ---- */
  safe('rate', function(){
    var form = $('[data-rate-ask]'); if(!form) return;
    var a = $('[data-rate-link]', form), kind = form.getAttribute('data-rate-kind') || 'shift';
    var ROLE = kind === 'temp'
      ? { warehouse: 'a warehouse associate', picker: 'a picker and packer', forklift: 'a forklift operator', production: 'a production worker', laborer: 'a general laborer' }
      : { cna: 'a CNA', lpn: 'an LPN', rn: 'an RN', 'med-aide': 'a med aide' };
    function val(n){ var el = form.querySelector('[name="' + n + '"]'); if(!el) return ''; if(el.type === 'radio'){ var c = form.querySelector('[name="' + n + '"]:checked'); return c ? c.value : ''; } return (el.value || '').trim(); }
    function sync(){
      var v = val('rate-role'), e = encodeURIComponent, q = 'contact.html?topic=' + kind + '&role=' + e(v);
      var zip = val('zip').replace(/\D/g, '').slice(0, 5); if(zip.length === 5) q += '&zip=' + zip;
      if(kind === 'shift'){ var len = val('len'); if(len) q += '&len=' + e(len); }
      else { var n = parseInt(val('n'), 10); if(n > 0 && n < 1000) q += '&n=' + n; if(val('start')) q += '&start=' + e(val('start')); if(val('end')) q += '&end=' + e(val('end')); }
      var full = ROLE[v] ? 'Get ' + ROLE[v] + (kind === 'temp' ? ' rate' : ' shift rate') : (kind === 'temp' ? 'Get a temp rate' : 'Get a shift rate');
      if(a){ a.setAttribute('href', q + (FD.srcQ ? FD.srcQ() : ''));
        /* R9: under 420px a long role would wrap the button; the chosen chip already names the role */
        a.textContent = narrow.matches && full.length > 24 ? (kind === 'temp' ? 'Get this rate' : 'Get this shift rate') : full;
        if(narrow.matches && a.textContent !== full) a.setAttribute('aria-label', full); else a.removeAttribute('aria-label'); }
      /* R9: on the healthcare landing the hero and the phone bar ask for the same role the Admin picked here */
      if(kind === 'shift' && document.documentElement.classList.contains('fd-v-healthcare') && ROLE[v]){
        [].forEach.call(document.querySelectorAll('[data-v-healthcare-role]'), function(l){ l.setAttribute('data-role', v);
          l.setAttribute('href', 'contact.html?topic=shift&role=' + e(v) + (FD.srcQ ? FD.srcQ() : ''));
          l.textContent = 'Get ' + ROLE[v] + ' shift rate'; });
      }
    }
    var narrow = window.matchMedia ? matchMedia('(max-width: 419px)') : {matches:false};
    if(narrow.addEventListener) narrow.addEventListener('change', function(){ sync(); });
    form.addEventListener('change', sync); form.addEventListener('input', sync);
    form.addEventListener('submit', function(e){ e.preventDefault(); sync(); if(a) a.click(); });
    sync();
  });
})();
