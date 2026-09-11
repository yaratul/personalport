import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger);

// ==========================================================================
// 1. Lenis Momentum Smooth Scroll Engine
// ==========================================================================
let lenis;
const initSmoothScroll = () => {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);

  // Smooth anchor link scrolling
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          lenis.scrollTo(targetElement, { offset: -60, duration: 1.2 });
          
          // Close mobile menu if open
          const nav = document.querySelector('.nav');
          const mobileToggle = document.querySelector('.mobile-toggle');
          if (nav && nav.classList.contains('active')) {
            nav.classList.remove('active');
            mobileToggle?.classList.remove('active');
          }
        }
      }
    });
  });
};

// ==========================================================================
// 2. Dual-State Adaptive Magnetic Cursor
// ==========================================================================
const initCustomCursor = () => {
  const cursorDot = document.getElementById('cursor-dot');
  const cursorRing = document.getElementById('cursor-ring');
  
  if (!cursorDot || !cursorRing) return;

  if (window.matchMedia('(max-width: 768px)').matches) {
    cursorDot.style.display = 'none';
    cursorRing.style.display = 'none';
    return;
  }

  let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let ringPos = { x: mouse.x, y: mouse.y };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    gsap.set(cursorDot, { x: mouse.x, y: mouse.y });

    // Adaptive contrast detection: check if cursor is hovering over a red section
    const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
    const redSection = elementUnderCursor?.closest('.section-red, .ticker-red, .btn-red');
    if (redSection) {
      document.body.classList.add('cursor-on-red');
    } else {
      document.body.classList.remove('cursor-on-red');
    }
  });

  gsap.ticker.add(() => {
    const dt = 1.0 - Math.pow(0.8, gsap.ticker.deltaRatio());
    ringPos.x += (mouse.x - ringPos.x) * dt;
    ringPos.y += (mouse.y - ringPos.y) * dt;
    gsap.set(cursorRing, { x: ringPos.x, y: ringPos.y });
  });

  // Magnetic Snapping on Interactive Elements
  const hoverElements = document.querySelectorAll('a, button, input, textarea, select, .view-lightbox-trigger, .gallery-card');
  hoverElements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-active');
    });

    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-active');
      gsap.to(el, { x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
    });

    if (el.classList.contains('btn') || el.classList.contains('btn-header-cta')) {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, {
          x: x * 0.28,
          y: y * 0.28,
          duration: 0.2,
          ease: 'power2.out'
        });
      });
    }
  });
};

// ==========================================================================
// 3. Navigation Capsule & Indicator Pill
// ==========================================================================
const initNavigation = () => {
  const header = document.querySelector('.header');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const activePill = document.getElementById('nav-active-pill');
  const navList = document.querySelector('.nav-list');
  const sections = document.querySelectorAll('section[id]');

  const updateActivePill = () => {
    if (window.innerWidth <= 768) {
      if (activePill) activePill.style.display = 'none';
      return;
    }

    if (activePill && navList) {
      const activeLink = document.querySelector('.nav-link.active');
      if (activeLink) {
        activePill.style.display = 'block';
        const activeLinkRect = activeLink.getBoundingClientRect();
        const navListRect = navList.getBoundingClientRect();
        const left = activeLinkRect.left - navListRect.left;
        const width = activeLinkRect.width;
        activePill.style.left = `${left}px`;
        activePill.style.width = `${width}px`;
      } else {
        activePill.style.width = '0px';
      }
    }
  };

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }

    // Active Section Tracking on Scroll
    let currentId = '';
    const scrollPos = window.scrollY + 200;

    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    if (currentId) {
      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href === `#${currentId}`) {
          link.classList.add('active');
        } else if (href.startsWith('#')) {
          link.classList.remove('active');
        }
      });
      updateActivePill();
    }
  });

  mobileToggle?.addEventListener('click', () => {
    mobileToggle.classList.toggle('active');
    nav?.classList.toggle('active');
  });

  window.addEventListener('resize', updateActivePill);
  setTimeout(updateActivePill, 300);
};

const initHeroAnimations = () => {
  const maskedInnerElements = document.querySelectorAll('.hero-main-title .masked-reveal-inner');
  if (maskedInnerElements.length > 0) {
    gsap.from(maskedInnerElements, {
      yPercent: 120,
      duration: 1.15,
      stagger: 0.12,
      ease: 'power4.out',
      delay: 0.1
    });
  }

  // Fade-in elements
  gsap.from('.hero-status-pill, .hero-lead-text, .hero-actions, .hero-metrics-strip', {
    opacity: 0,
    y: 24,
    duration: 1,
    stagger: 0.12,
    ease: 'power3.out',
    delay: 0.3
  });
};

