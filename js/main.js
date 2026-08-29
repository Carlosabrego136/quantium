(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var desktopMedia = window.matchMedia("(min-width: 721px)");
  var isDesktop = desktopMedia.matches;

  /* ---------------------------------------------------------
     Responsive backgrounds — desktop gets the HD "-pc" images,
     mobile/tablet keeps the portrait originals. Swapped by JS
     so each device only ever downloads the version it needs.
  --------------------------------------------------------- */
  var bgSwapEls = Array.prototype.slice.call(document.querySelectorAll("[data-bg-desktop]"));

  function applyResponsiveBackgrounds() {
    var desktop = desktopMedia.matches;
    bgSwapEls.forEach(function (el) {
      var src = desktop ? el.getAttribute("data-bg-desktop") : el.getAttribute("data-bg-mobile");
      if (src) {
        el.style.backgroundImage = "url('" + src + "')";
      }
    });
  }
  applyResponsiveBackgrounds();

  var bgResizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(bgResizeTimer);
    bgResizeTimer = setTimeout(applyResponsiveBackgrounds, 200);
  });

  /* ---------------------------------------------------------
     Nav: scrolled state + mobile toggle
  --------------------------------------------------------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.querySelector(".nav-links");

  function onScrollNav() {
    if (window.scrollY > 12) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------------------------------------------------
     Parallax — text, headings, cards and floating accents still
     drift a little at their own speed as the page scrolls.
     Background photos no longer move (kept static on every
     device, per request). Desktop only; mobile keeps everything
     static per brief.

     Positions are measured once (on load/resize) and cached as
     a document-relative offset, instead of calling
     getBoundingClientRect() on every scroll frame. Re-reading
     layout on every frame was the main-thread cost that made
     scrolling feel stuttery and starved other work (like the
     matrix-rain interval) of time to run. With cached positions,
     each scroll frame only does cheap arithmetic.
  --------------------------------------------------------- */
  var elLayers = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var ticking = false;
  var elMeasure = [];

  // Text/cards move a little less than before, per request.
  var ELEMENT_DAMPING = 0.55;

  function measure(list) {
    return list.map(function (el) {
      var rect = el.getBoundingClientRect();
      return { docTop: rect.top + window.scrollY, height: rect.height };
    });
  }

  function remeasureParallax() {
    elMeasure = measure(elLayers);
  }

  function updateParallax() {
    var vh = window.innerHeight;
    var scrollY = window.scrollY;

    elLayers.forEach(function (el, i) {
      var speed = (parseFloat(el.getAttribute("data-speed")) || 0.04) * ELEMENT_DAMPING;
      var m = elMeasure[i];
      var top = m.docTop - scrollY;
      var offset = (top + m.height / 2 - vh / 2) * speed;
      el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
    });

    ticking = false;
  }

  function requestParallax() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  if (isDesktop && !reduceMotion && elLayers.length) {
    remeasureParallax();
    updateParallax();
    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", function () {
      remeasureParallax();
      requestParallax();
    });
    window.addEventListener("load", function () {
      remeasureParallax();
      requestParallax();
    });
  }

  /* ---------------------------------------------------------
     Reveal on scroll
  --------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(".card, .feature, .step, .fit-card, .layer, .founder-block, .faq-item");
  if ("IntersectionObserver" in window && revealTargets.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealTargets.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 0.08 + "s";
      io.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------------------------------------------------
     Live monitoring counter (decorative HUD readout)
  --------------------------------------------------------- */
  var counterEl = document.getElementById("liveCounter");
  if (counterEl && !reduceMotion) {
    var base = 4812106;
    setInterval(function () {
      base += Math.floor(Math.random() * 4) + 1;
      counterEl.textContent = base.toLocaleString("es-MX").replace(/,/g, " ");
    }, 2200);
  }

  /* ---------------------------------------------------------
     Threat-detection demo loop
  --------------------------------------------------------- */
  var demoWindow = document.getElementById("demoWindow");
  if (demoWindow) {
    var alertOn = false;
    function toggleDemo() {
      alertOn = !alertOn;
      demoWindow.classList.toggle("is-alert", alertOn);
    }
    if (!reduceMotion) {
      setInterval(toggleDemo, 3600);
    }
  }

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }

  /* ---------------------------------------------------------
     Matrix-style code rain — fixed, full-page ambient backdrop.
     Cyan/teal glyphs (letters, digits, hex) drift downward with
     fading trails, giving every "black zone" of the site a
     living cybersecurity texture instead of flat black.
  --------------------------------------------------------- */
  var matrixCanvas = document.getElementById("matrixCanvas");
  if (matrixCanvas && !reduceMotion) {
    var mctx = matrixCanvas.getContext("2d");
    var glyphs = "01ABCDEF{}<>/\\#$%&QUANTIUM01アイウエオカキクケコ01".split("");
    var fontSize = 15;
    var columns = 0;
    var drops = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function sizeMatrixCanvas() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      matrixCanvas.width = w * dpr;
      matrixCanvas.height = h * dpr;
      matrixCanvas.style.width = w + "px";
      matrixCanvas.style.height = h + "px";
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      columns = Math.ceil(w / fontSize);
      var prevDrops = drops;
      drops = [];
      for (var i = 0; i < columns; i++) {
        drops[i] = prevDrops[i] !== undefined ? prevDrops[i] : Math.floor(Math.random() * -40);
      }
    }
    sizeMatrixCanvas();

    var matrixResizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(matrixResizeTimer);
      matrixResizeTimer = setTimeout(sizeMatrixCanvas, 200);
    });

    function drawMatrix() {
      var w = window.innerWidth;
      var h = window.innerHeight;

      mctx.fillStyle = "rgba(4,8,13,0.16)";
      mctx.fillRect(0, 0, w, h);

      mctx.font = fontSize + "px 'JetBrains Mono', monospace";
      for (var i = 0; i < columns; i++) {
        var text = glyphs[Math.floor(Math.random() * glyphs.length)];
        var x = i * fontSize;
        var y = drops[i] * fontSize;

        if (y >= 0) {
          mctx.fillStyle = "rgba(190,255,250,0.85)";
          mctx.fillText(text, x, y);
          mctx.fillStyle = "rgba(95,212,255,0.45)";
          mctx.fillText(text, x, y - fontSize);
        }

        if (y > h && Math.random() > 0.975) {
          drops[i] = Math.floor(Math.random() * -20);
        }
        drops[i]++;
      }
    }

    var matrixFrameGap = isDesktop ? 60 : 140;
    var matrixLastDraw = 0;
    var matrixRafId = null;

    function matrixLoop(ts) {
      if (!matrixLastDraw || ts - matrixLastDraw >= matrixFrameGap) {
        drawMatrix();
        matrixLastDraw = ts;
      }
      matrixRafId = window.requestAnimationFrame(matrixLoop);
    }
    matrixRafId = window.requestAnimationFrame(matrixLoop);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (matrixRafId) window.cancelAnimationFrame(matrixRafId);
        matrixRafId = null;
      } else if (!matrixRafId) {
        matrixLastDraw = 0;
        matrixRafId = window.requestAnimationFrame(matrixLoop);
      }
    });
  }

  /* ---------------------------------------------------------
     Security constellation — sparse glowing nodes drifting
     slowly, with faint threads linking nearby points. Reads as
     a quiet "network map" ambience rather than a busy effect;
     density and speed stay low on purpose.
  --------------------------------------------------------- */
  var networkCanvas = document.getElementById("networkCanvas");
  if (networkCanvas && !reduceMotion) {
    var nctx = networkCanvas.getContext("2d");
    var nDpr = Math.min(window.devicePixelRatio || 1, 2);
    var nodes = [];
    var nodeColors = ["95,212,255", "232,185,94"];
    var linkDist = 0;

    function sizeNetworkCanvas() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      networkCanvas.width = w * nDpr;
      networkCanvas.height = h * nDpr;
      networkCanvas.style.width = w + "px";
      networkCanvas.style.height = h + "px";
      nctx.setTransform(nDpr, 0, 0, nDpr, 0, 0);

      var density = isDesktop ? 26000 : 42000;
      var count = Math.max(14, Math.min(46, Math.round((w * h) / density)));
      linkDist = Math.min(180, Math.max(110, w / 8));

      nodes = [];
      for (var i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          r: Math.random() * 1.6 + 0.9,
          c: nodeColors[Math.random() < 0.82 ? 0 : 1],
          pulse: Math.random() * Math.PI * 2
        });
      }
    }
    sizeNetworkCanvas();

    var networkResizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(networkResizeTimer);
      networkResizeTimer = setTimeout(sizeNetworkCanvas, 200);
    });

    function drawNetwork() {
      var w = window.innerWidth;
      var h = window.innerHeight;
      nctx.clearRect(0, 0, w, h);

      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        a.pulse += 0.02;
        if (a.x < -20) a.x = w + 20;
        if (a.x > w + 20) a.x = -20;
        if (a.y < -20) a.y = h + 20;
        if (a.y > h + 20) a.y = -20;

        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = a.x - b.x;
          var dy = a.y - b.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            var alpha = (1 - dist / linkDist) * 0.16;
            nctx.strokeStyle = "rgba(" + a.c + "," + alpha.toFixed(3) + ")";
            nctx.lineWidth = 1;
            nctx.beginPath();
            nctx.moveTo(a.x, a.y);
            nctx.lineTo(b.x, b.y);
            nctx.stroke();
          }
        }
      }

      for (var k = 0; k < nodes.length; k++) {
        var n = nodes[k];
        var glow = 0.55 + Math.sin(n.pulse) * 0.35;
        nctx.beginPath();
        nctx.fillStyle = "rgba(" + n.c + "," + (0.55 * glow).toFixed(3) + ")";
        nctx.shadowColor = "rgba(" + n.c + ",0.8)";
        nctx.shadowBlur = 6;
        nctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        nctx.fill();
      }
      nctx.shadowBlur = 0;
    }

    var networkRunning = true;
    function networkLoop() {
      if (!networkRunning) return;
      drawNetwork();
      window.requestAnimationFrame(networkLoop);
    }
    networkLoop();

    document.addEventListener("visibilitychange", function () {
      networkRunning = !document.hidden;
      if (networkRunning) networkLoop();
    });
  }

})();
