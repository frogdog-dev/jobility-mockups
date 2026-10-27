/* =====================================================================
   Jobility V1 prototype: shared behaviors (site.js)
   Frogdog, 2026-10-20. Vanilla JS, no GSAP needed: every component works,
   and shows its finished state, with GSAP blocked or JavaScript off.

   Motion rule (DESIGN.md + deck 3.8): the home hero is the only thing that
   plays on its own. Everything here moves only because the visitor did
   something, and every transition is transform or opacity.

   Modules (each initialised inside FD.safe so one failure never breaks the page)
   FD.PRICES ....... the one price data file (deck 3.8): cards, quote, FAQ read from here
   capture ......... ?capture=1 adds html.capture (static header, no CTA bar) for full-page shots
   clean ........... .confirm[data-clean]: buyer-safe wording on the clean page, original wording in review mode
   review .......... one aria-pressed .qtoggle in the top utility bar ("Review" + N unique data-q on the page);
                     toggles body.show-q; sessionStorage; ?review=1 turns it on. Clean read by default.
   links ........... a[data-topic] -> contact.html?topic=; pages outside the prototype -> a short note. No phone links:
                     Jobility shows no phone number (2026-10-21). Every Post button is the plain portal sign-up URL.
   footer .......... plain headings from 768px; under 768px each column becomes a <details> accordion
   menu ............ [data-menu]       mobile menu: toggle, Escape, close on link
   header .......... [data-hero]       header Post a job outline -> fill; scrolled hairline
   mbar ............ .mbar             L15 sticky phone bar after the first scroll, hidden over [data-cta-final] and [data-rate-ask]
   accordion ....... [data-accordion]  L13 FAQ; answers stay in the HTML
   tabs ............ [data-tabs]       L11 walkthrough tabs; arrows, Home/End, Next buttons; never auto-advance
   quote ........... [data-quote]      L6 "Which plan fits you?" quick quote (role + salary)
   switch .......... [data-switch]     "Workers, not resumes" job board / Jobility switch with the j line in front
   year ............ [data-year]       copyright year by code (deck 3.2)
   capturecheck .... ?capture=1 only: console.warn for visible [, {{, owed, Kim's, supply item, Call, 1099, ID check on the
                     clean page, and for any tel: link or Post link with query parameters
   ===================================================================== */