// ==========================================================================
// 5. GSAP Pinned Horizontal Rail for Projects
// ==========================================================================
const initHorizontalProjectsRail = () => {
  const pinWrapper = document.getElementById('projects-pin-wrapper');
  const track = document.getElementById('projects-horizontal-track');

  if (!pinWrapper || !track) return;

  // Horizontal pin only on desktop viewports
  ScrollTrigger.matchMedia({
    "(min-width: 769px)": function() {
      const getScrollAmount = () => {
        const trackWidth = track.scrollWidth;
        return -(trackWidth - window.innerWidth + 120);
      };

      const tween = gsap.to(track, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: pinWrapper,
          start: "top top",
          end: () => `+=${track.scrollWidth - window.innerWidth + 400}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        }
      });

      return () => {
        tween.kill();
      };
    },
    "(max-width: 768px)": function() {
      gsap.set(track, { clearProps: "all" });
    }
  });
};

// ==========================================================================
// 6. Live Counter Scrubbers
// ==========================================================================
const initCounters = () => {
  const counters = document.querySelectorAll('.counter-metric');

  counters.forEach((counter) => {
    const target = parseInt(counter.getAttribute('data-target') || '0', 10);
    const suffix = counter.getAttribute('data-suffix') || '';

    ScrollTrigger.create({
      trigger: counter,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.8,
          ease: 'power3.out',
          onUpdate: () => {
            counter.textContent = Math.floor(obj.val) + suffix;
          }
        });
      }
    });
  });
};

// ==========================================================================
// 7. Client-Intent FAQ Accordion Logic
// ==========================================================================
const initFaqAccordion = () => {
  const faqButtons = document.querySelectorAll('.faq-question-btn');

  faqButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-accordion-item');
      const pane = item?.querySelector('.faq-answer-pane');
      if (!item || !pane) return;

      const isOpen = item.classList.contains('open');

      // Close all items in current group
      const parentGroup = item.closest('.faq-group');
      if (parentGroup) {
        parentGroup.querySelectorAll('.faq-accordion-item').forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.classList.remove('open');
            const otherPane = otherItem.querySelector('.faq-answer-pane');
            if (otherPane) otherPane.style.maxHeight = '0px';
          }
        });
      }

      if (isOpen) {
        item.classList.remove('open');
        pane.style.maxHeight = '0px';
      } else {
        item.classList.add('open');
        pane.style.maxHeight = `${pane.scrollHeight + 30}px`;
      }
      
      ScrollTrigger.refresh();
    });
  });
};

// ==========================================================================
// 8. Interactive Fullscreen Lightbox Modal
// ==========================================================================
const initLightbox = () => {
  const modal = document.getElementById('lightbox-modal');
  const modalImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close-btn');
  const triggers = document.querySelectorAll('.view-lightbox-trigger');

  if (!modal || !modalImg) return;

  const openModal = (src, alt = '') => {
    modalImg.src = src;
    modalImg.alt = alt;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { modalImg.src = ''; }, 300);
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const imgUrl = trigger.getAttribute('data-img');
      const caption = trigger.getAttribute('data-caption') || '';
      if (imgUrl) openModal(imgUrl, caption);
    });
  });

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
};

// ==========================================================================
// 9. Live Dhaka Local Time Indicator
// ==========================================================================
const initDhakaClock = () => {
  const clockEl = document.getElementById('dhaka-clock');
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    // Dhaka is UTC+6
    const options = {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    clockEl.textContent = now.toLocaleTimeString('en-US', options);
  };

  updateClock();
  setInterval(updateClock, 1000);
};

// ==========================================================================
// 10. GDPR / Privacy Cookie Banner
// ==========================================================================
const initCookieConsent = () => {
  const banner = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-accept');
  const declineBtn = document.getElementById('cookie-decline');

  if (!banner) return;

  const consent = localStorage.getItem('yar_cookie_consent');
  if (!consent) {
    setTimeout(() => { banner.classList.add('show'); }, 1500);
  }

  acceptBtn?.addEventListener('click', () => {
    localStorage.setItem('yar_cookie_consent', 'granted');
    banner.classList.remove('show');
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      });
    }
  });

  declineBtn?.addEventListener('click', () => {
    localStorage.setItem('yar_cookie_consent', 'denied');
    banner.classList.remove('show');
  });
};

// ==========================================================================
// 11. Gallery Page Filter Logic (for /gallery)
// ==========================================================================
export const initGallery = () => {
  const filterPills = document.querySelectorAll('.gallery-filter-pill');
  const galleryCards = document.querySelectorAll('.gallery-card');

  if (filterPills.length === 0 || galleryCards.length === 0) return;

  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      filterPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const filter = pill.getAttribute('data-filter');

      galleryCards.forEach((card) => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          gsap.to(card, {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            display: 'block',
            ease: 'power2.out'
          });
        } else {
          gsap.to(card, {
            opacity: 0,
            scale: 0.94,
            duration: 0.3,
            display: 'none',
            ease: 'power2.in'
          });
        }
      });
    });
  });

  // Lightbox click for gallery cards
  galleryCards.forEach((card) => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      const title = card.querySelector('.gallery-card-title')?.textContent || '';
      if (img) {
        const modal = document.getElementById('lightbox-modal');
        const modalImg = document.getElementById('lightbox-img');
        if (modal && modalImg) {
          modalImg.src = img.src;
          modalImg.alt = title;
          modal.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      }
    });
  });
};

// ==========================================================================
// Application Bootstrap
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initCustomCursor();
  initNavigation();
  initHeroAnimations();
  initHorizontalProjectsRail();
  initCounters();
  initFaqAccordion();
  initLightbox();
  initDhakaClock();
  initCookieConsent();
  initGallery();
});
