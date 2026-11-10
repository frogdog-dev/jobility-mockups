/* =====================================================================
   v4 Home hero: "Dot finds three" (2026-11-09, hero2 pass). GSAP 3 core only; transforms and opacity.
   Story: "24 applied", a crowd of people. The j's dot wakes, hops across the crowd (AI matching), checks three nurses and
   passes on one that does not fit. JT, a person on our team, stamps each of the three ("Reviewed by our team"). The card
   arrives, the three travel into it and become a short list, the rest of the crowd steps back, the count rolls 24 to 3,
   the dot hops home onto the j and "No agency fee." settles. About 5.5s on desktop, 4.5s on phones. Plays once.
   The markup is the finished picture. html.hd-arm (set in <head> only when motion is allowed) shows the start frame by
   CSS; this file sets the same start state with GSAP, removes the class in the same frame, and plays.
   Final frame, no motion: reduced motion, html.fd-calm (the site motion switch), ?capture=1, ?still=1, GSAP missing,
   the hero not in view at start. A hover on the stage after the run gives one small hop (at most every 4s).
   When it ends (or is skipped) it fires 'fd:herodot' on window and sets html[data-hd="done"]; home-v2.js waits for it
   before the rotating word starts, so only one thing moves at a time.
   Harness: window.FD_HD = { tl } (pause and seek for frame strips).
   ===================================================================== */
