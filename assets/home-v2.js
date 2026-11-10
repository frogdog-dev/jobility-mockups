/* Jobility Home, Funnel + visual pass (Nov 2026): the hero's rotating role word, now a loop (Adam asked for it; the only
   loop on the site, dated decision in DESIGN.md "Funnel + visual pass (A)").
   Job: embellish the message, not replace it. The H1 reads "Hire vetted full-time staff." in the markup (the anchor, the
   finished picture: no JS, reduced motion, fd-calm, the site motion switch off, ?capture=1 all show it static, with no timers
   and no pause button). With motion allowed, after 1.6s the word steps through [data-rotate]: each word goes out in 0.26s
   (up, ease-in), comes in from below in 0.32s (ease-out) and holds 2.4s, with the brand swash redrawn under it (0.5s).
   Back on the anchor ("full-time staff") it holds 6s, then goes round again (one cycle is about 54s).
   Pause, not stop: hover or focus inside the H1 pauses on the current word and it resumes 1.2s after mouseleave / focusout
   (the next word follows 1.2s after any resume);
   a hidden tab or the hero out of view pauses and it resumes when visible again. Escape or the visible pause button
   (button.fv-rot-toggle, WCAG 2.2.2) pause until Play is pressed; that choice is kept for the session (sessionStorage fd-rot=off).
   The word line is one nowrap line of its own and the stop travels inside the word, so nothing around it moves (CLS 0);
   the button sits at the end of the anchor's width, so it never moves with the word.
   Screen readers: the rotator is aria-hidden and the H1's accessible text is "Hire vetted full-time staff." (no aria-live).
   Hooks: .fd-rotate (the word box), .fd-rotate-w (the word), .fd-swash (the line under it), .fv-rot-toggle (pause/play). */