(function(){
  'use strict';
  var FD = window.FD = window.FD || {};
  var doc = document, root = doc.documentElement;
  root.classList.add('js');

  var rmq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:true};
  FD.reduced = function(){ return !!rmq.matches; };
  /* Failsafe: run a module; if it throws, log it and leave the finished markup alone */
  FD.safe = function(name, fn){ try{ fn(); }catch(err){ if(window.console){ console.warn('[FD] '+name+' off:', err); } } };
  function $(s, c){ return (c||doc).querySelector(s); }
  function $$(s, c){ return Array.prototype.slice.call((c||doc).querySelectorAll(s)); }
  FD.$ = $; FD.$$ = $$;

  /* ---- One price data file (deck 3.8). Approved 2026-10-15; answers 2026-10-21: a post owes no fee on a hire (Q1),
     fees are a percentage of first-year salary, hourly pay converted to a yearly amount (Q3). ---- */
  FD.PRICES = {
    post: { /* pay per post, paid once up front: [low, high, label] */
      labor:   [150,150,'General labor and light industrial'],
      it:      [250,250,'IT'],
      hcadmin: [200,200,'Healthcare admin'],
      nursing: [350,400,'Nursing and allied health'],  /* what sets 350 vs 400: Q18 */
      adv:     [500,500,'Advanced practice']
    },
    placement: { self:.08, managed:.15 },             /* of first-year salary; 8% you post and schedule, 15% we do the work */
    agency: .20,                                      /* SIA survey of US staffing firms, 2021 data */
    salary: { min:20000, max:200000, step:1000, start:45000 },
    /* example salary each role starts at in the quote (illustrative, editable by the visitor) */
    salaryByRole: { labor:45000, it:85000, hcadmin:50000, nursing:65000, adv:125000 },
    signup: 'https://enterprise.jobility.com/signup'   /* no query parameters (portal sign-up, 2026-10-21) */
  };
  FD.money = function(n){ return '$'+Math.round(n).toLocaleString('en-US'); };

  /* Tween a set of numbers (requestAnimationFrame, power3.out). Instant under reduced motion. */
  FD.tween = function(from, to, ms, onUpdate, h){
    h = h || FD;   /* pass a holder object so two instances never cancel each other */
    if(FD.reduced() || !window.requestAnimationFrame){ onUpdate(to); return; }
    var t0 = null, keys = Object.keys(to);
    if(h._tw){ cancelAnimationFrame(h._tw); }
    function step(ts){
      if(t0===null) t0 = ts;
      var k = Math.min(1,(ts-t0)/ms), e = 1-Math.pow(1-k,3), cur = {};
      keys.forEach(function(key){ cur[key] = from[key] + (to[key]-from[key])*e; });
      onUpdate(cur);
      if(k<1) h._tw = requestAnimationFrame(step);
    }
    h._tw = requestAnimationFrame(step);
  };

  /* ---- capture: full-page screenshots without sticky repeats (head scripts may already have set it) ---- */
  FD.safe('capture', function(){ if(/[?&]capture=1/.test(location.search)) root.classList.add('capture'); });

  /* ---- clean wording (shared contract, 2026-10-20 round 3) ----
     .confirm[data-clean="..."]: review off shows the data-clean text; review on shows the original wording (kept in
     data-orig on first run) with the dashed underline. Punctuation that directly follows a .confirm moves inside it,
     so the review chip never separates a word from its stop. data-clean="" hides a review-only clause on the clean page. ---- */
  var CLEAN = [];
  FD.cleanPrep = function(){
    $$('.confirm').forEach(function(el){
      if(el._fdp) return; el._fdp = 1;
      var nx = el.nextSibling, c = el.getAttribute('data-clean');
      if(c === '' || !nx || nx.nodeType !== 3) return;
      var m = /^[.,;:!?)]+/.exec(nx.nodeValue); if(!m) return;
      el.appendChild(doc.createTextNode(m[0])); nx.nodeValue = nx.nodeValue.slice(m[0].length);
      if(c != null && !/[.,;:!?)]$/.test(c)) el.setAttribute('data-clean', c + m[0]);
    });
    $$('.confirm[data-clean]').forEach(function(el){
      if(el.hasAttribute('data-orig')) return;
      el.setAttribute('data-orig', el.innerHTML); CLEAN.push(el);
    });
  };
  FD.cleanApply = function(review){
    CLEAN.forEach(function(el){ if(review) el.innerHTML = el.getAttribute('data-orig'); else el.textContent = el.getAttribute('data-clean'); });
  };

  /* ---- review: the open-question layer is off by default. One aria-pressed button in the top utility bar shows it.
     The accessible name is constant ("Review mode, N open questions"); the pressed state carries on/off. ---- */
  FD.safe('review', function(){
    var body = doc.body, qs = {};
    FD.cleanPrep();
    $$('[data-q]').forEach(function(el){ var q = el.getAttribute('data-q'); if(q) qs[q] = 1; });
    var n = Object.keys(qs).length, KEY = 'fd-review', on = false;
    try{ on = sessionStorage.getItem(KEY) === '1'; }catch(e){}
    var m = /[?&]review=([01])/.exec(location.search); if(m) on = m[1] === '1';
    var btn = null;
    if(n){
      btn = doc.createElement('button'); btn.type = 'button'; btn.className = 'qtoggle';
      btn.setAttribute('aria-label', 'Review mode, '+n+' open questions');
      btn.innerHTML = '<span aria-hidden="true">Review</span><span class="qt-n" aria-hidden="true">'+n+'</span>';
      var util = $('.site-util .wrap') || $('.lp-head .wrap');   /* integration: on LP pages the toggle sits in the LP header (no layout shift) */
      if(util) util.appendChild(btn);
      else { var bar = doc.createElement('div'); bar.className = 'qbar'; bar.appendChild(btn); body.insertBefore(bar, body.firstChild); }
      btn.addEventListener('click', function(){ set(!on); });
    }
    function set(v){
      on = !!v && !!n; body.classList.toggle('show-q', on);
      if(btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      FD.cleanApply(on);
      try{ sessionStorage.setItem(KEY, on ? '1' : '0'); }catch(e){}
    }
    set(on);
  });

  /* ---- links (shared contract): a[data-topic] -> contact.html?topic=... Any link to a page outside this prototype is
     stopped on click with a short polite note. ---- */
  FD.MSG_PAGE = 'This page is in the copy document. It isn’t part of the V1 prototype.';
  FD.safe('links', function(){
    /* R7: a contact link keeps its role (data-role) and the landing's source: ?v=healthcare adds src=healthcare, and any
       utm_* on the landing URL rides along, so a lead from the January ads is still labelled when it reaches sales */
    FD.srcQ = function(){ var q = '', e = encodeURIComponent; if(root.classList.contains('fd-v-healthcare')) q += '&src=healthcare';
      /* red team C8: the ad's utm_* are kept for the session (sessionStorage), so LP, then Pricing, then Talk to us still
         reaches sales labelled; the first landing path rides along as landing_page */
      var u = '';
      try{ new URLSearchParams(location.search).forEach(function(v, k){ if(/^utm_[a-z]+$/i.test(k)) u += '&' + e(k) + '=' + e(v); }); }catch(err){}
      try{ if(u){ sessionStorage.setItem('fd-utm', u); if(!sessionStorage.getItem('fd-landing')) sessionStorage.setItem('fd-landing', location.pathname.split('/').pop() || 'index.html'); }
           else u = sessionStorage.getItem('fd-utm') || ''; }catch(err){}
      return q + u; };
    /* R8: the page's inline variant script runs right after the hero (no flash), before the final band and the sticky
       bar exist, so the variant is applied again here to anything it has not reached yet (one label everywhere) */
    if(root.classList.contains('fd-v-healthcare')){
      $$('[data-v-healthcare]').forEach(function(el){ var v = el.getAttribute('data-v-healthcare'); if(el.textContent !== v) el.textContent = v; });
      $$('[data-v-healthcare-role]').forEach(function(el){ el.setAttribute('data-role', el.getAttribute('data-v-healthcare-role'));
        /* R9: the hero and the phone bar jump to the rate card on the plain page; the ad landing sends them to the form */
        var vt = el.getAttribute('data-v-healthcare-topic'); if(vt && !el.hasAttribute('data-topic')) el.setAttribute('data-topic', vt); });
    }
    /* Integration (2026-10-23): the header and footer are one markup on every page (topic=direct). A page that sells a
       different mode names it once on <body data-page-topic>, and its header and footer Talk to us links follow it. */
    var pt = doc.body.getAttribute('data-page-topic');
    if(pt) $$('.site-util a[data-topic], .site-nav a[data-topic], .site-foot a[data-topic]').forEach(function(a){ a.setAttribute('data-topic', pt); });
    $$('a[data-topic]').forEach(function(a){ var t = a.getAttribute('data-topic'), r = a.getAttribute('data-role'), e = encodeURIComponent;
      a.setAttribute('href', 'contact.html'+(t ? '?topic='+e(t)+(r ? '&role='+e(r) : '')+FD.srcQ() : '')); });
    /* Buildout (2026-10-23): every page in the site plan is now coded in the prototype, so only a file outside this list
       (or a bare #) still shows the note. Ad landing pages are lp-*.html. */
    var IN = /^(index|direct-hiring|contingent-labor|gig-work|contact|components|pricing|compare-staffing-agency|how-it-works|faq|about-us|for-workers|login|privacy-policy|hirer-terms|gigee-terms|accessibility|404|lp-[a-z0-9-]+)\.html$/i, box = null, tm;
    FD.note = function(msg){
      if(!box){ box = doc.createElement('p'); box.className = 'fd-toast'; box.setAttribute('role','status'); box.setAttribute('aria-live','polite'); doc.body.appendChild(box); }
      box.textContent = ''; clearTimeout(tm);
      requestAnimationFrame(function(){ box.textContent = msg; box.classList.add('is-on'); });
      tm = setTimeout(function(){ box.classList.remove('is-on'); }, 4200);
    };
    doc.addEventListener('click', function(e){
      var a = e.target.closest ? e.target.closest('a[href]') : null; if(!a || e.defaultPrevented) return;
      var href = a.getAttribute('href') || '';
      if(/^mailto:/i.test(href)) return;
      if(href === '#'){ e.preventDefault(); FD.note(FD.MSG_PAGE); return; }
      if(href.charAt(0) === '#') return;
      if(/^https?:/i.test(href)) return;   /* integration: every external link opens (the legal pages cite the FTC, Checkr, Stripe) */
      var file = href.split('#')[0].split('?')[0].replace(/^\.\//,'');
      if(!file || IN.test(file)) return;
      e.preventDefault(); FD.note(FD.MSG_PAGE);
    });
  });

  /* ---- footer: plain headings from 768px; under 768px each column becomes a <details> accordion ---- */
  FD.safe('footer', function(){
    var cols = $('.foot-cols'); if(!cols) return;
    var mq = matchMedia('(max-width: 767px)'), items = [];
    $$(':scope > *', cols).forEach(function(col){ var h = $('h2', col); if(h) items.push({col:col, h:h, d:null}); });
    function wrap(it){
      if(it.d) return;
      var d = doc.createElement('details'), sm = doc.createElement('summary'); d.className = 'foot-acc';
      while(it.col.firstChild) d.appendChild(it.col.firstChild);
      sm.appendChild(it.h); d.insertBefore(sm, d.firstChild); it.col.appendChild(d); it.d = d;
    }
    function unwrap(it){
      if(!it.d) return; var d = it.d, sm = d.firstChild;
      it.col.insertBefore(it.h, d); d.removeChild(sm);
      while(d.firstChild) it.col.insertBefore(d.firstChild, d);
      it.col.removeChild(d); it.d = null;
    }
    function sync(){ items.forEach(mq.matches ? wrap : unwrap); }
    (mq.addEventListener ? mq.addEventListener.bind(mq,'change') : mq.addListener.bind(mq))(sync);
    sync();
  });

  /* ---- year ---- */
  FD.safe('year', function(){ $$('[data-year]').forEach(function(el){ el.textContent = String(new Date().getFullYear()); }); });

  /* ---- menu: one button, one panel. Escape closes and returns focus. ---- */
  FD.safe('menu', function(){
    var nav = $('[data-menu]'); if(!nav) return;
    var btn = $('[data-menu-btn]', nav), panel = doc.getElementById(btn.getAttribute('aria-controls'));
    function set(open){
      nav.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    }
    btn.addEventListener('click', function(){ set(!nav.classList.contains('is-open')); });
    doc.addEventListener('keydown', function(e){ if(e.key==='Escape' && nav.classList.contains('is-open')){ set(false); btn.focus(); } });
    panel.addEventListener('click', function(e){ if(e.target.closest('a')) set(false); });
    doc.addEventListener('click', function(e){ if(nav.classList.contains('is-open') && !nav.contains(e.target)) set(false); });
    var wide = matchMedia('(min-width: 1280px)');
    (wide.addEventListener ? wide.addEventListener.bind(wide,'change') : wide.addListener.bind(wide))(function(){ if(wide.matches) set(false); });
  });

  /* ---- header: hairline once scrolled. One filled primary per view: the header's primary stays outlined while the
     hero's own primary (or a section/final-band primary, desktop) is on screen, and fills once none is.
     Phones (under 768px, every page): the header button is always outlined; the sticky bar carries the filled ask. ---- */
  FD.safe('header', function(){
    var nav = $('.site-nav'), post = $('[data-head-post]'), hero = $('[data-hero]');
    if(nav){
      var onScroll = function(){ nav.classList.toggle('is-scrolled', (window.scrollY||0) > 4); };
      window.addEventListener('scroll', onScroll, {passive:true}); onScroll();
    }
    if(!post) return;
    /* integration: a page for another audience (For workers) keeps the hirer's header button outlined */
    if(doc.body.hasAttribute('data-head-outline')) return;
    if(!('IntersectionObserver' in window)){ post.classList.add('is-filled'); return; }
    var heroBtn = hero && $('.btn--primary', hero), phone = matchMedia('(max-width: 767px)');
    var watch = []; if(heroBtn) watch.push(heroBtn);
    $$('.sec-cta.btn--primary, [data-cta-final] .btn--primary').forEach(function(b){ if(watch.indexOf(b) < 0) watch.push(b); });
    if(!watch.length){ post.classList.add('is-filled'); return; }
    function paint(){
      var any = watch.some(function(b){ return b._in && (b === heroBtn || !b.classList.contains('sec-cta') || !phone.matches); });
      post.classList.toggle('is-filled', !any && !phone.matches);
    }
    (phone.addEventListener ? phone.addEventListener.bind(phone,'change') : phone.addListener.bind(phone))(paint);
    var hh = nav ? nav.offsetHeight : 76;
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target._in = e.isIntersecting; }); paint(); }, {rootMargin:'-'+hh+'px 0px 0px 0px'});
    watch.forEach(function(b){ b._in = false; io.observe(b); });
    paint();
  });

  /* ---- mbar (L15): job = keep the ask in reach on a phone without covering the final CTA, the footer or a playing
     walkthrough (its part counter, Pause and Replay sit at the frame's foot). It appears once the hero's own buttons have
     left the screen. body.has-mbar lets CSS keep one filled primary per view. ---- */
  FD.safe('mbar', function(){
    var bar = $('.mbar'); if(!bar || !('IntersectionObserver' in window)) return;
    /* red team C2-2: a page without [data-hero] (For workers keeps its header button outlined) names its start with [data-mbar-after] */
    var hero = $('[data-mbar-after]') || $('[data-hero]'), heroBtns = hero && $('.btn-row', hero), past = !hero, zones = 0;
    var mq = matchMedia('(max-width: 767px)');
    function paint(){
      var on = past && zones === 0 && mq.matches && !root.classList.contains('capture');
      bar.classList.toggle('is-shown', on); doc.body.classList.toggle('has-mbar', on);
      bar.setAttribute('aria-hidden', on ? 'false' : 'true'); $$('a', bar).forEach(function(a){ a.tabIndex = on ? 0 : -1; });
    }
    /* integration: measured on scroll, not by an observer, so a hero whose buttons start below the first screen (Pricing)
       still counts as passed once they scroll away */
    if(hero){ var tgt = heroBtns || hero, upd = function(){ var p = tgt.getBoundingClientRect().bottom < 0; if(p !== past){ past = p; paint(); } };
      window.addEventListener('scroll', upd, {passive:true}); upd(); }
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ var was = e.target._in; e.target._in = e.isIntersecting; if(was !== e.isIntersecting) zones += e.isIntersecting ? 1 : (was ? -1 : 0); }); zones = Math.max(0, zones); paint(); }, {threshold:0});
    [$('[data-cta-final]'), $('[data-mbar-stop]'), $('.site-foot'), $('[data-walkthrough] .tour-panels'), $('[data-rate-ask]')].forEach(function(z){ if(z){ z._in = false; io.observe(z); } });
    (mq.addEventListener ? mq.addEventListener.bind(mq,'change') : mq.addListener.bind(mq))(paint);
    paint();
  });

  /* ---- accordion (L13): job = let a busy owner scan six questions. Answers are in the HTML. ---- */
  FD.safe('accordion', function(){
    $$('[data-accordion]').forEach(function(acc){
      $$('.faq-q', acc).forEach(function(q){
        var a = doc.getElementById(q.getAttribute('aria-controls'));
        var open = q.getAttribute('aria-expanded') === 'true';
        a.hidden = !open;
        q.addEventListener('click', function(){
          var now = q.getAttribute('aria-expanded') !== 'true';
          q.setAttribute('aria-expanded', now ? 'true' : 'false');
          a.hidden = !now;
          a.classList.toggle('is-in', now);   /* confirms the action: a 0.45s fade-in of the answer */
        });
      });
    });
    /* red team C15: faq.html#fq-pricing-3 (the answer's id) opens that answer and scrolls to its question */
    function openHash(){
      var id = decodeURIComponent(location.hash.slice(1)); if(!id) return;
      var a = doc.getElementById(id); if(!a || !a.classList.contains('faq-a')) return;
      var q = doc.querySelector('.faq-q[aria-controls="'+id+'"]'); if(!q) return;
      q.setAttribute('aria-expanded','true'); a.hidden = false;
      var nav = doc.querySelector('.site-nav'), off = (nav ? nav.offsetHeight : 0) + 24;
      requestAnimationFrame(function(){ window.scrollTo(0, q.getBoundingClientRect().top + window.scrollY - off); });
    }
    openHash(); window.addEventListener('hashchange', openHash); window.addEventListener('load', function(){ setTimeout(openHash, 60); });
  });

  /* ---- tabs (L11): job = show one step at a time. Click, arrows, Home/End; "Next" moves on. Never auto-advances.
     Focus never scrolls the page (preventScroll): Next swaps the panel in place, so the visitor keeps their view. ---- */
  FD.safe('tabs', function(){
    $$('[data-tabs]').forEach(function(box){
      var tabs = $$('[role=tab]', box);
      function select(t, focus){
        tabs.forEach(function(x){
          var on = x === t, p = doc.getElementById(x.getAttribute('aria-controls'));
          x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
          p.hidden = !on; p.classList.toggle('is-in', on);
        });
        if(focus){ try{ t.focus({preventScroll:true}); }catch(e){ var y = window.scrollY; t.focus(); window.scrollTo(window.scrollX, y); } }
      }
      tabs.forEach(function(t, i){
        t.addEventListener('click', function(){ select(t, false); });
        t.addEventListener('keydown', function(e){
          var j = null;
          if(e.key==='ArrowRight'||e.key==='ArrowDown') j = (i+1)%tabs.length;
          else if(e.key==='ArrowLeft'||e.key==='ArrowUp') j = (i-1+tabs.length)%tabs.length;
          else if(e.key==='Home') j = 0; else if(e.key==='End') j = tabs.length-1;
          if(j!==null){ e.preventDefault(); select(tabs[j], true); }
        });
      });
      $$('[data-tab-next]', box).forEach(function(b){
        b.addEventListener('click', function(){ var t = doc.getElementById(b.getAttribute('data-tab-next')); if(t){ select(t, true); } });
      });
    });
  });

  /* ---- quote (L6): job = show what one direct hire would cost for the visitor's role and salary, and name the plan that
     fits. Self-contained in div.qq[data-quote] (shared with direct-hiring.html); works with any role radios whose value is
     a key of FD.PRICES.post, any salary pair ([data-sal-num]/[data-sal-range], or a numeric text input and a range input),
     and an optional "who runs the interviews" pair (radios valued self / managed).
     Q1 answered (2026-10-21): a hire from a paid post owes no placement fee, so the post sits on the one-hire scale as the
     lowest-cost route, beside 8%, 15% and the agency's 20%. The recommendation names both honestly: the post if the role
     fills easily, the placement fee if you want no risk (15% if Jobility does the work). Every number on screen is computed from the ONE salary on screen, every frame: a role change
     tweens the salary (0.45s) and repaints field, header, fees and recommendation from it; slider and typing snap.
     List prices (the post) never count through prices that do not exist: they snap with a short roll. ---- */
  FD.safe('quote', function(){
    $$('[data-quote]').forEach(function(qq){
      var P = FD.PRICES, S = P.salary, DEF = P.salaryByRole || {};
      var radios = $$('input[type=radio]', qq);
      var roles = radios.filter(function(i){ return !!P.post[i.value]; });
      var whos = radios.filter(function(i){ return i.value === 'self' || i.value === 'managed'; });
      var range = $('[data-sal-range]', qq) || $('input[type=range]', qq);
      var num = $('[data-sal-num]', qq) || $('input[inputmode=numeric]', qq);
      var help = $('[data-sal-help]', qq), helpTxt = help ? help.textContent : '';
      var live = $('[data-live]', qq), rec = $('[data-rec]', qq), nurse = $('[data-nurse]', qq), postCta = $('[data-post-cta]', qq);
      var out = {}; $$('[data-out]', qq).forEach(function(el){ out[el.getAttribute('data-out')] = el; });
      var bars = {}; $$('[data-bar]', qq).forEach(function(el){ bars[el.getAttribute('data-bar')] = el; });
      var tiers = $$('[data-tier]', qq);
      var rsel = $('select[name=role]', qq); if(rsel && !P.post[rsel.value]) rsel = null;   /* Buildout A: one-row quick quote */
      var state = { role:'labor', salary:S.start, who:'self' }, shownSal = null, touched = false, lt, tw = {};
      function r10(n){ return Math.round(n/10)*10; }
      function clamp(n){ n = Math.round((+n||0)/S.step)*S.step; return Math.min(S.max, Math.max(S.min, n)); }
      function fmt(n){ return Math.round(n).toLocaleString('en-US'); }
      var money = FD.money;
      function post(){ return P.post[state.role] || P.post.labor; }
      function postTxt(){ var p = post(); return p[0]===p[1] ? money(p[0]) : money(p[0])+' to '+money(p[1]); }
      function roleWords(){ var l = post()[2]; return l === 'IT' ? 'IT' : l.charAt(0).toLowerCase()+l.slice(1); }
      function fees(sal){ var s = r10(sal); return { sal:s, post:post()[1], self:r10(s*P.placement.self), managed:r10(s*P.placement.managed), agency:r10(s*P.agency) }; }
      function recHTML(f){
        return state.who === 'managed'
          ? 'Want us to do the work? <b>The 15% placement fee</b>: <b>'+money(f.managed)+'</b>, only if you hire, and we send you the candidate. Rather post and schedule yourself? Pay per post, '+postTxt()+', with no fee when you hire.'
          : 'Lowest cost if the role fills easily: <b>pay per post, '+postTxt()+'</b>, with no fee when you hire. No risk if you don’t hire: <b>the 8% placement fee</b>, <b>'+money(f.self)+'</b>, only if you hire.';
      }
      function fill(sal){ if(range) range.style.setProperty('--p', ((sal-S.min)/(S.max-S.min)*100)+'%'); }
      /* one frame: everything that depends on salary, from one value */
      function frame(sal){
        var f = fees(sal);
        ['self','managed','agency'].forEach(function(k){ if(out[k]) out[k].textContent = money(f[k]); });
        if(out.salary) out.salary.textContent = money(f.sal);
        if(rec) rec.innerHTML = recHTML(f);
        if(num && doc.activeElement !== num) num.value = fmt(f.sal);
        if(range && doc.activeElement !== range) range.value = f.sal;
        fill(f.sal);
      }
      function roll(el, txt){ if(!el || el.textContent === txt) return; el.textContent = txt; if(FD.reduced()) return; el.classList.remove('is-roll'); void el.offsetWidth; el.classList.add('is-roll'); }
      function paintStatic(){
        var pt = postTxt(), f = fees(state.salary), max = f.agency || 1;
        roll(out.post, pt); roll(out.postbar, pt);
        if(out.postrole) out.postrole.textContent = 'for '+roleWords()+' roles';
        Object.keys(bars).forEach(function(k){ if(f[k] != null) bars[k].style.setProperty('--s', (f[k]/max).toFixed(4)); });
        tiers.forEach(function(t){ var k = t.getAttribute('data-tier'); t.classList.toggle('is-pick', state.who === 'managed' ? k === 'managed' : (k === 'self' || k === 'post')); });
        if(nurse) nurse.hidden = state.role !== 'nursing';
        if(postCta) postCta.textContent = 'Post for '+pt;
        if(range){ range.setAttribute('aria-valuetext', money(state.salary)+' a year'); }
      }
      function announce(){
        clearTimeout(lt);
        lt = setTimeout(function(){
          var f = fees(state.salary), p = post();
          if(live) live.textContent = p[2]+', '+money(f.sal)+' a year. '+'Pay per post: '+postTxt()+', no fee when you hire. '+(state.who === 'managed' ? 'Placement fee, 15%: '+money(f.managed) : 'Placement fee, 8%: '+money(f.self))+', only if you hire. Common agency fee: '+money(f.agency)+'.';
        }, 450);
      }
      function go(how){
        paintStatic();
        var to = state.salary;
        if(how === 'tween' && shownSal !== null && shownSal !== to && !FD.reduced()){
          FD.tween({s:shownSal}, {s:to}, 450, function(v){ shownSal = v.s; frame(v.s); }, tw);
        } else {
          if(tw._tw) cancelAnimationFrame(tw._tw);
          shownSal = to; frame(to);
        }
        if(how) announce();
      }
      function setSalary(v){ state.salary = clamp(v); }
      qq.addEventListener('change', function(e){
        var t = e.target;
        if(roles.indexOf(t) > -1){ state.role = t.value; if(!touched && DEF[state.role]) setSalary(DEF[state.role]); go('tween'); }
        else if(whos.indexOf(t) > -1){ state.who = t.value; go('snap'); }
        else if(rsel && t === rsel){ state.role = rsel.value; if(!touched && DEF[state.role]) setSalary(DEF[state.role]); go('tween'); }
      });
      if(range) range.addEventListener('input', function(){ touched = true; setSalary(range.value); go('snap'); });
      if(num){
        num.addEventListener('input', function(){ var v = +String(num.value).replace(/[^0-9]/g,''); if(!v || v<S.min || v>S.max) return; touched = true; setSalary(v); go('snap'); });
        num.addEventListener('change', function(){
          var raw = +String(num.value).replace(/[^0-9]/g,'') || 0; touched = true; setSalary(raw);
          if(help) help.textContent = raw > S.max ? 'Up to '+money(S.max)+'. We used '+money(S.max)+'.' : raw < S.min ? 'From '+money(S.min)+'. We used '+money(S.min)+'.' : helpTxt;
          num.value = fmt(state.salary); go('snap');
        });
      }
      var checked = roles.filter(function(i){ return i.checked; })[0]; if(checked) state.role = checked.value;
      if(rsel) state.role = rsel.value;
      var w = whos.filter(function(i){ return i.checked; })[0]; if(w) state.who = w.value;
      if(range){ range.min = S.min; range.max = S.max; range.step = S.step; }
      setSalary(DEF[state.role] || (range && range.value) || S.start);
      go(null);
    });
  });

  /* ---- capture check: in ?capture=1, warn about any visible placeholder or production text on the clean page ---- */
  FD.safe('capturecheck', function(){
    if(!root.classList.contains('capture')) return;
    var RX = /\[|\{\{|owed|Kim['’]s|supply item|\bCall\b|1099|ID check/;
    function shown(el){
      if(!el.getClientRects().length) return false;
      for(var e = el; e && e.nodeType === 1; e = e.parentElement){ var cs = getComputedStyle(e); if(cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; }
      return true;
    }
    function run(){
      if(doc.body.classList.contains('show-q')) return;
      /* integration: the library documents these markers on purpose, and the legal text is carried over from jobility.com
         unchanged (counsel review, Q26), so neither is scanned */
      if(doc.body.classList.contains('page-lib')){ root.setAttribute('data-capture-hits', '0'); return; }
      var w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT), t, hits = 0;
      while((t = w.nextNode())){
        var v = t.nodeValue, el = t.parentElement;
        if(!v || !RX.test(v) || !el || /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE)$/.test(el.tagName) || el.closest('[data-fd="legal-text"]') || !shown(el)) continue;
        hits++; console.warn('[FD capture] placeholder text on the clean page: "'+v.replace(/\s+/g,' ').trim().slice(0,100)+'" in <'+el.tagName.toLowerCase()+(el.className ? ' class="'+el.className+'"' : '')+'>');
      }
      $$('a[href^="tel:"], a[data-tel], a[href*="enterprise.jobility.com/signup?"]').forEach(function(a){ hits++; console.warn('[FD capture] link to fix: '+a.getAttribute('href')); });
      root.setAttribute('data-capture-hits', String(hits));
    }
    if(doc.readyState === 'complete') setTimeout(run, 400); else window.addEventListener('load', function(){ setTimeout(run, 400); });
  });

  /* ---- switch: "Workers, not resumes".
     Job = let the owner flip between what a job board sends (a pile) and what Jobility sends (three people).
     User-triggered only. The finished state (Jobility) is the default markup.
     The j line is built from the real card positions, runs down the cards' right edges IN FRONT of them,
     curls under the list and exits right; beads mark each card; the dot sits above the stem like the mark.
     Transitions are CSS (opacity/transform; the line uses stroke-dashoffset on a pathLength=1 path). ---- */
  FD.safe('switch', function(){
    $$('[data-switch]').forEach(function(box){
      var NS = 'http://www.w3.org/2000/svg';
      var sw = $('.switch', box), canvas = $('.sw-canvas', box), svg = $('.sw-line', box), path = $('.fd-draw', svg);
      var dot = $('.fd-dot', svg), beads = $('.sw-beads', svg), grad = $('linearGradient', svg), live = $('.sw-state', box);
      var cards = $$('.sw-card', canvas);
      var TXT = { board: box.getAttribute('data-board-text'), jobility: box.getAttribute('data-jobility-text') };
      function build(){
        var W = canvas.clientWidth, H = canvas.clientHeight; if(!W || !cards.length) return;
        var s = Math.max(.72, Math.min(1, W/620));
        var right = 0; cards.forEach(function(c){ right = Math.max(right, c.offsetLeft + c.offsetWidth); });
        var first = cards[0], last = cards[cards.length-1];
        var x = right - 3, top = first.offsetTop - 26*s, b = last.offsetTop + last.offsetHeight;
        function P(a, c){ return (a).toFixed(1)+' '+(c).toFixed(1); }
        var stem = 'M'+P(x,top)+' C'+P(x+4,top+(b-top)*.4)+' '+P(x+6,b-24)+' '+P(x,b+20*s);
        var d = stem
          +' C'+P(x-6,b+70*s)+' '+P(x-60*s,b+104*s)+' '+P(x-118*s,b+104*s)          /* bottom of the curl, heading left */
          +' C'+P(x-186*s,b+104*s)+' '+P(x-212*s,b+70*s)+' '+P(x-198*s,b+46*s)      /* up the loop's left side */
          +' C'+P(x-182*s,b+22*s)+' '+P(x-96*s,b+28*s)+' '+P(x,b+40*s)              /* the crossbar, crossing the stem */
          +' C'+P(x+70*s,b+48*s)+' '+P(W-40,b+34*s)+' '+P(W-8,b+2*s);              /* the tail sweeps out to the right */
        svg.setAttribute('viewBox','0 0 '+W+' '+H);
        path.setAttribute('d', d); path.setAttribute('stroke-width', (16*s).toFixed(1));
        grad.setAttribute('x1', x); grad.setAttribute('y1', top); grad.setAttribute('x2', W); grad.setAttribute('y2', b+104*s);
        /* the stem's share of the line: the board state draws only the stem */
        var tmp = doc.createElementNS(NS,'path'); tmp.setAttribute('d', stem); svg.appendChild(tmp);
        var frac = tmp.getTotalLength() / path.getTotalLength(); svg.removeChild(tmp);
        canvas.style.setProperty('--stem-off', (1-frac).toFixed(3));
        /* beads: one per card, on the line where it passes the card */
        while(beads.firstChild) beads.removeChild(beads.firstChild);
        cards.forEach(function(c){
          var cy = c.offsetTop + c.offsetHeight/2, b2 = doc.createElementNS(NS,'circle');
          b2.setAttribute('class','fd-node'); b2.setAttribute('cx', x+3); b2.setAttribute('cy', cy); b2.setAttribute('r', (7*s+1).toFixed(1));
          beads.appendChild(b2);
        });
        /* the j's dot: up and left of the stem top, as in the mark */
        dot.setAttribute('cx', (x-20*s).toFixed(1)); dot.setAttribute('cy', (top-30*s).toFixed(1)); dot.setAttribute('r', (13*s).toFixed(1));
      }
      function set(state){
        canvas.setAttribute('data-state', state);
        sw.setAttribute('aria-checked', state === 'jobility' ? 'true' : 'false');
        live.textContent = TXT[state];
      }
      sw.addEventListener('click', function(){ set(canvas.getAttribute('data-state') === 'jobility' ? 'board' : 'jobility'); });
      sw.addEventListener('keydown', function(e){
        if(e.key==='ArrowLeft'||e.key==='Home'){ e.preventDefault(); set('board'); }
        else if(e.key==='ArrowRight'||e.key==='End'){ e.preventDefault(); set('jobility'); }
      });
      build();
      if('ResizeObserver' in window){ var raf; new ResizeObserver(function(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(build); }).observe(canvas); }
      else { window.addEventListener('resize', build); }
      if(doc.fonts && doc.fonts.ready){ doc.fonts.ready.then(build); }
      svg.removeAttribute('hidden');
    });
  });
})();

/* =====================================================================
   Offering-page additions (2026-10-20). Shared, reusable modules:
   seg ........... [data-seg]   segmented radio control (role=radiogroup > role=radio[data-val]).
                                Click, arrows, Home/End. Fires 'fd:seg' {value} on the group.
   prices ........ [data-price] fills a price from FD.PRICES ("post.labor", "post.nursing",
                                "placement.self"...). The static text stays as the no-JS fallback.
   FD.onceInView . plays a callback once when an element is in view (immediately with no IO).
   ===================================================================== */
(function(){
  'use strict';
  var FD = window.FD = window.FD || {}, doc = document;
  var $$ = FD.$$ || function(s,c){ return [].slice.call((c||doc).querySelectorAll(s)); };
  var safe = FD.safe || function(n,f){ try{ f(); }catch(e){ if(window.console) console.warn('[FD] '+n+' off:', e); } };

  FD.onceInView = function(el, fn, threshold){
    if(!el) return;
    if(!('IntersectionObserver' in window)){ fn(); return; }
    var io = new IntersectionObserver(function(es){
      if(es[0].isIntersecting){ io.disconnect(); fn(); }
    }, {threshold: threshold == null ? .35 : threshold});
    io.observe(el);
  };

  safe('seg', function(){
    $$('[data-seg]').forEach(function(g){
      var items = $$('[role=radio]', g);
      function pick(b, focus){
        items.forEach(function(x){ var on = x === b; x.setAttribute('aria-checked', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1; });
        if(focus) b.focus();
        var ev; try{ ev = new CustomEvent('fd:seg', {detail:{value:b.getAttribute('data-val'), el:b}}); }
        catch(e){ ev = doc.createEvent('CustomEvent'); ev.initCustomEvent('fd:seg', false, false, {value:b.getAttribute('data-val'), el:b}); }
        g.dispatchEvent(ev);
      }
      items.forEach(function(b, i){
        b.tabIndex = b.getAttribute('aria-checked') === 'true' ? 0 : -1;
        b.addEventListener('click', function(){ pick(b, false); });
        b.addEventListener('keydown', function(e){
          var j = null, n = items.length;
          if(e.key==='ArrowRight'||e.key==='ArrowDown') j = (i+1)%n;
          else if(e.key==='ArrowLeft'||e.key==='ArrowUp') j = (i-1+n)%n;
          else if(e.key==='Home') j = 0; else if(e.key==='End') j = n-1;
          if(j!==null){ e.preventDefault(); pick(items[j], true); }
        });
      });
    });
  });

  safe('prices', function(){
    var P = FD.PRICES; if(!P) return;
    $$('[data-price]').forEach(function(el){
      var path = el.getAttribute('data-price').split('.'), v = P;
      path.forEach(function(k){ v = v == null ? v : v[k]; });
      if(v == null) return;
      if(Object.prototype.toString.call(v) === '[object Array]'){ el.textContent = v[0]===v[1] ? FD.money(v[0]) : FD.money(v[0])+' to '+FD.money(v[1]); }
      else if(typeof v === 'number'){ el.textContent = v < 1 ? Math.round(v*100)+'%' : FD.money(v); }
    });
  });
})();

/* =====================================================================
   Copy-only page modules (2026-10-20, built with the component library).
   Each one is inert unless its data attribute is on the page. None plays on its own.
   plan ....... [data-plan]   pricing card: the [data-seg] toggle sets data-rate="self|managed";
                              CSS shows the matching [data-v] lines. No JS: both lines show, each labeled.
   ctseg ...... [data-ctseg]  three-column comparison: the [data-seg] picks which Jobility column
                              a phone shows (data-col="managed|self"). Desktop shows all columns.
   calc ....... [data-calc]   fee calculator: salary (number + slider), hires (stepper), agency rate
                              (15 / 20 / 25 or the visitor's own quote, 10 to 35%). Both Jobility rates
                              always show; differences in dollars; tap a figure for its formula; share link
                              (?salary=&hires=&agency=). Rounds to $10. The static worked-examples table is the no-JS version.
   tform ...... [data-tform]  Talk to us: topic radio cards ("Something else" reveals four more),
                              fields shown by [data-show], required only when shown, inline validation
                              on blur and submit, email typo hint (Gmail accepted), error summary,
                              thank-you state in place. data-push="/demo-request/thanks/" pushes the URL.
   jumps ...... [data-jumps]  marks the jump link of the section in view with aria-current="true".
   ===================================================================== */
(function(){
  'use strict';
  var FD = window.FD = window.FD || {}, doc = document;
  var $ = FD.$ || function(s,c){ return (c||doc).querySelector(s); };
  var $$ = FD.$$ || function(s,c){ return [].slice.call((c||doc).querySelectorAll(s)); };
  var safe = FD.safe || function(n,f){ try{ f(); }catch(e){ if(window.console) console.warn('[FD] '+n+' off:', e); } };
  var money = FD.money || function(n){ return '$'+Math.round(n).toLocaleString('en-US'); };

  safe('plan', function(){
    $$('[data-plan]').forEach(function(card){
      var g = $('[data-seg]', card); if(!g) return;
      g.addEventListener('fd:seg', function(e){ card.setAttribute('data-rate', e.detail.value); });
    });
  });

  safe('ctseg', function(){
    $$('[data-ctseg]').forEach(function(w){
      var g = $('[data-seg]', w); if(!g) return;
      g.addEventListener('fd:seg', function(e){ w.setAttribute('data-col', e.detail.value); });
    });
  });

  safe('jumps', function(){
    if(!('IntersectionObserver' in window)) return;
    $$('[data-jumps]').forEach(function(nav){
      var links = $$('a[href^="#"]', nav), map = {};
      links.forEach(function(a){ var t = doc.getElementById(a.getAttribute('href').slice(1)); if(t) map[t.id] = a; });
      var io = new IntersectionObserver(function(es){
        es.forEach(function(e){ if(e.isIntersecting && map[e.target.id]){ links.forEach(function(a){ a.removeAttribute('aria-current'); }); map[e.target.id].setAttribute('aria-current','true'); } });
      }, {rootMargin:'-30% 0px -60% 0px'});
      Object.keys(map).forEach(function(id){ io.observe(doc.getElementById(id)); });
      /* red team B8/C9: back above the first section, no link stays marked */
      var first = links.length && doc.getElementById(links[0].getAttribute('href').slice(1));
      if(first) window.addEventListener('scroll', function(){
        if(window.scrollY + window.innerHeight*0.3 < first.getBoundingClientRect().top + window.scrollY) links.forEach(function(a){ a.removeAttribute('aria-current'); });
      }, {passive:true});
    });
  });

  /* red team C12: the legal pages' "Back to contents" pill hides while the contents list itself is on screen */
  safe('tocback', function(){
    var b = $('.toc-back'), toc = $('.legal-toc'); if(!b || !toc || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function(es){ b.classList.toggle('is-off', es[0].isIntersecting); }).observe(toc);
  });

  /* ---- calc: job = show the gap at the visitor's own salary, honestly (both Jobility rates, the agency's real quote) ---- */
  safe('calc', function(){
    $$('[data-calc]').forEach(function(box){
      var P = FD.PRICES, S = P.salary;
      var num = $('[data-sal-num]', box), range = $('[data-sal-range]', box), hires = $('[data-hires]', box);
      var seg = $('[data-rate-seg]', box), custom = $('[data-custom]', box), cerr = $('[data-custom-err]', box);
      var live = $('[data-live]', box), share = $('[data-share]', box), note = $('[data-share-note]', box), catchEl = $('[data-catch]', box);
      var out = {}; $$('[data-out]', box).forEach(function(el){ out[el.getAttribute('data-out')] = el; });
      var st = { salary:S.start, hires:1, rate:P.agency, own:false }, shown = null, lt;
      function r10(n){ return Math.round(n/10)*10; }
      function pct(r){ return (Math.round(r*1000)/10)+'%'; }
      function clampSal(n){ n = Math.round((+n||0)/S.step)*S.step; return Math.min(S.max, Math.max(S.min, n)); }
      function clampH(n){ n = Math.round(+n||1); return Math.min(50, Math.max(1, n)); }
      function target(){ return { a:r10(st.salary*st.rate*st.hires), m:r10(st.salary*P.placement.managed*st.hires), s:r10(st.salary*P.placement.self*st.hires) }; }
      function diff(d){
        if(Math.abs(d) < 10) return 'About the same as this agency fee.';
        return d > 0 ? '<b>'+money(d)+'</b> less than the agency fee.' : '<b>'+money(-d)+'</b> more than this agency fee.';
      }
      function fx(rate){ return money(st.salary)+' × '+pct(rate)+(st.hires>1 ? ' × '+st.hires+' hires' : '')+' = '+money(r10(st.salary*rate*st.hires)); }
      function paint(v){
        if(out.a) out.a.textContent = money(r10(v.a));
        if(out.m) out.m.textContent = money(r10(v.m));
        if(out.s) out.s.textContent = money(r10(v.s));
        var t = target();
        if(out.dm) out.dm.innerHTML = diff(t.a - t.m);
        if(out.ds) out.ds.innerHTML = diff(t.a - t.s);
        if(out.arate) out.arate.textContent = pct(st.rate);
        /* red team C5: the label says what the rate is */
        if(out.alabel) out.alabel.textContent = st.own ? 'Your agency\u2019s quote' : Math.abs(st.rate - P.agency) < .001 ? 'Most common agency fee' : 'Agency fee';
        if(out.fxa) out.fxa.textContent = fx(st.rate);
        if(out.fxm) out.fxm.textContent = fx(P.placement.managed);
        if(out.fxs) out.fxs.textContent = fx(P.placement.self);
        var max = Math.max(t.a, t.m, t.s) || 1;
        $$('[data-bar]', box).forEach(function(f){ f.style.setProperty('--s', (t[f.getAttribute('data-bar')]/max).toFixed(3)); });
        if(catchEl) catchEl.hidden = !(t.a - t.m < 10);
      }
      function announce(){
        clearTimeout(lt);
        lt = setTimeout(function(){
          var t = target();
          if(live) live.textContent = 'Agency fee at '+pct(st.rate)+': '+money(t.a)+'. Jobility managed, 15%: '+money(t.m)+'. Jobility self-service, 8%: '+money(t.s)+'.';
        }, 450);
      }
      function update(instant){
        var t = target();
        if(range){ range.style.setProperty('--p', ((st.salary-S.min)/(S.max-S.min)*100)+'%'); range.setAttribute('aria-valuetext', money(st.salary)+' a year'); }
        if(instant || !shown){ shown = t; paint(t); }
        else { var from = shown; FD.tween ? FD.tween(from, t, 450, function(v){ shown = v; paint(v); }, box) : paint(t); shown = shown || t; }
        if(!instant) announce();
      }
      function setRateFromSeg(v){ st.rate = +v; st.own = false; if(custom){ custom.value = ''; } if(cerr) cerr.textContent = ''; update(); }
      if(seg) seg.addEventListener('fd:seg', function(e){ setRateFromSeg(e.detail.value); });
      if(custom) custom.addEventListener('input', function(){
        var v = +String(custom.value).replace(/[^0-9.]/g,'');
        if(!custom.value){ if(cerr) cerr.textContent = ''; return; }
        if(!(v >= 10 && v <= 35)){ if(cerr) cerr.textContent = 'Enter a number from 10 to 35.'; return; }
        if(cerr) cerr.textContent = '';
        st.rate = v/100; st.own = true;
        if(seg) $$('[role=radio]', seg).forEach(function(b, i){ b.setAttribute('aria-checked','false'); b.tabIndex = i === 0 ? 0 : -1; });
        update();
      });
      if(range) range.addEventListener('input', function(){ st.salary = clampSal(range.value); if(num) num.value = st.salary.toLocaleString('en-US'); update(); });
      if(num){
        num.addEventListener('input', function(){ var v = +String(num.value).replace(/[^0-9]/g,''); if(!v || v < S.min || v > S.max) return; st.salary = clampSal(v); if(range) range.value = st.salary; update(); });
        num.addEventListener('change', function(){ st.salary = clampSal(String(num.value).replace(/[^0-9]/g,'')); num.value = st.salary.toLocaleString('en-US'); if(range) range.value = st.salary; update(); });
      }
      if(hires){
        hires.addEventListener('change', function(){ st.hires = clampH(hires.value); hires.value = st.hires; update(); });
        $$('[data-step]', box).forEach(function(b){ b.addEventListener('click', function(){ st.hires = clampH(st.hires + (+b.getAttribute('data-step'))); hires.value = st.hires; update(); }); });
      }
      $$('[data-fx]', box).forEach(function(b){
        var p = doc.getElementById(b.getAttribute('aria-controls'));
        b.addEventListener('click', function(){ var on = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', on ? 'true' : 'false'); if(p) p.hidden = !on; });
      });
      function link(){
        var base = location.href.split('#')[0].split('?')[0];
        return base+'?salary='+st.salary+(hires ? '&hires='+st.hires : '')+'&agency='+Math.round(st.rate*100)+'#'+(box.getAttribute('data-anchor') || box.id || 'calculator');
      }
      if(share) share.addEventListener('click', function(){
        var url = link();
        function said(t){ if(note) note.textContent = t; }
        if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(function(){ said(hires ? 'Link copied. It holds only the salary, hires and agency rate.' : 'Link copied. It holds only the salary and agency rate.'); }, function(){ said(url); }); }
        else said(url);
      });
      /* inputs from a shared link */
      try{
        var q = new URLSearchParams(location.search);
        if(q.get('salary')) st.salary = clampSal(q.get('salary'));
        if(q.get('hires')) st.hires = clampH(q.get('hires'));
        if(q.get('agency')){ var a = +q.get('agency'); if(a >= 10 && a <= 35){ st.rate = a/100; var hit = false;
          if(seg) $$('[role=radio]', seg).forEach(function(b){ var on = Math.abs(+b.getAttribute('data-val') - st.rate) < .001; if(on) hit = true; b.setAttribute('aria-checked', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1; });
          if(!hit && custom){ custom.value = a; st.own = true; } } }
      }catch(e){}
      if(range){ range.min = S.min; range.max = S.max; range.step = S.step; range.value = st.salary; }
      if(num) num.value = st.salary.toLocaleString('en-US');
      if(hires) hires.value = st.hires;
      update(true);
    });
  });

  /* ---- tform: job = route the request in one short form; hiring leads to the scheduler, everything else to the right inbox ---- */
  safe('tform', function(){
    $$('[data-tform]').forEach(function(wrap){
      var form = $('form', wrap); if(!form) return;
      var HIRING = {direct:1, temp:1, shift:1, unsure:1}, more = $('[data-more]', form), submit = $('[type=submit]', form);
      var sumBox = $('[data-summary]', form), phone = form.elements.phone, sms = $('[data-sms]', form);
      var touched = {}, tried = false;
      var DOMAINS = ['gmail.com','yahoo.com','hotmail.com','outlook.com','aol.com','icloud.com','comcast.net','verizon.net','msn.com','live.com'];
      function topic(){
        var c = $('input[name=topic]:checked', form); if(!c) return '';
        if(c.value === 'else'){ var o = $('input[name=topic2]:checked', form); return o ? o.value : 'else'; }
        return c.value;
      }
      function path(t){ return HIRING[t] ? 'hiring' : t === 'plan' ? 'plan' : t ? 'other' : ''; }
      function sync(){
        var t = topic(), p = path(t), isElse = !!$('input[name=topic][value=else]:checked', form);
        if(more) more.hidden = !isElse;
        $$('input[name=topic2]', form).forEach(function(i){ i.disabled = !isElse; });
        $$('[data-show]', form).forEach(function(el){
          var keys = el.getAttribute('data-show').split(' '), on = !!t && (keys.indexOf(p) > -1 || keys.indexOf(t) > -1);
          el.hidden = !on;
          $$('input,select,textarea', el).forEach(function(i){ i.disabled = !on; });
        });
        if(submit) submit.textContent = p === 'other' ? 'Send message' : (submit.getAttribute('data-hire-label') || 'See available times');
        if(sms) sms.hidden = !(phone && phone.value.trim());
      }
      function lev(a, b){
        var m = [], i, j; for(i=0;i<=b.length;i++){ m[i] = [i]; } for(j=0;j<=a.length;j++){ m[0][j] = j; }
        for(i=1;i<=b.length;i++){ for(j=1;j<=a.length;j++){ m[i][j] = b.charAt(i-1) === a.charAt(j-1) ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1); } }
        return m[b.length][a.length];
      }
      function suggest(v){
        var at = v.lastIndexOf('@'); if(at < 1) return '';
        var dom = v.slice(at+1).toLowerCase(); if(!dom || DOMAINS.indexOf(dom) > -1) return '';
        var best = '', bd = 3; DOMAINS.forEach(function(d){ var x = lev(dom, d); if(x > 0 && x < bd){ bd = x; best = d; } });
        return best ? v.slice(0, at+1)+best : '';
      }
      var RULES = {
        name: function(v){ return v.trim() ? '' : 'Please enter your name.'; },
        email: function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter an email address, like name@company.com.'; },
        company: function(v){ return v.trim() ? '' : 'Please enter your company name.'; },
        people: function(v){ return v ? '' : 'Please choose how many people you need.'; },
        posts: function(v){ return v ? '' : 'Please choose about how many jobs you post a month.'; },
        zip: function(v){ return /^\d{5}$/.test(v.trim()) ? '' : 'Please enter a 5-digit ZIP code.'; },
        message: function(v){ return v.trim() ? '' : 'Please write your question.'; }
      };
      function fieldOf(el){ return el.closest('.field') || el.closest('fieldset'); }
      function setErr(name, msg){
        var el = form.elements[name], box = $('[data-err="'+name+'"]', form);
        if(box) box.textContent = msg;
        var f = el && (el.length && !el.tagName ? el[0] : el);
        if(f){ var w = fieldOf(f); if(w) w.classList.toggle('is-invalid', !!msg); }
        if(el && el.tagName){ if(msg) el.setAttribute('aria-invalid','true'); else el.removeAttribute('aria-invalid'); }
      }
      function check(name){
        if(name === 'topic'){
          var t = topic(), msg = !t ? 'Choose what we can help with.' : t === 'else' ? 'Choose one of the four options under Something else.' : '';
          setErr('topic', msg); return msg;
        }
        var el = form.elements[name]; if(!el || el.disabled) { setErr(name, ''); return ''; }
        var m = RULES[name] ? RULES[name](el.value || '') : ''; setErr(name, m); return m;
      }
      function emailHint(){
        var el = form.elements.email, box = $('[data-suggest]', form); if(!el || !box) return;
        var s = RULES.email(el.value) ? '' : suggest(el.value.trim());
        box.hidden = !s;
        if(s){ $('[data-suggest-v]', box).textContent = s; box.setAttribute('data-v', s); }
      }
      var FIELDS = ['topic','name','email','company','people','posts','zip','message'];
      form.addEventListener('change', function(e){
        if(e.target.name === 'topic' || e.target.name === 'topic2'){ sync(); if(tried) check('topic'); }
      });
      form.addEventListener('focusout', function(e){
        var n = e.target.name; if(!n || FIELDS.indexOf(n) < 0 || n === 'topic') return;
        touched[n] = true; if(e.target.value || tried) check(n);
        if(n === 'email') emailHint();
      });
      form.addEventListener('input', function(e){
        var n = e.target.name;
        if(n === 'phone' && sms) sms.hidden = !e.target.value.trim();
        if(n && (touched[n] || tried) && $('[data-err="'+n+'"]', form) && $('[data-err="'+n+'"]', form).textContent) check(n);
      });
      var sbtn = $('[data-suggest] button', form);
      if(sbtn) sbtn.addEventListener('click', function(){ var box = $('[data-suggest]', form); form.elements.email.value = box.getAttribute('data-v'); box.hidden = true; check('email'); form.elements.email.focus(); });
      form.addEventListener('submit', function(e){
        e.preventDefault(); tried = true; sync();
        var bad = [];
        FIELDS.forEach(function(n){ var m = check(n); if(m) bad.push([n, m]); });
        if(bad.length){
          if(sumBox){
            var ul = $('ul', sumBox); ul.innerHTML = '';
            bad.forEach(function(b){
              var li = doc.createElement('li'), a = doc.createElement('a'), el = form.elements[b[0]];
              var id = el ? (el.id || (el[0] && el[0].id)) : ''; a.href = '#'+id; a.textContent = b[1];
              a.addEventListener('click', function(ev){ ev.preventDefault(); var t = doc.getElementById(id); if(t) t.focus(); });
              li.appendChild(a); ul.appendChild(li);
            });
            sumBox.hidden = false; sumBox.focus();
          }
          return;
        }
        if(sumBox) sumBox.hidden = true;
        var t = topic(), p = path(t);
        var state = p === 'other' ? (t === 'worker' ? 'worker' : 'message') : 'hiring';
        $$('[data-thanks]', wrap).forEach(function(x){ x.hidden = x.getAttribute('data-thanks') !== state; });
        $$('[data-for]', wrap).forEach(function(x){ var keys = x.getAttribute('data-for').split(' '); x.hidden = keys.indexOf(t) < 0 && !(t === 'unsure' && form.elements.people && form.elements.people.value === '1' && keys.indexOf('solo') > -1); });
        var em = $('[data-echo-email]', wrap); if(em) em.textContent = form.elements.email.value.trim();
        form.hidden = true;
        var shown = $('[data-thanks="'+state+'"]', wrap), h = shown && $('h2,h3', shown);
        if(h){ h.tabIndex = -1; h.focus(); }
        var push = wrap.getAttribute('data-push');
        if(push && window.history && history.pushState){ try{ history.pushState({fd:'thanks'}, '', push); }catch(err){} }
      });
      /* ?topic= pre-selects a card (deck 5.4: ?topic=plan from the Pricing strip) */
      /* Buildout A: ?topic= may also name a "Something else" choice (account, worker, press, other), so the /contact-us/ 301's
         ?topic=other and the form's own value="else" both land on Something else, with the sub-choice picked when given */
      try{ var pre = new URLSearchParams(location.search).get('topic'); if(pre){ var r = $('input[name=topic][value="'+pre+'"]', form), r2 = !r && $('input[name=topic2][value="'+pre+'"]', form);
        if(r) r.checked = true; else if(r2){ var ee = $('input[name=topic][value=else]', form); if(ee){ ee.checked = true; r2.checked = true; } } } }catch(e){}
      /* R9 (contact.html): the request rides on the URL (rate cards: role, zip, len, n, start, end; the healthcare landing:
         src; ads: utm_*). Fields are filled only when empty; the optional details box gets a pre-written line; the
         "What our team receives" card mirrors the form as it changes. Nothing is sent anywhere. */
      var Q = {}; try{ new URLSearchParams(location.search).forEach(function(v, k){ Q[k] = v; }); }catch(e){}
      var ROLE = {cna:'CNA', lpn:'LPN', rn:'RN', 'med-aide':'Med aide', warehouse:'Warehouse associate', picker:'Picker and packer', forklift:'Forklift operator', production:'Production worker', laborer:'General laborer', other:'Another role'};
      var TOPIC = {direct:'A full-time or part-time hire', temp:'Temp or contract workers', shift:'Shift workers', plan:'A subscription or custom plan', unsure:'Not sure which fits', account:'A question about my account', worker:'I work through Jobility', press:'Press or partnerships', other:'Anything else', 'else':'Something else'};
      function fill(name, v){ var el = form.elements[name]; if(el && el.tagName && v != null && v !== '' && !el.value) el.value = v; }
      function day(v){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); if(!m) return ''; try{ return new Date(+m[1], +m[2] - 1, +m[3]).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}); }catch(e){ return v; } }
      ['role','len','n','start','end','src'].forEach(function(k){ fill(k, Q[k]); });
      Object.keys(Q).forEach(function(k){ if(/^utm_[a-z]+$/i.test(k)) fill(k, Q[k]); });
      var landing = ''; try{ landing = sessionStorage.getItem('fd-landing') || ''; }catch(e){}
      fill('landing_page', Q.src || landing);
      if(/^\d{5}$/.test(Q.zip || '')) fill('zip', Q.zip);
      var qn = parseInt(Q.n, 10); if(qn > 0) fill('people', qn <= 1 ? '1' : qn <= 5 ? '2-5' : qn <= 20 ? '6-20' : '20+');
      if(form.elements.details && (Q.role || Q.len || Q.n || Q.start)){
        var bits = [], tp = Q.topic === 'shift' ? 'Shift rate request.' : Q.topic === 'temp' ? 'Temp rate request.' : 'Request.';
        if(ROLE[Q.role]) bits.push('Role: ' + ROLE[Q.role] + '.');
        if(qn > 0) bits.push('People: ' + qn + '.');
        if(Q.len) bits.push('Shift length: ' + parseInt(Q.len, 10) + ' hours.');
        if(day(Q.start)) bits.push('Dates: ' + day(Q.start) + (day(Q.end) ? ' to ' + day(Q.end) : '') + '.');
        fill('details', tp + ' ' + bits.join(' '));
      }
      var sumBoxR = $('[data-tf-sum]', wrap ? wrap.parentNode : doc) || $('[data-tf-sum]'), sumDl = sumBoxR && $('[data-tf-sum-dl]', sumBoxR);
      function summary(){
        if(!sumDl) return;
        var rows = [], t = topic(), v = function(n){ var el = form.elements[n]; return el && el.tagName && !el.disabled ? (el.value || '').trim() : ''; };
        if(t) rows.push(['Request', TOPIC[t] || t]);
        if(ROLE[v('role')]) rows.push(['Role', ROLE[v('role')]]);
        if(/^\d{5}$/.test(v('zip'))) rows.push(['ZIP', v('zip')]);
        var ppl = form.elements.people; if(ppl && !ppl.disabled && ppl.value) rows.push(['People', ppl.options[ppl.selectedIndex].text]);
        if(v('len')) rows.push(['Shift length', parseInt(v('len'), 10) + ' hours']);
        if(day(v('start'))) rows.push(['Dates', day(v('start')) + (day(v('end')) ? ' to ' + day(v('end')) : '')]);
        var src = [v('src') === 'healthcare' ? 'Healthcare page' : v('src'), v('utm_source'), v('utm_campaign')].filter(Boolean);
        if(src.length) rows.push(['Source', src.join(', ')]);
        sumDl.innerHTML = '';
        rows.forEach(function(r){ var dt = doc.createElement('dt'), dd = doc.createElement('dd'); dt.textContent = r[0]; dd.textContent = r[1]; sumDl.appendChild(dt); sumDl.appendChild(dd); });
        sumBoxR.hidden = !rows.length;
      }
      form.addEventListener('change', summary); form.addEventListener('input', summary);
      FD.tfSummary = summary;
      form.setAttribute('novalidate', '');
      sync(); summary();
    });
  });
})();

