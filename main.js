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
// 3. Dynamic Concave Notch Navigation Capsule with Hover Physics
// ==========================================================================
const initNavigation = () => {
  const header = document.querySelector('.header');
  const capsuleShell = document.getElementById('capsule-shell') || document.querySelector('.unified-nav-capsule');
  const logoHome = document.getElementById('capsule-logo-home');
  const navItemsContainer = document.getElementById('nav-items');
  const navItems = document.querySelectorAll('.nav-item');
  const movingTracker = document.getElementById('moving-tracker');
  const maskCutoutGroup = document.getElementById('mask-cutout-group');
  const floatingIcon = document.getElementById('floating-icon');
  const sections = document.querySelectorAll('section[id]');

  if (!navItemsContainer || !movingTracker || !maskCutoutGroup) return;

  const navIcons = {
    manifesto: '<circle cx="12" cy="7" r="4"></circle><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>',
    about: '<circle cx="12" cy="7" r="4"></circle><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>',
    projects: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>',
    services: '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>',
    contact: '<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>'
  };

  let currentActiveTarget = 'about';

  const positionNotchAtItem = (item) => {
    navItems.forEach((i) => i.classList.remove('is-hovered'));
    if (!item || !capsuleShell) {
      movingTracker.classList.remove('visible');
      maskCutoutGroup.setAttribute('transform', 'translate(-400, 0)');
      return;
    }

    item.classList.add('is-hovered');
    const itemRect = item.getBoundingClientRect();
    const shellRect = capsuleShell.getBoundingClientRect();
    const centerX = (itemRect.left - shellRect.left) + (itemRect.width / 2);

    movingTracker.style.transform = `translateX(${centerX - 46}px)`;
    maskCutoutGroup.setAttribute('transform', `translate(${centerX}, 0)`);
    movingTracker.classList.add('visible');

    const iconType = item.getAttribute('data-icon') || item.getAttribute('data-target');
    if (navIcons[iconType] && floatingIcon) {
      floatingIcon.innerHTML = navIcons[iconType];
    }
  };

  const setActiveTab = (targetId) => {
    currentActiveTarget = targetId;

    if (targetId === 'hero') {
      logoHome?.classList.add('active');
      navItems.forEach((item) => item.classList.remove('active'));
      positionNotchAtItem(null);
      return;
    }

    logoHome?.classList.remove('active');
    let matchedItem = null;
    navItems.forEach((item) => {
      const itemTarget = item.getAttribute('data-target');
      if (itemTarget === targetId) {
        item.classList.add('active');
        matchedItem = item;
      } else {
        item.classList.remove('active');
      }
    });

    if (matchedItem) {
      positionNotchAtItem(matchedItem);
    }
  };

  // Hover transitions: glide notch smoothly to hovered tab, and return to active item on mouseleave
  navItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      positionNotchAtItem(item);
    });

    const link = item.querySelector('.nav-item-link');
    if (link) {
      link.addEventListener('click', (e) => {
        const target = item.getAttribute('data-target');
        setActiveTab(target);
      });
    }
  });

  navItemsContainer.addEventListener('mouseleave', () => {
    navItems.forEach((i) => i.classList.remove('is-hovered'));
    if (currentActiveTarget === 'hero') {
      positionNotchAtItem(null);
    } else {
      const active = document.querySelector('.nav-item.active');
      if (active) positionNotchAtItem(active);
    }
  });

  logoHome?.addEventListener('click', () => {
    setActiveTab('hero');
  });

  // Real-time section tracking on scroll
  const sectionToTabMap = {
    hero: 'hero',
    about: 'about',
    skills: 'about',
    credentials: 'projects',
    projects: 'projects',
    services: 'services',
    faq: 'services',
    contact: 'contact'
  };

  let isTicking = false;
  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 40) {
          header?.classList.add('scrolled');
        } else {
          header?.classList.remove('scrolled');
        }

        const scrollPos = window.scrollY + window.innerHeight * 0.35;
        let currentId = '';

        sections.forEach((sec) => {
          const top = sec.offsetTop;
          const height = sec.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            currentId = sec.getAttribute('id');
          }
        });

        if (currentId) {
          const mappedTarget = sectionToTabMap[currentId] || currentId;
          setActiveTab(mappedTarget);
        }
        isTicking = false;
      });
      isTicking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (currentActiveTarget === 'hero') {
      positionNotchAtItem(null);
    } else {
      const activeItem = document.querySelector('.nav-item.active');
      if (activeItem) positionNotchAtItem(activeItem);
    }
  });

  // Calculate initial position once DOM and fonts are ready
  setTimeout(() => {
    if (window.scrollY < 120) {
      setActiveTab('hero');
    } else {
      const activeItem = document.querySelector('.nav-item.active');
      if (activeItem) positionNotchAtItem(activeItem);
    }
  }, 250);
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
    if (src.endsWith('.svg') || src.includes('.svg')) {
      modalImg.style.width = 'min(88vw, 1100px)';
    } else {
      modalImg.style.width = 'auto';
    }
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
// 12. Asynchronous Contact Form Submission Handler (Web3Forms / owner@yaratul.com)
// 12. Direct Inquiry Form Handler (FormSubmit + Web3Forms Dual Relay)
// ==========================================================================
const initContactForm = () => {
  const form = document.getElementById('direct-inquiry-form');
  const statusMsg = document.getElementById('form-status-msg');
  const submitBtn = document.getElementById('form-submit-btn');
  const btnText = document.getElementById('btn-text');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!submitBtn || !statusMsg) return;

    // Set loading state
    submitBtn.disabled = true;
    const origText = btnText ? btnText.textContent : 'Dispatch Request';
    if (btnText) btnText.textContent = 'Routing Message...';
    statusMsg.className = 'form-status-msg';
    statusMsg.style.display = 'none';

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const accessKeyInput = document.getElementById('web3forms-access-key');
    const accessKey = accessKeyInput ? accessKeyInput.value.trim() : '';
    const hasWeb3Key = accessKey && accessKey !== 'YOUR_ACCESS_KEY_HERE';

    try {
      let sent = false;

      // 1. Attempt Native Serverless Endpoint (/api/contact with Cloudflare R2 Archival)
      try {
        const nativeResponse = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            service: data.service,
            message: data.message
          })
        });

        if (nativeResponse.ok) {
          const nativeResult = await nativeResponse.json();
          if (nativeResult.success) {
            sent = true;
            statusMsg.className = 'form-status-msg success';
            statusMsg.style.display = 'block';
            statusMsg.textContent = '✓ Request dispatched successfully! Your inquiry was sent to owner@yaratul.com. Yaser Ahmmed Ratul will respond within 12 hours.';
            form.reset();
            return;
          }
        }
      } catch (nativeErr) {
        console.warn('Notice: Native /api/contact endpoint bypassed, utilizing direct relay:', nativeErr.message);
      }

      // 2. Direct External Relay Fallback (Web3Forms if key present, else FormSubmit)
      if (hasWeb3Key) {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });
        const result = await response.json();
        if (response.status !== 200 || !result.success) {
          throw new Error(result.message || 'Submission failed.');
        }
      } else {
        const response = await fetch('https://formsubmit.co/ajax/owner@yaratul.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            service: data.service,
            message: data.message,
            _subject: `New Inquiry from ${data.name || 'Client'} (${data.service || 'General'}) — yaratul.com`,
            _replyto: data.email,
            _template: 'table',
            _captcha: 'false'
          })
        });

        const result = await response.json();

        // Check if FormSubmit requires initial one-time activation
        if (result.message && result.message.toLowerCase().includes('activation')) {
          statusMsg.className = 'form-status-msg success';
          statusMsg.style.display = 'block';
          statusMsg.innerHTML = '📬 <strong>One-time verification link sent:</strong> FormSubmit sent an activation email to <strong>owner@yaratul.com</strong>. Please check your inbox and click "Activate Form" once to complete direct routing!';
          form.reset();
          return;
        }

        if (result.success !== 'true' && result.success !== true) {
          throw new Error(result.message || 'Transmission failed.');
        }
      }

      statusMsg.className = 'form-status-msg success';
      statusMsg.style.display = 'block';
      statusMsg.textContent = '✓ Request dispatched successfully! Your inquiry was sent to owner@yaratul.com. Yaser Ahmmed Ratul will respond within 12 hours.';
      form.reset();
    } catch (error) {
      console.error('Contact form transmission error:', error);
      statusMsg.className = 'form-status-msg error';
      statusMsg.style.display = 'block';

      // Smart mailto fallback prefilled with user input
      const mailtoSubject = encodeURIComponent(`Project Inquiry: ${data.service || 'Web Development'}`);
      const mailtoBody = encodeURIComponent(`Name: ${data.name || ''}\nEmail: ${data.email || ''}\nService: ${data.service || ''}\n\nProject Scope:\n${data.message || ''}`);
      const mailtoUrl = `mailto:owner@yaratul.com?subject=${mailtoSubject}&body=${mailtoBody}`;

      statusMsg.innerHTML = `⚠️ Transmission encountered an issue. <a href="${mailtoUrl}" style="text-decoration: underline; font-weight: bold; color: inherit;">Click here to send directly from your email app</a> or reach out on <a href="https://wa.me/8801722081109" target="_blank" style="text-decoration: underline; font-weight: bold; color: inherit;">WhatsApp</a>.`;
    } finally {
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = origText;
    }
  });
};

// ==========================================================================
// 13. Project 3D Flip Card Handler (Mobile Click / Tap & Button Triggers)
// ==========================================================================
const initProjectFlipCards = () => {
  const slides = document.querySelectorAll('.project-rail-slide');

  slides.forEach((slide) => {
    // Tapping the card flips it (unless clicking an actual link or zoom button)
    slide.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('.img-zoom-badge')) {
        return;
      }
      slide.classList.toggle('is-flipped');
    });

    // Explicit flip buttons
    const flipBtns = slide.querySelectorAll('.project-flip-btn');
    flipBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        slide.classList.toggle('is-flipped');
      });
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
  initProjectFlipCards();
  initCounters();
  initFaqAccordion();
  initLightbox();
  initDhakaClock();
  initCookieConsent();
  initGallery();
  initContactForm();
});
