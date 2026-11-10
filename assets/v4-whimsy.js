/* =====================================================================
   v4 whimsy (2026-11-09): five small moments from jobility_redteam/v4_design.md, each under 0.8s, each answering a
   person's action except W6, each played once per trigger, each showing its end state (or nothing) when motion is off:
   FD.reduced() covers prefers-reduced-motion, the site motion switch (html.fd-calm) and ?capture=1.
   No GSAP: the Web Animations API and CSS. Every module runs inside FD.safe; if one fails the page is unchanged.

   W1 cards ... Home "What do you need right now?": on hover or focus each card's miniature does its one job.
                Shortlist: Maria's row gets its check. Crew roster: the empty Saturday fills to 6. Shift: the dot travels
                7 a.m. to 7 p.m. and the end stop answers.
   W2 keep .... the shared calculator: "With pay per post, you keep $X compared with an agency." under the bars, from the calculator's own
                numbers (agency fee minus pay per post). It counts to the new figure 300ms after the inputs settle.
   W4 sent .... Contact: when the thank-you appears, the j's dot drops in above the heading and turns into a check.
   W5 404 ..... the headline's stop glances left and right and hops once (the hero's character, looking for the page).
   W6 foot .... the first time the footer comes into view in a session, the footer logo's dot hops once.
   ===================================================================== */