/* ===== Whimsy P1: the pen (S1), 404 (S2), footer egg (S3), P1 pages ===== */
/* Frogdog, 2026-10-23. Plan: jobility_v1/20261023_Jobility_MotionWhimsy_Plan_v01.md, Package 1. Spliced into site.js by
   _lib/whimsy_p1.py (source: _lib/whimsy_p1.js). Vanilla JS, no GSAP: the Web Animations API and SVG pathLength="1"
   dash offsets. Every module runs inside FD.safe; if one fails, the finished markup stays.

   Contract for Package 2 (names are fixed):
   --ease-land ............ expo.out token in site.css
   FD.reduced() ........... true under prefers-reduced-motion, the site motion switch (localStorage fd-motion = off,
                            html.fd-calm) or ?capture=1 (html.capture)
   FD.setMotion(on) ....... writes localStorage fd-motion ('off' or removed), toggles html.fd-calm, fires 'fd:motion'
                            on document ({detail:{on}}). FD.motionOn() reads it.
   FD.EASE ................ {io, enter, land, exit} as CSS cubic-bezier strings
   FD.drawLine(path, o) ... draws a path once (stroke-dashoffset 1 to 0 via WAAPI) and returns a Promise.
                            o: dur (ms, 700), delay (ms), ease ('io' or a CSS easing), dot (an element that lands
                            after the line: scale .4 to 1, 0.25s expo.out), dotDur, pen (true: the dot rides the line's
                            head, then lands). Reduced: the finished line and dot at once, resolved.
   FD.loopAround(el, o) ... the loop recipe around el's last line box: returns the SVG (svg.fdPath, svg.fdDot,
                            svg.fdBuild). o: host (positioned box the SVG lives in; default el's parent), draw (true: play
                            it now; svg.fdDone is the Promise), dur, delay, dot (false: no dot), tail (false: no tail),
                            fade (true: fade out and remove after drawing), padX, padY, start, sweep, rect (a function
                            returning a viewport rect to loop instead of el's). Held (undrawn) until drawn, unless reduced.

   Modules
   motion ..... html.fd-calm from storage (also set by the head script on P1 pages, before first paint)
   pen ........ text links in content: a 2px stroke draws over the underline on hover or focus, led by a 6px Purpose dot
   thumb ...... .seg: one Night thumb glides under the checked option
   egg ........ footer: the stop after "One portal. Every hire." is a button that turns to the next brand-book line
   greet ...... one console.info for anyone who opens dev tools
   nf ......... 404: the pen loops the best next link ("Looking for {page}?") and lands as the j's dot; a miss draws nothing
   receipt .... contact.html: the pen loops "in touch" in the thank-you heading and lands its dot after the period
   door ....... login.html: remembers which door you used (localStorage fd-door: hire | worker)
   ===================================================================== */
