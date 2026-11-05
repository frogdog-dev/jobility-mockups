/* Jobility Home, System v2 (light), Nov 2026: the hero's rotating role word.
   Job: embellish the message, not replace it. The H1 reads "Hire vetted nurses." in the markup (the finished picture: no JS,
   reduced motion, the site motion switch off, ?capture=1). With motion allowed, after 1.6s the role word steps through the list
   in [data-rotate] once (about 2.2s per word, 0.26s out, 0.32s in, transform and opacity only) and comes to rest on the last word;
   each word lands with the brand swash drawn under it (0.5s) and the Purpose dot at its end. It never loops.
   It stops for good on hover or focus inside the H1, on any key press, when the tab is hidden, or when the hero leaves view.
   The word line is one nowrap line of its own and the stop travels inside the word, so nothing around it moves (CLS 0).
   Hooks: .fd-rotate (the word box), .fd-rotate-w (the word), .fd-swash (the line under it). */
(function(){
  'use strict';
  var doc = document, root = doc.documentElement;
  var box = doc.querySelector('.fd-rotate'); if(!box) return;
  var w = box.querySelector('.v2-word'), sw = box.querySelector('.fd-swash');
  var words = (box.getAttribute('data-rotate') || '').split('|').filter(Boolean);
  function calm(){ return (window.FD && FD.reduced) ? FD.reduced() : (!window.matchMedia || matchMedia('(prefers-reduced-motion: reduce)').matches); }
  if(words.length < 2 || calm() || root.classList.contains('capture')) return;
  var HOLD = 2200, OUT = 260, i = 0, t = 0, stopped = false;
  function stop(){ stopped = true; clearTimeout(t); }
  function draw(){
    if(!sw) return;
    sw.classList.remove('is-drawn'); void sw.getBoundingClientRect(); sw.classList.add('is-drawn');
  }
  function set(word){
    w.innerHTML = '';
    w.appendChild(doc.createTextNode(word));
    var s = doc.createElement('span'); s.className = 'stop'; s.textContent = '.'; w.appendChild(s);
  }
  function step(){
    if(stopped) return;
    i++; if(i >= words.length) return;
    box.classList.add('is-out');
    t = setTimeout(function(){
      if(stopped){ box.classList.remove('is-out'); return; }
      set(words[i]);
      box.classList.remove('is-out'); box.classList.add('is-in'); void w.offsetWidth; box.classList.remove('is-in');
      draw();
      if(i < words.length - 1) t = setTimeout(step, HOLD);
    }, OUT);
  }
  var h1 = box.closest('h1') || box;
  h1.addEventListener('mouseenter', stop); h1.addEventListener('focusin', stop);
  doc.addEventListener('keydown', stop, {once:true});
  doc.addEventListener('visibilitychange', function(){ if(doc.hidden) stop(); });
  window.addEventListener('fd:motion', function(){ if(calm()) stop(); });
  if('IntersectionObserver' in window){ new IntersectionObserver(function(es){ es.forEach(function(e){ if(!e.isIntersecting) stop(); }); }).observe(h1); }
  box.classList.add('is-live');
  draw();
  t = setTimeout(step, 1600);
})();