(function(){
  'use strict';
  var doc = document, root = doc.documentElement, W = window;
  var fig = doc.querySelector('[data-herodot]');
  var fired = false;
  function fire(){
    if(fired) return; fired = true; root.setAttribute('data-hd', 'done');
    var ev; try{ ev = new CustomEvent('fd:herodot'); }catch(e){ ev = doc.createEvent('CustomEvent'); ev.initCustomEvent('fd:herodot', false, false, null); }
    W.dispatchEvent(ev);
  }
  function disarm(){ root.classList.remove('hd-arm'); fire(); }
  W.FD_HD = { started: false };
  if(!fig){ disarm(); return; }
  function reduced(){
    if(W.FD && FD.reduced) return FD.reduced();
    return root.classList.contains('fd-calm') || root.classList.contains('capture') ||
      !!(W.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  if(!root.classList.contains('hd-arm') || reduced() || !W.gsap){ disarm(); return; }

  var svg = [].filter.call(fig.querySelectorAll('.hd-svg'), function(s){ return getComputedStyle(s).display !== 'none'; })[0];
  var r0 = fig.getBoundingClientRect();
  if(!svg || r0.bottom < 0){ disarm(); return; }   /* already scrolled past it: the finished picture */

  var g = W.gsap, $ = function(s, c){ return (c || svg).querySelector(s); }, $$ = function(s, c){ return [].slice.call((c || svg).querySelectorAll(s)); };
  var phone = svg.getAttribute('data-hd') === 'p';
  var dot = $('.hd-dot'), dy = $('.hd-dot-y'), body = $('.hd-dot-b');
  var hx = +dot.getAttribute('data-hx'), hy = +dot.getAttribute('data-hy'), dr = +dot.getAttribute('data-r');
  var crowd = $$('.hd-c'), miss = $('.hd-miss'), picks = $$('.hd-pick');
  var R = +$('.hd-av', crowd[0]).getAttribute('width') / 2;
  var rows = $$('.hd-row'), rev = $('.hd-rev'), jt = $('.hd-jt'), tag = $('.hd-tag'), slots = $$('.hd-slot');
  var headA = $('.hd-head-a'), headB = $('.hd-head-b'), fly = $$('.hd-fly circle'), more = $('.hd-more'), ai = $('.hd-ai');
  var was = $('.hd-was'), strike = $('.hd-strike'), numg = $('.hd-numg');
  var roll = $('.hd-roll'), rollY = +roll.getAttribute('data-lh') * +roll.getAttribute('data-n'), stop = $('.hd-num-stop');
  function ctr(el){ return (+el.getAttribute('data-x')) + ' ' + (+el.getAttribute('data-y')); }

  /* ---- the start frame (mirrors the html.hd-arm CSS). The class goes first so GSAP never reads its CSS transforms;
     the sets below run in the same task, so nothing paints in between */
  root.classList.remove('hd-arm');
  g.set([crowd, more], { opacity: 1 });
  g.set([tag, headB, rev, ai, was], { opacity: 0 });
  try{ var wt = $('.hd-was-t'); strike.setAttribute('x2', (+wt.getAttribute('x') + wt.getComputedTextLength() + 3).toFixed(1)); }catch(e){}
  g.set(strike, { scaleX: 0, transformOrigin: '0% 50%' });
  g.set(numg, { transformOrigin: '100% 70%' });
  g.set([headA, slots], { opacity: 1 });
  g.set(rows, { opacity: 0, x: -6 });
  g.set(roll, { y: rollY });
  g.set(jt, { transformOrigin: '50% 50%' });
  picks.forEach(function(p){
    g.set(p, { x: +p.getAttribute('data-fx'), y: +p.getAttribute('data-fy') });
    g.set($('.hd-pick-s', p), { scale: +p.getAttribute('data-s'), svgOrigin: ctr(p) });
    g.set($('.hd-lit', p), { opacity: 0 });
    g.set($('.hd-p-ring', p), { opacity: 0, scale: 1.25, svgOrigin: ctr(p) });
    g.set([$('.hd-badge', p), $('.hd-stamp', p), $('.hd-role', p)], { opacity: 1 });
    g.set($('.hd-badge-s', p), { scale: 0, transformOrigin: '50% 50%' });
    g.set($('.hd-stamp-s', p), { scale: 0, opacity: 0, rotation: -24, transformOrigin: '50% 50%' });
  });
  g.set(body, { transformOrigin: '50% 100%' });
  if(miss){ g.set($('.hd-no', miss), { opacity: 0 }); g.set($('.hd-no-s', miss), { scale: 0, transformOrigin: '50% 50%' }); }
  root.setAttribute('data-hd', 'play');
  W.FD_HD.started = true;

  /* ---- helpers. Positions are relative to the dot's home on the j (viewBox units). */
  function seat(el){   /* where the dot sits on a person: on top of the head, just touching */
    var x = +el.getAttribute('data-x'), y = +el.getAttribute('data-y');
    if(el.classList.contains('hd-pick')){ x += +el.getAttribute('data-fx'); y += +el.getAttribute('data-fy'); }
    return { x: x - hx, y: y - R - dr * .78 - hy, cx: x, cy: y };
  }
  var tl = g.timeline({ paused: true, defaults: { ease: 'power2.out' }, onComplete: done });
  var cur = { x: 0, y: 0 };
  function squash(t, k){ /* land: squash, then spring back */
    k = k || 1;
    tl.to(body, { scaleX: 1 + .26 * k, scaleY: 1 - .3 * k, duration: .07, ease: 'power2.out' }, t)
      .to(body, { scaleX: 1, scaleY: 1, duration: .28, ease: 'back.out(3)' }, t + .07);
  }
  function hop(t, to, dur, arc){
    var apex = Math.max(Math.min(cur.y, to.y) - arc, dr + 18 - hy);   /* stays well inside the stage's top edge */
    tl.to(dot, { x: to.x, duration: dur, ease: 'power1.inOut' }, t)
      .to(dy, { y: apex, duration: dur * .5, ease: 'power2.out' }, t)
      .to(dy, { y: to.y, duration: dur * .5, ease: 'power2.in' }, t + dur * .5)
      .to(body, { scaleX: .86, scaleY: 1.16, duration: dur * .3, ease: 'power1.out' }, t)
      .to(body, { scaleX: 1, scaleY: 1, duration: dur * .3, ease: 'power1.inOut' }, t + dur * .38);
    squash(t + dur);
    cur = { x: to.x, y: to.y };
    return t + dur;
  }
  function light(t, p){ /* AI match: the person brightens on white, a pink ring settles, the pink check pops */
    tl.to($('.hd-lit', p), { opacity: 1, duration: .18 }, t)
      .to($('.hd-p-ring', p), { opacity: 1, scale: 1, duration: .3, ease: 'back.out(2)' }, t)
      .to($('.hd-badge-s', p), { scale: 1, duration: .32, ease: 'back.out(3)' }, t + .05)
      .to($('.hd-role', p), { opacity: 0, duration: .2 }, t + .05);
  }

  /* ---- the timeline */
  var A = picks[0], B = picks[1], C = picks[2];
  var t = .2;
  // wake: an anticipation squash, then a pop up off the j
  tl.to(body, { scaleX: 1.26, scaleY: .7, duration: .18, ease: 'power2.out' }, t);
  t += .18;
  tl.to(dy, { y: -36, duration: .24, ease: 'back.out(2)' }, t)
    .to(body, { scaleX: .86, scaleY: 1.16, duration: .1, ease: 'power1.out' }, t)
    .to(body, { scaleX: 1, scaleY: 1, duration: .16, ease: 'power1.inOut' }, t + .1);
  cur = { x: 0, y: -36 };
  t += .3;
  // look: arc up into the crowd, land on A, check
  var sA = seat(A); t = hop(t, sA, .42, 34); light(t, A);
  t += .14;
  // the one that does not fit: the dot lands, pauses, shakes its head; a grey "no" pops; the person steps back
  var sM = seat(miss), no = $('.hd-no', miss), noS = $('.hd-no-s', miss); t = hop(t, sM, .3, 24);
  t += .12;
  tl.to(dot, { keyframes: [{ x: sM.x - 5, duration: .08 }, { x: sM.x + 5, duration: .1 }, { x: sM.x - 3, duration: .08 }, { x: sM.x, duration: .07 }], ease: 'sine.inOut' }, t)
    .to(no, { opacity: 1, duration: .1 }, t + .05)
    .to(noS, { scale: 1, duration: .24, ease: 'back.out(3)' }, t + .05)
    .to(miss, { opacity: .34, duration: .35 }, t + .48)
    .to(no, { opacity: 0, duration: .3 }, t + .55);
  t += .36;
  var sB = seat(B); t = hop(t, sB, .32, 26); light(t, B);
  t += .12;
  var sC = seat(C); t = hop(t, sC, .32, 26); light(t, C);
  // the header names what just happened: "Matched by AI" (its icon is a little pink dot)
  tl.fromTo(ai, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: .26, immediateRender: false }, t + .05)
    .fromTo($('circle', ai), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .3, ease: 'back.out(3)', immediateRender: false }, t + .05);
  t += .3;
  // a person reviews: JT appears in the card's header ("Reviewed by our team"), nods once per pick and sends a stamp up
  // to it; each stamp lands with a small press on the person
  tl.fromTo(rev, { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: .26, immediateRender: false }, t);
  t += .14;
  var jc = jt.querySelector('circle'), jx = +jc.getAttribute('cx'), jy = +jc.getAttribute('cy');
  [A, B, C].forEach(function(p, i){
    var k = t + i * .18, S = +p.getAttribute('data-s'), st = $('.hd-stamp', p), m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(st.getAttribute('transform'));
    var px = +p.getAttribute('data-x'), py = +p.getAttribute('data-y');
    var wx = px + (+p.getAttribute('data-fx')) + (+m[1] - px) * S, wy = py + (+p.getAttribute('data-fy')) + (+m[2] - py) * S;
    var fl = fly[i];
    tl.to(jt, { keyframes: [{ scale: 1.25, duration: .07 }, { scale: 1, duration: .14 }], ease: 'power2.out' }, k)
      .set(fl, { opacity: 1, x: 0, y: 0, scale: .5, transformOrigin: '50% 50%' }, k + .03)
      .to(fl, { x: wx - jx, duration: .34, ease: 'power1.inOut' }, k + .03)
      .to(fl, { y: wy - jy, duration: .34, ease: 'power2.out' }, k + .03)
      .to(fl, { scale: 1.1, duration: .2, ease: 'power1.out' }, k + .03)
      .set(fl, { opacity: 0 }, k + .37)
      .fromTo($('.hd-stamp-s', p), { opacity: 1, scale: 1.6, rotation: -24 }, { scale: 1, rotation: 0, duration: .26, ease: 'back.out(2.6)', immediateRender: false }, k + .35)
      .to($('.hd-pick-s', p), { keyframes: [{ scale: S * .93, duration: .06 }, { scale: S, duration: .18 }], ease: 'power2.out' }, k + .36);
  });
  t += .18 * 2 + .3;
  // the short list: the dot hops home first, the three travel into the card's empty seats, the rest of the crowd steps
  // back, the count rolls 24 -> 3 and "applied" becomes "people to meet"
  var tHome = t;
  tl.to(body, { scaleX: 1.18, scaleY: .8, duration: .08 }, t)
    .to(body, { scaleX: 1, scaleY: 1, duration: .1 }, t + .08);
  tl.to(dot, { x: 0, duration: .58, ease: 'power1.inOut' }, t + .1)
    .to(dy, { y: Math.max(Math.min(cur.y, 0) - 30, dr + 18 - hy), duration: .26, ease: 'power2.out' }, t + .1)
    .to(dy, { y: 0, duration: .32, ease: 'power2.in' }, t + .36)
    .to(body, { scaleX: .86, scaleY: 1.16, duration: .16 }, t + .1)
    .to(body, { scaleX: 1, scaleY: 1, duration: .16 }, t + .3);
  squash(t + .68, 1.15);
  t += .12;
  tl.to([crowd, more], { opacity: .34, duration: .5, ease: 'power1.inOut' }, t + .1);
  picks.forEach(function(p, i){
    var k = t + .14 + i * .14, ps = $('.hd-pick-s', p);
    tl.to(p, { x: 0, duration: .72, ease: 'power2.inOut' }, k)
      .to(p, { y: 0, duration: .72, ease: 'power2.in' }, k)
      .to(ps, { keyframes: [{ scale: +p.getAttribute('data-s') * 1.08, duration: .22, ease: 'power1.out' }, { scale: 1, duration: .5, ease: 'power2.inOut' }] }, k)
      .to($('.hd-p-ring', p), { opacity: 0, duration: .3 }, k + .2)
      .to($('.hd-role', p), { opacity: 0, duration: .3 }, k + .2)
      .set(slots[i], { opacity: 0 }, k + .72)
      .to(rows[i], { opacity: 1, x: 0, duration: .36 }, k + .6);
  });
  // the count: a slot-roll down to 3, then the stop gives a tiny bounce
  var tRoll = t + .5;
  tl.to(roll, { y: 0, duration: 1.05, ease: 'back.out(1.15)' }, tRoll)
    .to(headA, { opacity: 0, y: -6, duration: .15, ease: 'power1.in' }, tRoll + .25)
    .fromTo(headB, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .2, immediateRender: false }, tRoll + .42)
    .to(numg, { keyframes: [{ scale: 1.06, duration: .1, ease: 'power2.out' }, { scale: 1, duration: .22, ease: 'power2.inOut' }] }, tRoll + .82)
    .fromTo(stop, { y: 0 }, { keyframes: [{ y: -5, duration: .12, ease: 'power2.out' }, { y: 0, duration: .22, ease: 'bounce.out' }], immediateRender: false }, tRoll + .95);
  // the money: "Agency fee" appears under the card, a pink line strikes it, and it resolves to "No agency fee."
  tl.to(was, { opacity: 1, duration: .25 }, tRoll + .2)
    .to(strike, { scaleX: 1, duration: .25, ease: 'power2.inOut' }, tRoll + .62)
    .to(was, { opacity: 0, duration: .18 }, tRoll + 1.0)
    .fromTo(tag, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .32, immediateRender: false }, tRoll + 1.08)

  if(phone) tl.timeScale(1.3);
  W.FD_HD.tl = tl;

  /* the harness can freeze a frame: ?t=2.4 */
  var qt = /[?&]t=([\d.]+)/.exec(location.search);
  if(qt){ tl.pause(+qt[1]); return; }

  function done(){
    fire();
    // one small hop on hover, at most every 4s; never with motion off
    var last = 0;
    fig.addEventListener('mouseenter', function(){
      var now = Date.now(); if(now - last < 4000 || reduced() || tl.isActive()) return; last = now;
      g.timeline()
        .to(body, { scaleX: 1.16, scaleY: .82, duration: .08 })
        .to(dy, { y: -16, duration: .18, ease: 'power2.out' })
        .to(body, { scaleX: .92, scaleY: 1.1, duration: .1 }, '<')
        .to(dy, { y: 0, duration: .16, ease: 'power2.in' })
        .to(body, { scaleX: 1, scaleY: 1, duration: .1 }, '<')
        .to(body, { scaleX: 1.2, scaleY: .76, duration: .06 })
        .to(body, { scaleX: 1, scaleY: 1, duration: .26, ease: 'back.out(3)' });
    });
  }
  // the site motion switch turned off mid-run: jump to the end
  W.addEventListener('fd:motion', function(){ if(reduced() && tl.isActive()) tl.progress(1); });
  /* on load when it is in view (desktop); on phones it sits under the buttons, so it waits, at its calm start frame,
     until half of it is on screen, and the rotating word is released straight away (they are never on screen together) */
  var vh = W.innerHeight || 800, visible = Math.min(r0.bottom, vh) - Math.max(r0.top, 0);
  if(visible >= r0.height * .5 || !('IntersectionObserver' in W)) tl.play(0);
  else {
    fire();
    var io = new IntersectionObserver(function(es){
      if(!es[0].isIntersecting) return; io.disconnect(); tl.play(0);
    }, { threshold: .5 });
    io.observe(fig);
  }
})();