(function(){
  'use strict';
  var doc = document, root = doc.documentElement;
  var box = doc.querySelector('.fd-rotate'); if(!box) return;
  var w = box.querySelector('.v2-word'), sw = box.querySelector('.fd-swash'), rw = box.querySelector('.fd-rotate-w');
  var h1 = box.closest('h1') || box, wrap = h1.parentNode && h1.parentNode.classList.contains('fv-h1-wrap') ? h1.parentNode : h1;
  var btn = wrap.querySelector('.fv-rot-toggle');
  var words = (box.getAttribute('data-rotate') || '').split('|').filter(Boolean);
  function calm(){ return (window.FD && FD.reduced) ? FD.reduced() : (!window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches); }
  if(words.length < 2 || calm() || root.classList.contains('capture')) return;

  var HOLD = 2400, ANCHOR_HOLD = 6000, FIRST = 1600, OUT = 260, RESUME = 1200;
  var i = 0, t = 0, rt = 0, swapping = false;
  var why = {};   /* pause reasons: hover, focus, hidden, offscreen, user */
  function decode(s){ var d = doc.createElement('textarea'); d.innerHTML = s; return d.value; }
  words = words.map(decode);
  function paused(){ for(var k in why) if(why[k]) return true; return false; }
  function draw(){ if(!sw) return; sw.classList.remove('is-drawn'); void sw.getBoundingClientRect(); sw.classList.add('is-drawn'); }
  function set(word){
    w.innerHTML = ''; w.appendChild(doc.createTextNode(word));
    var s = doc.createElement('span'); s.className = 'stop'; s.textContent = '.'; w.appendChild(s);
  }
  function holdFor(idx){ return idx === 0 ? ANCHOR_HOLD : HOLD; }
  function schedule(ms){ clearTimeout(t); if(!paused()) t = setTimeout(step, ms); }
  function step(){
    if(paused()) return;
    var next = (i + 1) % words.length;
    swapping = true; box.classList.add('is-out');
    t = setTimeout(function(){
      i = next; set(words[i]);
      box.classList.remove('is-out'); box.classList.add('is-in'); void w.offsetWidth; box.classList.remove('is-in');
      swapping = false; draw();
      schedule(holdFor(i));
    }, OUT);
  }
  function pause(k){ why[k] = true; clearTimeout(rt); if(!swapping) clearTimeout(t); }
  function resume(k, delay){
    var was = why[k]; why[k] = false;
    if(!was) return;   /* not paused for this reason: leave the running timer alone */
    clearTimeout(rt);
    if(paused()) return;
    rt = setTimeout(function(){ if(!paused()) schedule(RESUME); }, delay || 0);   /* the word has already been read: move on 1.2s after resuming */
  }

  /* the pause button: shown only when the loop can run; placed at the end of the anchor's width on the word line */
  var KEY = 'fd-rot';
  function remembered(){ try{ return sessionStorage.getItem(KEY) === 'off'; }catch(e){ return false; } }
  function remember(off){ try{ off ? sessionStorage.setItem(KEY, 'off') : sessionStorage.removeItem(KEY); }catch(e){} }
  function paint(){
    if(!btn) return; var off = !!why.user;
    btn.classList.toggle('is-paused', off);
    btn.setAttribute('aria-label', off ? 'Play the changing words' : 'Pause the changing words');
  }
  function place(){
    if(!btn) return;
    var probe = doc.createElement('span'); probe.className = 'v2-word'; probe.setAttribute('aria-hidden', 'true');
    probe.style.cssText = 'position:absolute;visibility:hidden;left:0;top:0;white-space:nowrap';
    probe.innerHTML = words[0].replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }) + '<span class="stop">.</span>';
    rw.appendChild(probe);
    var pw = probe.getBoundingClientRect().width; rw.removeChild(probe);
    var wr = wrap.getBoundingClientRect(), br = box.getBoundingClientRect();
    var x = br.left - wr.left + pw + 10, y = br.top - wr.top + (br.height - 28) / 2;
    var max = wr.width - 30; if(x > max) x = max;
    wrap.style.setProperty('--rot-x', x.toFixed(1) + 'px'); wrap.style.setProperty('--rot-y', y.toFixed(1) + 'px');
  }
  if(btn){
    btn.hidden = false; place();
    var ro; window.addEventListener('resize', function(){ clearTimeout(ro); ro = setTimeout(place, 120); });
    if(doc.fonts && doc.fonts.ready) doc.fonts.ready.then(place);
    btn.addEventListener('click', function(){
      if(why.user){ remember(false); resume('user', 0); }
      else { remember(true); pause('user'); }
      paint();
    });
  }
  if(remembered()){ why.user = true; }
  paint();

  /* hover and focus pause; leaving resumes after 1.2s. Hovering the button counts as inside; focusing it does not. */
  wrap.addEventListener('mouseenter', function(){ pause('hover'); });
  wrap.addEventListener('mouseleave', function(){ resume('hover', RESUME); });
  wrap.addEventListener('focusin', function(e){ if(e.target !== btn) pause('focus'); });   /* focus on the toggle itself is not a pause: Play must play */
  wrap.addEventListener('focusout', function(e){ if(e.relatedTarget && wrap.contains(e.relatedTarget)) return; resume('focus', RESUME); });
  doc.addEventListener('keydown', function(e){ if(e.key === 'Escape' || e.key === 'Esc'){ if(!why.user){ remember(true); pause('user'); paint(); } } });
  doc.addEventListener('visibilitychange', function(){ doc.hidden ? pause('hidden') : resume('hidden', 400); });
  window.addEventListener('fd:motion', function(){
    if(calm()){ pause('calm'); clearTimeout(t); i = 0; set(words[0]); box.classList.remove('is-out', 'is-in'); if(btn) btn.hidden = true; }
    else { if(btn){ btn.hidden = false; place(); } resume('calm', 600); }
  });
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){ es.forEach(function(e){ e.isIntersecting ? resume('offscreen', 400) : pause('offscreen'); }); }, {threshold:0}).observe(h1);
  }
  box.classList.add('is-live');
  /* v4 (2026-11-09): the hero animation ("Dot finds three", hero-dot.js) plays first; the word and its swash wait for it
     (html[data-hd="play"] while it runs; 'fd:herodot' when it ends), so only one thing moves at a time. */
  if(root.getAttribute('data-hd') === 'play'){
    var go = false, begin = function(){ if(go) return; go = true; draw(); schedule(900); };
    window.addEventListener('fd:herodot', begin); setTimeout(begin, 9000);
  } else { draw(); schedule(FIRST); }
})();