(function(){
  'use strict';
  var FD = window.FD = window.FD || {}, doc = document, root = doc.documentElement, NS = 'http://www.w3.org/2000/svg';
  var $ = FD.$ || function(s,c){ return (c||doc).querySelector(s); };
  var $$ = FD.$$ || function(s,c){ return [].slice.call((c||doc).querySelectorAll(s)); };
  var safe = FD.safe || function(n,f){ try{ f(); }catch(e){ if(window.console) console.warn('[FD] '+n+' off:', e); } };
  function f1(n){ return (Math.round(n*10)/10).toString(); }

  /* ---- motion setting (D2: the switch calms everything, the home hero and walkthrough included) ---- */
  var KEY = 'fd-motion';
  try{ if(localStorage.getItem(KEY) === 'off') root.classList.add('fd-calm'); }catch(e){}
  var rmq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : {matches:true};
  FD.reduced = function(){ return !!rmq.matches || root.classList.contains('fd-calm') || root.classList.contains('capture'); };
  FD.motionOn = function(){ return !root.classList.contains('fd-calm'); };
  FD.setMotion = function(on){
    on = !!on;
    try{ if(on) localStorage.removeItem(KEY); else localStorage.setItem(KEY, 'off'); }catch(e){}
    root.classList.toggle('fd-calm', !on);
    var ev; try{ ev = new CustomEvent('fd:motion', {detail:{on:on}}); }catch(e){ ev = doc.createEvent('CustomEvent'); ev.initCustomEvent('fd:motion', false, false, {on:on}); }
    doc.dispatchEvent(ev);
    return on;
  };

  /* ---- easing (the motion brief's set) ---- */
  FD.EASE = { io:'cubic-bezier(.455,.03,.515,.955)', enter:'cubic-bezier(.215,.61,.355,1)', land:'cubic-bezier(.19,1,.22,1)', exit:'cubic-bezier(.55,.085,.68,.53)' };
  function ease(e){ return FD.EASE[e] || e || FD.EASE.io; }
  /* the same curve in JS, for the pen that rides a line's head */
  function bezFn(css){
    var m = /cubic-bezier\(([^)]+)\)/.exec(css || ''), v = m ? m[1].split(',').map(Number) : [.455,.03,.515,.955];
    function B(s, a, b){ return 3*a*s*(1-s)*(1-s) + 3*b*s*s*(1-s) + s*s*s; }
    return function(t){ var lo = 0, hi = 1, s = t; for(var i = 0; i < 24; i++){ var x = B(s, v[0], v[2]); if(Math.abs(x - t) < 1e-4) break; if(x < t) lo = s; else hi = s; s = (lo + hi) / 2; } return B(s, v[1], v[3]); };
  }

  /* ---- FD.drawLine ---- */
  FD.drawLine = function(path, o){
    o = o || {};
    var dur = o.dur == null ? 700 : o.dur, delay = o.delay || 0, ez = ease(o.ease), dot = o.dot || null, dotDur = o.dotDur == null ? 250 : o.dotDur;
    if(!path.getAttribute('pathLength')) path.setAttribute('pathLength', '1');
    path.style.strokeDasharray = '1 1';
    function finished(){ path.style.strokeDashoffset = '0'; path.style.opacity = ''; if(dot){ dot.style.opacity = '1'; dot.style.transform = ''; } }
    if(FD.reduced() || !path.animate){ finished(); return Promise.resolve(); }
    path.style.strokeDashoffset = '1'; path.style.opacity = '0'; if(dot) dot.style.opacity = '0';
    return new Promise(function(res){
      var end = false, g = dot && o.pen ? dot.parentNode : null, fin = g ? g.getAttribute('transform') : null, last = null;
      /* opacity rides along: a round cap would otherwise show a zero-length dot before the line starts */
      var a = path.animate([{strokeDashoffset:1, opacity:0, offset:0},{opacity:1, offset:.01},{strokeDashoffset:0, opacity:1, offset:1}], {duration:dur, delay:delay, easing:ez, fill:'both'});
      if(g && window.requestAnimationFrame){
        var L = path.getTotalLength(), ef = bezFn(ez), t0 = null;
        var step = function(ts){
          if(end) return; if(t0 === null) t0 = ts;
          var t = (ts - t0 - delay) / dur; if(t < 0){ requestAnimationFrame(step); return; }
          var p = path.getPointAtLength(L * ef(Math.min(1, t))); last = p;
          g.setAttribute('transform', 'translate(' + f1(p.x) + ' ' + f1(p.y) + ')'); dot.style.opacity = '1'; dot.style.transform = 'scale(.6)';
          if(t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      a.onfinish = function(){
        end = true; path.style.strokeDashoffset = '0'; path.style.opacity = ''; a.cancel();
        if(!dot){ res(); return; }
        var from = 'scale(.4)', op = 0;
        if(g){   /* the pen lifts off the line's head and lands on its dot */
          g.setAttribute('transform', fin);
          var m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(fin || ''), dx = 0, dy = 0;
          if(m && last){ dx = last.x - (+m[1]); dy = last.y - (+m[2]); }
          from = 'translate(' + f1(dx) + 'px,' + f1(dy) + 'px) scale(.6)'; op = 1;
        }
        dot.style.opacity = '1'; dot.style.transform = '';
        var d = dot.animate([{transform:from, opacity:op},{transform:'none', opacity:1}], {duration:dotDur, easing:FD.EASE.land});
        d.onfinish = function(){ res(); };
      };
      a.oncancel = function(){ if(!end){ finished(); res(); } };
    });
  };

  /* ---- loop geometry (plan 5, "Loop shape"): a hand-drawn ellipse around a box, starting lower left, overshooting its
     start by about 20% of the perimeter, out into a short tail up and to the right, then the j's dot ---- */
  var STOPS = '<stop offset="0" stop-color="#FF9241"/><stop offset=".3" stop-color="#FF6634"/><stop offset=".65" stop-color="#FF3B58"/><stop offset="1" stop-color="#D3005B"/>';
  FD.loopGeo = function(b, o){
    o = o || {};
    var px = o.padX == null ? 10 : o.padX, py = o.padY == null ? 8 : o.padY;
    var cx = b.l + b.w/2, cy = b.t + b.h/2, rx = b.w/2 + px, ry = b.h/2 + py;
    /* o.clear: widen the ellipse until it clears the box's corners (the line never crosses the words) */
    if(o.clear){ var k = 1 - Math.pow(b.h/2/ry, 2); if(k > .05) rx = Math.max(rx, (b.w/2) / Math.sqrt(k) + 2); if(o.maxRx) rx = Math.min(rx, o.maxRx); }
    var start = o.start == null ? 135 : o.start, sweep = o.sweep == null ? 432 : o.sweep, dir = o.dir || -1, tilt = (o.tilt == null ? -2.5 : o.tilt) * Math.PI / 180;
    var n = Math.max(12, Math.ceil(sweep / 22)), pts = [], i;
    for(i = 0; i <= n; i++){
      var u = i / n, a = (start + dir * sweep * u) * Math.PI / 180, g = 1 + (o.grow == null ? .06 : o.grow) * u, x = rx * g * Math.cos(a), y = ry * g * Math.sin(a);
      pts.push([cx + x*Math.cos(tilt) - y*Math.sin(tilt), cy + x*Math.sin(tilt) + y*Math.cos(tilt)]);
    }
    var e = pts[pts.length-1], q = pts[pts.length-2], tx = e[0]-q[0], ty = e[1]-q[1], tl = Math.sqrt(tx*tx + ty*ty) || 1; tx /= tl; ty /= tl;
    if(o.tail !== false){
      /* the tail bends from the line's direction toward up and to the right */
      var ux = .8, uy = -.6, k = o.tailLen || 16;
      var t1 = [e[0] + (tx*.7 + ux*.3) * k*.5, e[1] + (ty*.7 + uy*.3) * k*.5], t2 = [e[0] + (tx*.35 + ux*.65) * k, e[1] + (ty*.35 + uy*.65) * k];
      pts.push(t1, t2); e = t2; q = t1; tx = e[0]-q[0]; ty = e[1]-q[1]; tl = Math.sqrt(tx*tx + ty*ty) || 1; tx /= tl; ty /= tl;
    }
    var gap = o.dotGap == null ? 8 : o.dotGap;
    return { pts:pts, d:FD.crPath(pts), dot:[e[0] + tx*gap, e[1] + ty*gap], end:e, cx:cx, cy:cy, rx:rx, ry:ry };
  };
  /* Catmull-Rom through the points, as cubic curves */
  FD.crPath = function(p, noMove){
    var d = noMove ? '' : 'M' + f1(p[0][0]) + ' ' + f1(p[0][1]);
    for(var i = 0; i < p.length - 1; i++){
      var p0 = p[i-1] || p[i], p1 = p[i], p2 = p[i+1], p3 = p[i+2] || p2;
      d += ' C' + f1(p1[0] + (p2[0]-p0[0])/6) + ' ' + f1(p1[1] + (p2[1]-p0[1])/6) + ' ' + f1(p2[0] - (p3[0]-p1[0])/6) + ' ' + f1(p2[1] - (p3[1]-p1[1])/6) + ' ' + f1(p2[0]) + ' ' + f1(p2[1]);
    }
    return d;
  };
  var LN = 0;
  /* an empty loop SVG in a host: <svg class="fd-loop"><defs>gradient</defs><path/><g><circle/></g></svg> */
  FD.loopSvg = function(host, o){
    o = o || {};
    if(getComputedStyle(host).position === 'static') host.classList.add('fd-loop-host');
    var id = 'fdl' + (++LN), svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'fd-loop' + (o.cls ? ' ' + o.cls : '')); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.innerHTML = '<defs><linearGradient id="' + id + '" gradientUnits="userSpaceOnUse">' + STOPS + '</linearGradient></defs>'
      + '<path class="fd-loop-path" pathLength="1" stroke="url(#' + id + ')"/>'
      + (o.dot === false ? '' : '<g class="fd-loop-end"><circle class="fd-loop-dot" r="4"/></g>');
    host.appendChild(svg);
    svg.fdPath = svg.querySelector('path'); svg.fdDot = svg.querySelector('circle'); svg.fdGrad = svg.querySelector('linearGradient');
    if(!FD.reduced() && o.held !== false){ svg.fdPath.style.strokeDashoffset = '1'; svg.fdPath.style.opacity = '0'; if(svg.fdDot) svg.fdDot.style.opacity = '0'; }
    return svg;
  };
  FD.loopPaint = function(svg, d, x0, x1, dot){
    svg.fdPath.setAttribute('d', d);
    svg.fdGrad.setAttribute('x1', f1(x0)); svg.fdGrad.setAttribute('x2', f1(Math.max(x1, x0 + 1))); svg.fdGrad.setAttribute('y1', '0'); svg.fdGrad.setAttribute('y2', '0');
    if(svg.fdDot && dot){ svg.fdDot.parentNode.setAttribute('transform', 'translate(' + f1(dot[0]) + ' ' + f1(dot[1]) + ')'); svg.fdDot.setAttribute('r', innerWidth < 768 ? '3' : '4'); }
  };
  /* a viewport rect relative to a host's padding box */
  FD.relRect = function(r, host){ var h = host.getBoundingClientRect(); return {l:r.left - h.left - host.clientLeft, t:r.top - h.top - host.clientTop, w:r.width, h:r.height, r:r.right - h.left - host.clientLeft, b:r.bottom - h.top - host.clientTop}; };
  /* the text's own line boxes (an inline-flex link's box is 44px tall; its words are not) */
  FD.textRects = function(el){ var r = doc.createRange(); r.selectNodeContents(el); return [].slice.call(r.getClientRects()).filter(function(x){ return x.width > 1; }); };
  FD.loopAround = function(el, o){
    o = o || {};
    var host = o.host || el.parentElement, svg = FD.loopSvg(host, o);
    function build(){
      if(!host.clientWidth || !el.getClientRects().length) return;
      var rs = o.rect ? [o.rect()] : FD.textRects(el); if(!rs.length) rs = el.getClientRects();
      var b = FD.relRect(rs[rs.length-1], host), oo = {}; for(var k in o) oo[k] = o[k];
      /* never past the viewport: narrow the side pad if the loop would cross the edge */
      var hl = host.getBoundingClientRect().left + host.clientLeft, room = Math.min(b.l + hl, innerWidth - (b.r + hl)) - 6;
      if(oo.padX == null) oo.padX = Math.max(3, Math.min(10, room - 4 - (o.tail === false ? 0 : 6)));
      var g = FD.loopGeo(b, oo), xs = g.pts.map(function(p){ return p[0]; });
      FD.loopPaint(svg, g.d, Math.min.apply(null, xs), Math.max.apply(null, xs), g.dot);
    }
    build(); svg.fdBuild = build;
    if('ResizeObserver' in window){ var raf; new ResizeObserver(function(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(build); }).observe(host); }
    else window.addEventListener('resize', build);
    if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(build);
    if(o.draw){
      svg.fdDone = FD.drawLine(svg.fdPath, {dur:o.dur == null ? 650 : o.dur, delay:o.delay || 0, dot:svg.fdDot, dotDur:o.dotDur, pen:o.pen}).then(function(){
        if(!o.fade) return;
        if(FD.reduced() || !svg.animate){ if(svg.parentNode) svg.parentNode.removeChild(svg); return; }
        var a = svg.animate([{opacity:1},{opacity:0}], {duration:150, easing:FD.EASE.exit, fill:'forwards'});
        return new Promise(function(r){ a.onfinish = function(){ if(svg.parentNode) svg.parentNode.removeChild(svg); r(); }; });
      });
    }
    return svg;
  };

  /* ---- pen: text links in content. The resting underline stays; on hover or focus a 2px stroke in the link's own
     color draws over it, led by a 5px dot that fades as it arrives (CSS, site.css "Whimsy P1"). Multi-line links get
     the 2px underline only. Not the header, footer, menus, aria-current links, buttons, the home hero or the walkthrough. ---- */
  safe('pen', function(){
    var EX = '.site-util,.site-nav,.site-foot,.menu-panel,.lp-head,.lp-foot,.mbar,.hh,#hero,[data-walkthrough],[data-switch],.fd-toast,.confirm[data-clean],.lib-toc,.crumbs';
    var marked = [];
    $$('main a:not(.btn), .tlink, .links-row a').forEach(function(a){
      if(a._fdPen || a.classList.contains('btn') || a.hasAttribute('aria-current') || a.closest(EX)) return;
      if(a.querySelector('img,svg,picture,div,p,ul,ol,h2,h3,h4,.btn')) return;
      var cs = getComputedStyle(a); if(String(cs.textDecorationLine || cs.textDecoration).indexOf('underline') < 0) return;
      if(/rgba\([^)]*,\s*0\)$/.test(cs.textDecorationColor) || cs.textDecorationColor === 'transparent') return;   /* no resting underline: it has its own hover rule */
      if(!/^(inline|inline-flex|flex|inline-block|none)$/.test(cs.display)) return;   /* none: shown at another width */
      a._fdPen = 1; var s = doc.createElement('span'); s.className = 'fd-pen-ink';
      while(a.firstChild) s.appendChild(a.firstChild);
      a.appendChild(s); a.classList.add('fd-pen-a'); marked.push(a);
    });
    /* the stroke sits exactly on the underline: baseline (a zero-size probe) + the link's own underline offset */
    function mark(){
      var probes = marked.map(function(a){ var s = a.firstChild; if(!s || s.className !== 'fd-pen-ink') return null; var i = doc.createElement('i'); i.className = 'fd-pen-bl'; s.insertBefore(i, s.firstChild); return i; });
      var out = marked.map(function(a, k){
        var i = probes[k]; if(!i) return null; var s = a.firstChild, sr = s.getBoundingClientRect(), lh = parseFloat(getComputedStyle(s).lineHeight) || 24;
        var off = parseFloat(getComputedStyle(a).textUnderlineOffset); if(isNaN(off)) off = 3;
        return { y:i.getBoundingClientRect().top - sr.top + off - .25, multi:s.getClientRects().length > 1 || sr.height > lh * 1.5 };
      });
      probes.forEach(function(i){ if(i && i.parentNode) i.parentNode.removeChild(i); });
      out.forEach(function(o, k){ if(!o) return; var a = marked[k]; a.firstChild.style.setProperty('--pen-y', o.y.toFixed(2) + 'px'); a.classList.toggle('is-multi', o.multi); });
    }
    mark(); var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(mark, 150); });
    if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(mark);
  });

  /* (the button tap dot was cut after the whimsy review, 2026-10-23: nobody could see it under a finger or a click) */

  /* ---- thumb: .seg (not the home hero picker). One Night thumb glides under the checked option; the text color
     swaps at the midpoint. Re-measured on resize, font load and any aria-checked change. ---- */
  safe('thumb', function(){
    $$('.seg').forEach(function(g){
      if(g.closest('.hh, [data-walkthrough]') || g._fdThumb) return; g._fdThumb = 1;
      var th = doc.createElement('span'); th.className = 'fd-thumb'; th.setAttribute('aria-hidden', 'true');
      g.insertBefore(th, g.firstChild); g.classList.add('fd-has-thumb');
      var last = null;
      function place(anim){
        var b = g.querySelector('[aria-checked="true"]');
        if(!b){ th.style.opacity = '0'; last = null; return; }
        if(!b.offsetWidth) return;
        var x = b.offsetLeft, y = b.offsetTop, w = b.offsetWidth, h = b.offsetHeight, prev = last;
        last = {x:x, y:y, w:w};
        th.style.width = w + 'px'; th.style.height = h + 'px'; th.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        var was = th.style.opacity; th.style.opacity = '1';
        if(anim && prev && was !== '0' && th.animate && !FD.reduced() && (prev.x !== x || prev.w !== w)){
          th.animate([{transform:'translate(' + prev.x + 'px,' + prev.y + 'px) scaleX(' + (prev.w / w).toFixed(4) + ')'},{transform:'translate(' + x + 'px,' + y + 'px) scaleX(1)'}], {duration:200, easing:FD.EASE.enter});
        }
      }
      place(false);
      new MutationObserver(function(){ place(true); }).observe(g, {attributes:true, subtree:true, attributeFilter:['aria-checked']});
      if('ResizeObserver' in window) new ResizeObserver(function(){ place(false); }).observe(g); else window.addEventListener('resize', function(){ place(false); });
      if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function(){ place(false); });
    });
  });

  /* ---- egg (S3): the stop after the footer line is a button. Each press swaps in the next line from Jobility's own
     brand book (checked word for word against the Brand Framework PDF, pages 13, 14, 15, 30 and 33), loops its key word
     once and fades the loop away (no dot left behind). Back to the start after the last. Reduced: instant swap, no loop. ---- */
  safe('egg', function(){
    var line = $('.site-foot .foot-line'); if(!line || line._fdEgg) return;
    var txt = line.textContent.replace(/\s+/g, ' ').trim(); if(!/\.$/.test(txt)) return;
    line._fdEgg = 1;
    var LINES = [[txt.slice(0, -1), 'hire'],   /* one key word per line, like the others (review: the two-word loop clipped "hire") */
                 ['Strike a match', 'match'], ['Work is where the heart is', 'heart'], ['Outward mobility', 'mobility'], ['Bring work to life', 'life']];
    var i = 0, busy = false;
    line.textContent = '';
    var t = doc.createElement('span'); t.className = 'fd-egg-t';
    var b = doc.createElement('button'); b.type = 'button'; b.className = 'fd-egg'; b.textContent = '.';
    b.setAttribute('aria-label', 'Another line from the Jobility brand book');
    line.appendChild(t); line.appendChild(b); line.setAttribute('aria-live', 'polite');
    function fill(k){
      var L = LINES[k], at = L[0].lastIndexOf(L[1]);
      t.textContent = '';
      t.appendChild(doc.createTextNode(L[0].slice(0, at)));
      var w = doc.createElement('span'); w.className = 'fd-egg-w'; w.textContent = L[1]; t.appendChild(w);
      if(at + L[1].length < L[0].length) t.appendChild(doc.createTextNode(L[0].slice(at + L[1].length)));
      return w;
    }
    fill(0);
    /* a line that would not fit where the footer line sits now is skipped, so the footer never reflows (phones) */
    function fits(k){
      var m = doc.createElement('span'); m.className = 'fd-egg-measure'; m.setAttribute('aria-hidden', 'true'); m.textContent = LINES[k][0] + '.';
      line.appendChild(m); var w = m.getBoundingClientRect().width; line.removeChild(m);
      var pr = line.parentElement.getBoundingClientRect(), lr = line.getBoundingClientRect(), ps = getComputedStyle(line.parentElement);
      return w <= pr.right - (parseFloat(ps.paddingRight) || 0) - lr.left + .5;
    }
    b.addEventListener('click', function(){
      if(busy) return;
      for(var n = 0; n < LINES.length; n++){ i = (i + 1) % LINES.length; if(i === 0 || fits(i)) break; }
      if(FD.reduced() || !t.animate){ fill(i); return; }
      busy = true;
      var out = t.animate([{opacity:1},{opacity:0}], {duration:150, easing:FD.EASE.exit, fill:'forwards'});
      out.onfinish = function(){
        var w = fill(i); out.cancel();
        t.animate([{opacity:0},{opacity:1}], {duration:200, easing:FD.EASE.enter});
        var em = parseFloat(getComputedStyle(line).fontSize) || 16;   /* review: 0.12em each side, 0.08em top and bottom more, so it clears the word's own letters */
        var svg = FD.loopAround(w, {host:line, draw:true, dur:650, dot:false, tail:false, fade:true, sweep:390, padX:1 + .12 * em, padY:7 + .08 * em, grow:.015, tilt:0, cls:'fd-egg-loop'});
        (svg.fdDone || Promise.resolve()).then(function(){ busy = false; });
        setTimeout(function(){ busy = false; }, 1200);
      };
    });
  });

  /* ---- greet: one line for anyone who opens dev tools ---- */
  safe('greet', function(){ if(window.console && console.info && !FD._greeted){ FD._greeted = 1; var u = 'for-workers.html'; try{ u = new URL('for-workers.html', location.href).href; }catch(e){} console.info('Hi from the Jobility team. Looking for work? ' + u); } });

  /* ---- nf (S2): the 404 loops the best next link. The inline script in 404.html picks it before first paint (the IA's
     301 list, then the nearest page slug) and puts "Looking for {page}?" first in the link row. 0.4s after load the pen
     loops it (0.65s) and lands as the j's Purpose dot (0.25s). The ellipse clears the words' corners, never crosses the
     viewport edge or the next link. A miss draws nothing: the buttons are already the answer. (Review 2026-10-23: the
     routed line from the H1's stop read as a flowchart, so it was dropped at every width.) Reduced, ?capture=1 or the
     motion switch: drawn and still. No JS: no loop, the links are already there. ---- */
  safe('nf', function(){
    var sec = $('.fd-nf'), tgt = sec && $('.fd-nf-hit', sec); if(!tgt) return;
    var host = $('.wrap', sec) || sec, svg = FD.loopSvg(host, {cls:'fd-nf-line'});
    function build(){
      if(!host.clientWidth) return;
      var tr = FD.relRect(FD.textRects(tgt)[0] || tgt.getBoundingClientRect(), host), hostVL = host.getBoundingClientRect().left + host.clientLeft;
      var cx = tr.l + tr.w / 2, hw = tr.w / 2, hh = tr.h / 2;
      var room = Math.min(cx + hostVL - 6, innerWidth - (cx + hostVL) - 6), sib = tgt.nextElementSibling;
      if(sib){ var n = FD.textRects(sib)[0]; if(n){ n = FD.relRect(n, host); if(Math.abs(n.t - tr.t) < 4) room = Math.min(room, n.l - cx - 4); } }
      var rx = Math.min(hw + 16, room / 1.06), ry = Math.max(hh + 8, hh / Math.sqrt(Math.max(.12, 1 - Math.pow(hw / rx, 2))) + 2);
      var g = FD.loopGeo({l:tr.l, t:tr.t, w:tr.w, h:tr.h}, {start:-90, dir:-1, sweep:400, tail:false, padX:rx - hw, padY:ry - hh, tilt:0, grow:.03, dotGap:9});
      FD.loopPaint(svg, g.d, g.cx - g.rx * 1.03, g.cx + g.rx * 1.03, g.dot);
      svg.setAttribute('data-route', 'loop');
    }
    build();
    if('ResizeObserver' in window){ var raf; new ResizeObserver(function(){ cancelAnimationFrame(raf); raf = requestAnimationFrame(build); }).observe(host); }
    if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(build);
    function go(){ build(); FD.drawLine(svg.fdPath, {dur:650, dot:svg.fdDot, pen:true, dotDur:250}); }
    if(FD.reduced()){ FD.drawLine(svg.fdPath, {dot:svg.fdDot}); return; }
    if(doc.readyState === 'complete') setTimeout(go, 400); else window.addEventListener('load', function(){ setTimeout(go, 400); });
  });

  /* ---- receipt: contact.html. When "Thanks. We'll be in touch." is shown, the pen loops "in touch" (the last line's box
     if the heading wraps) and lands its dot after the period. 0.15s after the reveal; loop 0.65s, dot 0.25s. ---- */
  safe('receipt', function(){
    $$('[data-thanks]').forEach(function(box){
      var h = $('.h-sub', box); if(!h) return;
      function wrap(){
        if(h._fdW) return h._fdW;
        var w = doc.createTreeWalker(h, NodeFilter.SHOW_TEXT), n;
        while((n = w.nextNode())){
          var at = n.nodeValue.indexOf('in touch'); if(at < 0) continue;
          var tail = n.splitText(at); tail.splitText(8);
          var s = doc.createElement('span'); s.className = 'fd-loop-word'; tail.parentNode.insertBefore(s, tail); s.appendChild(tail);
          return (h._fdW = s);
        }
        return null;
      }
      new MutationObserver(function(){
        if(box.hidden || h._fdLoop) return;
        var s = wrap(); if(!s) return; h._fdLoop = 1;
        setTimeout(function(){ var em = parseFloat(getComputedStyle(h).fontSize) || 24;
          /* review: about 0.1em on the left (0.12em, 16px up and down, no tilt) so it clears both "be" and "in"; the box takes in the period (+0.4em) so the right side clears "h" and the dot lands after the stop */
          FD.loopAround(s, {host:h, draw:true, dur:650, dotDur:250, padX:.12 * em, padY:16, tilt:0, grow:.02, cls:'fd-receipt', rect:function(){ var rs = FD.textRects(s), r = rs[rs.length-1]; return {left:r.left, top:r.top, width:r.width + .4 * em, height:r.height, right:r.right + .4 * em, bottom:r.bottom}; }}); }, FD.reduced() ? 0 : 150);
      }).observe(box, {attributes:true, attributeFilter:['hidden']});
    });
  });

  /* ---- door: login.html remembers the door (one word in localStorage). The inline script in login.html shows
     "Welcome back." and the phone order before first paint; this only records the choice. ---- */
  safe('door', function(){
    if(!$('.fd-login')) return;
    $$('.fd-login a[data-audience]').forEach(function(a){
      a.addEventListener('click', function(){ try{ localStorage.setItem('fd-door', a.getAttribute('data-audience') === 'worker' ? 'worker' : 'hire'); }catch(e){} });
    });
  });
})();
/* ===== /Whimsy P1 ===== */
