
  // mobile nav toggle
  (function(){
    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if(!toggle || !links) return;
    toggle.addEventListener('click', function(){
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded','false');
      });
    });
  })();

  // string-lights bulbs along the divider
  (function(){
    var svg = document.querySelector('.lights');
    if(!svg) return;
    var ns = 'http://www.w3.org/2000/svg';
    var g = svg.querySelector('g');
    var path = svg.querySelector('path');
    var len = path.getTotalLength();
    var count = 26;
    for(var i=0;i<count;i++){
      var pt = path.getPointAtLength((len/(count-1))*i);
      var c = document.createElementNS(ns,'circle');
      c.setAttribute('cx', pt.x);
      c.setAttribute('cy', pt.y + 3);
      c.setAttribute('r', 3.2);
      c.setAttribute('fill', i % 2 === 0 ? 'var(--pin)' : 'var(--pin-glow)');
      c.setAttribute('class','bulb');
      g.appendChild(c);
    }
  })();

  // nav shadow + scroll progress bar
  (function(){
    var nav = document.getElementById('nav');
    var bar = document.getElementById('navProgressBar');
    if(!nav || !bar) return;
    var ticking = false;
    function update(){
      ticking = false;
      var scrollY = window.scrollY || document.documentElement.scrollTop;
      nav.classList.toggle('scrolled', scrollY > 8);
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docH > 0 ? Math.min(1, scrollY / docH) : 0;
      bar.style.transform = 'scaleX(' + pct + ')';
    }
    window.addEventListener('scroll', function(){
      if(!ticking){ requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  })();

  // active nav link on scroll
  (function(){
    var links = document.querySelectorAll('.nav-links a[href^="#"]');
    var sections = Array.prototype.map.call(links, function(a){
      return document.querySelector(a.getAttribute('href'));
    }).filter(Boolean);
    if(!sections.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var link = document.querySelector('.nav-links a[href="#' + entry.target.id + '"]');
        if(!link) return;
        if(entry.isIntersecting) links.forEach(function(l){ l.classList.remove('active'); });
        if(entry.isIntersecting) link.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function(s){ io.observe(s); });
  })();

  // reveal-on-scroll
  (function(){
    var els = document.querySelectorAll('.reveal');
    if(!els.length) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced || !('IntersectionObserver' in window)) return;
    els.forEach(function(el){ el.classList.add('pre'); });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('in');
          entry.target.classList.remove('pre');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function(el){ io.observe(el); });
  })();

  // map pins <-> location cards sync
  (function(){
    var pins = document.querySelectorAll('.pin');
    var cards = document.querySelectorAll('.location-card');
    if(!pins.length || !cards.length) return;
    function setActive(city, on){
      pins.forEach(function(p){ if(p.dataset.city === city) p.classList.toggle('hot', on); });
      cards.forEach(function(c){ if(c.dataset.city === city) c.classList.toggle('active', on); });
    }
    pins.forEach(function(p){
      p.addEventListener('pointerenter', function(){ setActive(p.dataset.city, true); });
      p.addEventListener('pointerleave', function(){ setActive(p.dataset.city, false); });
      p.addEventListener('focus', function(){ setActive(p.dataset.city, true); });
      p.addEventListener('blur', function(){ setActive(p.dataset.city, false); });
      p.addEventListener('click', function(){
        var card = document.querySelector('.location-card[data-city="' + p.dataset.city + '"]');
        if(card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      p.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); p.click(); }
      });
    });
    cards.forEach(function(c){
      c.addEventListener('pointerenter', function(){ setActive(c.dataset.city, true); });
      c.addEventListener('pointerleave', function(){ setActive(c.dataset.city, false); });
    });
  })();

  // magnetic tilt on the hero logo (fine pointers only, respects reduced motion)
  (function(){
    var wrap = document.querySelector('.hero-logo-wrap');
    var img = document.querySelector('.hero-logo');
    if(!wrap || !img) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    if(reduced || !fine) return;
    wrap.addEventListener('pointermove', function(e){
      var r = wrap.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      var rotY = px * 16;
      var rotX = -py * 16;
      img.style.transform = 'rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
    });
    wrap.addEventListener('pointerleave', function(){
      img.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  })();

  // gentle snowfall in the hero (respects reduced motion)
  (function(){
    var canvas = document.getElementById('snowCanvas');
    var hero = document.querySelector('.hero');
    if(!canvas || !hero || !canvas.getContext) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced) return;
    var ctx = canvas.getContext('2d');
    var flakes = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w, h, raf;
    function resize(){
      var r = hero.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function makeFlake(){
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1 + Math.random() * 2.2,
        vy: 0.3 + Math.random() * 0.6,
        vx: (Math.random() - 0.5) * 0.3,
        o: 0.25 + Math.random() * 0.45
      };
    }
    function init(){
      resize();
      var count = Math.max(12, Math.round((w * h) / 16000));
      flakes = [];
      for(var i = 0; i < count; i++) flakes.push(makeFlake());
    }
    function tick(){
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#fffaf0';
      for(var i = 0; i < flakes.length; i++){
        var f = flakes[i];
        f.y += f.vy;
        f.x += f.vx;
        if(f.y > h + 4){ f.y = -4; f.x = Math.random() * w; }
        if(f.x > w + 4) f.x = -4;
        if(f.x < -4) f.x = w + 4;
        ctx.globalAlpha = f.o;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    }
    init();
    tick();
    window.addEventListener('resize', function(){
      cancelAnimationFrame(raf);
      init();
      tick();
    });
  })();

  // copy phone number
  (function(){
    var btn = document.getElementById('copyPhone');
    var toast = document.getElementById('copyToast');
    if(!btn || !toast) return;
    var hideTimer;
    btn.addEventListener('click', function(){
      var text = '0919 395 440';
      function done(ok){
        toast.textContent = ok ? 'Skopírované do schránky' : 'Nepodarilo sa skopírovať';
        toast.classList.add('show');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function(){ toast.classList.remove('show'); }, 2200);
      }
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(function(){ done(true); }, function(){ done(false); });
      } else {
        done(false);
      }
    });
  })();