(function(){
  'use strict';
  var FD = window.FD = window.FD || {}, doc = document, root = doc.documentElement, W = window;
  var $ = function(s, c){ return (c || doc).querySelector(s); }, $$ = function(s, c){ return [].slice.call((c || doc).querySelectorAll(s)); };
  var safe = FD.safe || function(n, f){ try{ f(); }catch(e){ if(W.console) console.warn('[FD v4] ' + n + ' off:', e); } };
  function calm(){ return FD.reduced ? FD.reduced() : (root.classList.contains('fd-calm') || !!(W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)); }
  var canAnim = !!(Element.prototype.animate);
  var E = { out: 'cubic-bezier(.215,.61,.355,1)', inn: 'cubic-bezier(.55,.085,.68,.53)', back: 'cubic-bezier(.34,1.56,.64,1)', io: 'cubic-bezier(.455,.03,.515,.955)', land: 'cubic-bezier(.19,1,.22,1)' };
  var NS = 'http://www.w3.org/2000/svg';
  function anim(el, kf, o){ if(!canAnim || calm()) return null; return el.animate(kf, o); }

  /* ---- W1: the solution cards preview their offering ---- */
  safe('cards', function(){
    $$('.fv-choose > li > a').forEach(function(a){
      var mini = $('.fv-mini', a); if(!mini) return;
      var on = function(){}, off = function(){};
      if(mini.classList.contains('fv-mini--shortlist')){
        var row = $('.fv-mini-row.is-sel', mini) || $('.fv-mini-row', mini); if(!row) return;
        var chk = doc.createElement('span'); chk.className = 'v4-chk'; chk.setAttribute('aria-hidden', 'true');
        chk.innerHTML = '<svg viewBox="0 0 16 16" focusable="false"><path d="M4.2 8.3 6.9 11l5-5.6"/></svg>';
        row.appendChild(chk);
        on = function(){ chk.classList.add('is-on'); anim(chk, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 250, easing: E.back }); };
        off = function(){ chk.classList.remove('is-on'); };
      } else if(mini.classList.contains('fv-mini--roster')){
        var cell = $('.fv-ros-c.is-off', mini); if(!cell) return;
        var was = cell.textContent;
        on = function(){ cell.textContent = '6'; cell.classList.add('v4-fill'); anim(cell, [{ transform: 'scale(.6)' }, { transform: 'scale(1)' }], { duration: 250, easing: E.back }); };
        off = function(){ cell.textContent = was; cell.classList.remove('v4-fill'); };
      } else if(mini.classList.contains('fv-mini--shift')){
        var svg = $('svg', mini), path = svg && $('path', svg), end = svg && $$('circle', svg).pop(); if(!path) return;
        var dot = doc.createElementNS(NS, 'circle'); dot.setAttribute('r', '4'); dot.setAttribute('class', 'v4-shdot');
        var p0 = path.getPointAtLength(0); dot.setAttribute('cx', p0.x); dot.setAttribute('cy', p0.y);
        svg.appendChild(dot);
        var raf = 0, L = path.getTotalLength();
        on = function(){
          cancelAnimationFrame(raf);
          if(calm()){ var pe = path.getPointAtLength(L); dot.setAttribute('cx', pe.x); dot.setAttribute('cy', pe.y); dot.classList.add('is-on'); return; }
          dot.classList.add('is-on'); var t0 = performance.now(), D = 600;
          (function step(now){
            var k = Math.min(1, (now - t0) / D), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;   /* power1.inOut-ish */
            var pt = path.getPointAtLength(L * e); dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
            if(k < 1) raf = requestAnimationFrame(step);
            else if(end) anim(end, [{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 260, easing: E.out });
          })(t0);
        };
        off = function(){ cancelAnimationFrame(raf); dot.classList.remove('is-on'); dot.setAttribute('cx', p0.x); dot.setAttribute('cy', p0.y); };
        if(end){ end.style.transformBox = 'fill-box'; end.style.transformOrigin = 'center'; }
      } else return;
      var inside = false;
      function enter(){ if(inside) return; inside = true; on(); }
      function leave(){ if(!inside) return; inside = false; off(); }
      a.addEventListener('mouseenter', enter); a.addEventListener('mouseleave', function(){ if(doc.activeElement !== a) leave(); });
      a.addEventListener('focus', enter); a.addEventListener('blur', function(){ if(!a.matches(':hover')) leave(); });
    });
  });

  /* ---- W2: "You keep $X compared with an agency." ---- */
  safe('keep', function(){
    $$('.fd-calc3').forEach(function(q){
      var ag = $('[data-out="agency"]', q), pp = $('[data-out="postbar"]', q) || $('[data-out="post"]', q);
      var bars = $('.bars', q); if(!ag || !pp || !bars) return;
      var line = doc.createElement('p'); line.className = 'v4-keep';
      line.innerHTML = 'With pay per post, you keep <b class="v4-keep-n"></b> compared with an agency.';
      bars.parentNode.insertBefore(line, bars.nextSibling);
      var n = $('.v4-keep-n', line), shown = 0, tm = 0, raf = 0;
      function num(el){ return +(el.textContent || '').replace(/[^\d.]/g, '') || 0; }
      function fmt(v){ return '$' + Math.round(v).toLocaleString('en-US'); }
      function target(){ return Math.max(0, num(ag) - num(pp)); }
      shown = target(); n.textContent = fmt(shown);
      function settle(){
        var to = target(); if(to === shown) return;
        var from = shown; shown = to; cancelAnimationFrame(raf);
        if(calm()){ n.textContent = fmt(to); return; }
        var t0 = performance.now(), D = 500, S = 10;
        (function step(now){
          var k = Math.min(1, (now - t0) / D), s = Math.ceil(k * S) / S;   /* steps(10): it ticks, it does not blur */
          n.textContent = fmt(from + (to - from) * s);
          if(k < 1) raf = requestAnimationFrame(step);
          else anim(n, [{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 240, easing: E.out });
        })(t0);
      }
      var mo = new MutationObserver(function(){ clearTimeout(tm); tm = setTimeout(settle, 300); });
      [ag, pp].forEach(function(el){ mo.observe(el, { childList: true, characterData: true, subtree: true }); });
    });
  });

  /* ---- W4: Contact, the dot drops in and becomes a check ---- */
  safe('sent', function(){
    var boxes = $$('[data-thanks]'); if(!boxes.length) return;
    boxes.forEach(function(box){
      var done = false;
      function show(){
        if(done || box.hidden) return; done = true;
        var h = $('h2,h3', box); if(!h) return;
        var b = doc.createElement('span'); b.className = 'v4-sent'; b.setAttribute('aria-hidden', 'true');
        b.innerHTML = '<svg viewBox="0 0 32 32" focusable="false"><circle cx="16" cy="16" r="16"/><path d="M9.5 16.5 14 21l8.5-9.5" pathLength="1"/></svg>';
        h.parentNode.insertBefore(b, h);
        if(calm() || !canAnim) return;
        var c = $('circle', b), p = $('path', b);
        c.animate([{ transform: 'translateY(-22px) scale(.45)', opacity: 0 }, { transform: 'translateY(0) scale(.45)', opacity: 1, offset: .55 }, { transform: 'scaleX(1.12) scaleY(.9)', offset: .78 }, { transform: 'scale(1)' }], { duration: 420, easing: E.inn, fill: 'both' });
        p.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 220, delay: 380, easing: E.out, fill: 'both' });
      }
      new MutationObserver(show).observe(box, { attributes: true, attributeFilter: ['hidden'] });
      show();
    });
  });

  /* ---- W5: 404, the stop looks around and hops ---- */
  safe('nf404', function(){
    if(!root.querySelector('.fd-page-404')) { if(!doc.body || !doc.body.classList.contains('fd-page-404')) return; }
    var s = $('main h1 .stop'); if(!s || calm() || !canAnim) return;
    s.classList.add('v4-stop');
    s.animate([
      { transform: 'translateY(0) rotate(0)' },
      { transform: 'translateY(-.06em) rotate(-14deg)', offset: .2 },
      { transform: 'translateY(-.06em) rotate(14deg)', offset: .42 },
      { transform: 'translateY(.02em) scale(1.25,.75)', offset: .58 },
      { transform: 'translateY(-.42em) scale(.9,1.12)', offset: .78 },
      { transform: 'translateY(.02em) scale(1.2,.8)', offset: .92 },
      { transform: 'translateY(0) scale(1)' }
    ], { duration: 760, delay: 450, easing: 'ease-in-out' });
  });

  /* ---- W6: the footer logo's dot hops once a session ---- */
  safe('foothop', function(){
    var logo = $('.site-foot .logo svg'), jm = logo && $('.jm', logo); if(!jm || !('IntersectionObserver' in W)) return;
    var KEY = 'fd-foothop'; try{ if(sessionStorage.getItem(KEY)) return; }catch(e){}
    if(calm() || !canAnim) return;
    var d = jm.getAttribute('d'), parts = d.split(/(?=M)/).filter(function(x){ return x.trim(); });
    if(parts.length < 3) return;
    var dotD = parts.pop();
    var io = new IntersectionObserver(function(es){
      if(!es[0].isIntersecting) return; io.disconnect();
      try{ sessionStorage.setItem(KEY, '1'); }catch(e){}
      /* split the dot off for the hop only, then put the logo back exactly as it was */
      jm.setAttribute('d', parts.join(''));
      var dot = doc.createElementNS(NS, 'path'); dot.setAttribute('d', dotD); dot.setAttribute('class', 'jm v4-footdot');
      jm.parentNode.insertBefore(dot, jm.nextSibling);
      var a = dot.animate([
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(6px) scale(1.18,.8)', offset: .16 },
        { transform: 'translateY(-80px) scale(.9,1.12)', offset: .52 },
        { transform: 'translateY(6px) scale(1.22,.78)', offset: .86 },
        { transform: 'translateY(0) scale(1)' }
      ], { duration: 560, delay: 250, easing: 'ease-in-out' });
      a.onfinish = a.oncancel = function(){ jm.setAttribute('d', d); if(dot.parentNode) dot.parentNode.removeChild(dot); };
    }, { threshold: .9 });
    io.observe(logo);
  });
})();
