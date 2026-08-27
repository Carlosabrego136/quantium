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
     Pronounced parallax — layered backgrounds AND individual
     elements (headings, text, cards, floating accents) each
     drift at their own speed as the page scrolls. Desktop
     only; mobile keeps everything static per brief.
  --------------------------------------------------------- */
  var bgLayers = Array.prototype.slice.call(document.querySelectorAll(".parallax-layer"));
  var elLayers = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]"));
  var ticking = false;

  function updateParallax() {
    var vh = window.innerHeight;

    bgLayers.forEach(function (layer) {
      var speed = parseFloat(layer.getAttribute("data-speed")) || 0.15;
      var rect = layer.parentElement.getBoundingClientRect();
      var offset = (rect.top + rect.height / 2 - vh / 2) * speed;
      layer.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0) scale(1.08)";
    });

    elLayers.forEach(function (el) {
      var speed = parseFloat(el.getAttribute("data-speed")) || 0.04;
      var rect = el.getBoundingClientRect();
      var offset = (rect.top + rect.height / 2 - vh / 2) * speed;
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

  if (isDesktop && !reduceMotion && (bgLayers.length || elLayers.length)) {
    updateParallax();
    window.addEventListener("scroll", requestParallax, { passive: true });
    window.addEventListener("resize", requestParallax);
  }

  /* ---------------------------------------------------------
     Reveal on scroll
  --------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(".card, .feature, .step, .fit-card");
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

})();
