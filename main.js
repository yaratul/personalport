import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// ==========================================================================
// 1. Text Scramble Matrix Effect Class
// ==========================================================================
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }
  
  setText(newText) {
    const oldText = this.el.textContent;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20);
      this.queue.push({ from, to, start, end });
    }
    
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  
  update() {
    let output = '';
    let complete = 0;
    
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span style="color: var(--accent-cyan); text-shadow: 0 0 5px var(--accent-cyan);">${char}</span>`;
      } else {
        output += from;
      }
    }
    
    this.el.innerHTML = output;
    
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// ==========================================================================
// 2. Lenis Smooth Scroll Setup
// ==========================================================================
let lenis;
const initLenis = () => {
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
};

// ==========================================================================
// 3. Custom Cursor (Lerped)
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

  let mouse = { x: 0, y: 0 };
  let ringPos = { x: 0, y: 0 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    gsap.set(cursorDot, { x: mouse.x, y: mouse.y });
  });

  gsap.ticker.add(() => {
    const dt = 1.0 - Math.pow(0.82, gsap.ticker.deltaRatio());
    ringPos.x += (mouse.x - ringPos.x) * dt;
    ringPos.y += (mouse.y - ringPos.y) * dt;
    gsap.set(cursorRing, { x: ringPos.x, y: ringPos.y });
  });

  const hoverElements = document.querySelectorAll('.cursor-hover-scale, .cursor-hover-magnetic, a, button, input, textarea, .theme-btn');
  
  hoverElements.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('cursor-active');
    });

    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('cursor-active');
      if (el.classList.contains('cursor-hover-magnetic')) {
        gsap.to(el, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
      }
    });

    if (el.classList.contains('cursor-hover-magnetic')) {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(el, {
          x: x * 0.35,
          y: y * 0.35,
          duration: 0.2,
          ease: 'power2.out'
        });
      });
    }
  });
};

// ==========================================================================
// 4. Navigation Menu & Active Link Tracking
// ==========================================================================
const initNavigation = () => {
  const header = document.querySelector('.header');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section');
  const activePill = document.getElementById('nav-active-pill');
  const navList = document.querySelector('.nav-list');

  const updateActivePill = () => {
    if (window.innerWidth <= 768) {
      if (activePill) activePill.style.display = 'none';
      return;
    }

    if (activePill && navList) {
      activePill.style.display = 'block';
      const activeLink = document.querySelector('.nav-link.active');
      if (activeLink) {
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
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('active');
    nav.classList.toggle('active');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      mobileToggle.classList.remove('active');
      nav.classList.remove('active');

      navLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      updateActivePill();

      const targetId = link.getAttribute('href');
      if (targetId === '#') {
        lenis.scrollTo(0);
      } else {
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
          lenis.scrollTo(targetSection, { offset: -80 });
        }
      }
    });
  });

  const heroCtas = document.querySelectorAll('.hero-ctas a');
  heroCtas.forEach(cta => {
    cta.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = cta.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        lenis.scrollTo(targetSection, { offset: -60 });
      }
    });
  });

  gsap.to('#progress-bar', {
    width: '100%',
    ease: 'none',
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.1
    }
  });

  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: () => {
      let currentSection = '';
      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 120;
        if (window.scrollY >= sectionTop) {
          currentSection = section.getAttribute('id');
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
          link.classList.add('active');
        }
      });

      updateActivePill();
    }
  });

  window.addEventListener('resize', updateActivePill);
  
  // Run initially and after a short delay to account for font loading / rendering
  updateActivePill();
  setTimeout(updateActivePill, 200);
};

// ==========================================================================
// 5. GSAP Scroll Trigger Animations & Interactivity
// ==========================================================================
const initGSAPAnimations = () => {
  // --- Hero Section Initial Reveal ---
  const heroTL = gsap.timeline();
  
  heroTL.to('.title-word', {
    y: '0%',
    duration: 1.2,
    stagger: 0.1,
    ease: 'power4.out'
  });

  heroTL.from('#hero .reveal-fade', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power3.out'
  }, '-=0.8');

  // Parallax / tilt on code card
  const codeCard = document.querySelector('.code-card');
  const heroSection = document.querySelector('.hero-section');
  if (codeCard && heroSection) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(codeCard, {
        rotateY: x * 0.03,
        rotateX: -y * 0.03,
        transformPerspective: 1000,
        ease: 'power2.out',
        duration: 0.5
      });
    });

    heroSection.addEventListener('mouseleave', () => {
      gsap.to(codeCard, {
        rotateY: 0,
        rotateX: 0,
        ease: 'power2.out',
        duration: 0.8
      });
    });
  }

  // --- Scramble Text Event Listeners ---
  const scrambleEls = document.querySelectorAll('.scramble-text');
  scrambleEls.forEach((el) => {
    const originalText = el.getAttribute('data-scramble') || el.textContent;
    const scrambler = new TextScramble(el);
    let isScrambling = false;

    const runScramble = () => {
      if (isScrambling) return;
      isScrambling = true;
      scrambler.setText(originalText).then(() => {
        isScrambling = false;
      });
    };

    el.addEventListener('mouseenter', runScramble);

    // Scramble once when scrolled into view
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: runScramble
    });
  });

  // --- Scroll-triggered Fade Reveals ---
  const fadeReveals = document.querySelectorAll('.about-text-content, .about-photo-wrapper, .skill-card, .timeline-item, .service-card, .contact-info, .contact-form-wrapper');
  fadeReveals.forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // --- Stat Numbers Counter count-up ---
  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach((stat) => {
    const target = parseInt(stat.getAttribute('data-count'), 10);
    gsap.fromTo(stat, 
      { textContent: 0 }, 
      {
        textContent: target,
        duration: 2.2,
        snap: { textContent: 1 },
        ease: 'power3.out',
        scrollTrigger: {
          trigger: stat,
          start: 'top 85%'
        }
      }
    );
  });

  // --- Skill Bars Animation ---
  const skillCards = document.querySelectorAll('.skill-card');
  skillCards.forEach((card) => {
    const fills = card.querySelectorAll('.skill-level-fill');
    
    gsap.fromTo(fills, 
      { width: '0%' },
      {
        width: (i, el) => el.style.width || '100%',
        duration: 1.5,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: card,
          start: 'top 85%'
        }
      }
    );
  });

  // --- Experience Timeline Path Drawing ---
  const timelineSVG = document.querySelector('.timeline-line-svg');
  const activePath = document.querySelector('.timeline-path-active');
  if (timelineSVG && activePath) {
    const pathLength = activePath.getTotalLength();
    
    gsap.set(activePath, {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength
    });

    gsap.to(activePath, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: '.timeline-container',
        start: 'top 30%',
        end: 'bottom 70%',
        scrub: true
      }
    });
  }

  // --- Projects Horizontal Scroll ---
  const projectTrack = document.querySelector('.projects-horizontal-track');
  const stickyWrapper = document.querySelector('.projects-sticky-wrapper');

  if (projectTrack && stickyWrapper) {
    let mm = gsap.matchMedia();
    
    mm.add("(min-width: 769px)", () => {
      const scrollWidth = projectTrack.scrollWidth;
      const viewWidth = window.innerWidth;
      const amountToScroll = scrollWidth - viewWidth;

      gsap.to(projectTrack, {
        x: -amountToScroll,
        ease: 'none',
        scrollTrigger: {
          trigger: '.projects-section',
          pin: true,
          scrub: 1,
          start: 'top top',
          end: () => `+=${amountToScroll}`,
          invalidateOnRefresh: true
        }
      });
    });
    
    mm.add("(max-width: 768px)", () => {
      // Revert track transform and clear properties
      gsap.set(projectTrack, { clearProps: "all" });
    });
  }

  // --- Services 3D Card Hover / Tilt Effect ---
  const serviceCards = document.querySelectorAll('.service-card');
  serviceCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);

      const rotateX = -(y - rect.height / 2) / (rect.height / 10);
      const rotateY = (x - rect.width / 2) / (rect.width / 10);

      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 600,
        duration: 0.3,
        ease: 'power2.out'
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: 'power2.out'
      });
    });
  });

  // --- Skills Card Hover Glow coordinates ---
  const skCards = document.querySelectorAll('.skill-card');
  skCards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--x', `${x}px`);
      card.style.setProperty('--y', `${y}px`);
    });
  });

  // --- Profile Photo Hover 3D Tilt & coordinate shift ---
  const profileCard = document.getElementById('profile-image-card');
  if (profileCard) {
    // Reveal image clipping path on scroll trigger
    gsap.fromTo(profileCard, 
      { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.15 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        scale: 1,
        duration: 1.4,
        ease: 'power4.inOut',
        scrollTrigger: {
          trigger: '.about-photo-wrapper',
          start: 'top 85%'
        }
      }
    );

    profileCard.addEventListener('mousemove', (e) => {
      const rect = profileCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const rotateX = -(y - rect.height / 2) / (rect.height / 8); 
      const rotateY = (x - rect.width / 2) / (rect.width / 8);
      
      gsap.to(profileCard, {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 800,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      const frame = profileCard.querySelector('.profile-img-frame');
      if (frame) {
        gsap.to(frame, {
          x: (x - rect.width / 2) * 0.15,
          y: (y - rect.height / 2) * 0.15,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    });
    
    profileCard.addEventListener('mouseleave', () => {
      gsap.to(profileCard, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.6,
        ease: 'power2.out'
      });
      const frame = profileCard.querySelector('.profile-img-frame');
      if (frame) {
        gsap.to(frame, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: 'power2.out'
        });
      }
    });
  }
};

// ==========================================================================
// 6. Accent Color Toggler Logic (GSAP Color Variable Animation)
// ==========================================================================
const initThemeSwitcher = () => {
  const switcher = document.getElementById('theme-switcher');
  if (!switcher) return;
  
  const buttons = switcher.querySelectorAll('.theme-btn');
  
  const themes = {
    cyan: { primary: '#00f0ff', secondary: '#3b82f6' },
    emerald: { primary: '#10b981', secondary: '#059669' },
    magenta: { primary: '#d946ef', secondary: '#8b5cf6' },
    amber: { primary: '#f59e0b', secondary: '#d97706' }
  };
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const themeKey = btn.getAttribute('data-theme');
      const theme = themes[themeKey];
      
      if (theme) {
        // Animate CSS variables smoothly using GSAP!
        gsap.to(':root', {
          '--accent-cyan': theme.primary,
          '--accent-blue': theme.secondary,
          duration: 0.8,
          ease: 'power2.out'
        });
        
        // Brief pulse highlight on switcher container border/boxShadow
        gsap.fromTo(switcher, 
          { borderColor: 'var(--accent-cyan)', boxShadow: '0 0 20px var(--accent-cyan)' },
          { borderColor: 'rgba(255, 255, 255, 0.08)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 240, 255, 0.1)', duration: 1.2 }
        );
      }
    });
  });
};

// ==========================================================================
// 7. Contact Form Secure Relay & Toast Alert
// ==========================================================================
const showToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `custom-toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✔' : '✘'}</span>
    <span class="toast-text">${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  gsap.fromTo(toast, 
    { opacity: 0, y: 50, scale: 0.9 },
    { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power2.out' }
  );
  
  setTimeout(() => {
    gsap.to(toast, {
      opacity: 0,
      y: -20,
      scale: 0.9,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => toast.remove()
    });
  }, 4500);
};

const initContactForm = () => {
  const form = document.getElementById('portfolio-contact-form');
  if (!form) return;
  
  const submitBtn = form.querySelector('.btn-submit');
  const submitBtnText = submitBtn.querySelector('span');
  const originalText = submitBtnText.textContent;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const subject = document.getElementById('form-subject').value;
    const message = document.getElementById('form-message').value;
    
    submitBtn.disabled = true;
    submitBtnText.textContent = 'Sending...';
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, subject, message })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }
      
      showToast('Message sent successfully! I will reach out soon.', 'success');
      form.reset();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtnText.textContent = originalText;
    }
  });
};

// ==========================================================================
// 8. Initialize Application
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
  initLenis();
  initCustomCursor();
  initNavigation();
  initGSAPAnimations();
  initThemeSwitcher();
  initContactForm();
});
