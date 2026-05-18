/**
 * Premium Catalog Scroll Animations
 * Smooth scroll-linked animation system with parallax and section reveals
 */

const ScrollAnimator = {
  isActive: true,
  heroElement: null,
  ticking: false,
  parallaxStrength: 0.35,
  initialized: false,
  
  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.heroElement = document.querySelector('.parallax-hero');
    if (!this.heroElement) return;

    // Expose for debugging and external control
    window.ScrollAnimator = this;

    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
    window.addEventListener('resize', this.updateHeroHeight.bind(this), { passive: true });

    this.updateParallax();
  },

  onScroll() {
    if (!this.ticking) {
      requestAnimationFrame(() => this.updateParallax());
      this.ticking = true;
    }
  },

  updateParallax() {
    if (!this.heroElement) {
      this.ticking = false;
      return;
    }

    const rect = this.heroElement.getBoundingClientRect();
    const scrolled = window.scrollY;
    const heroBottom = rect.bottom;
    const heroTop = rect.top;
    
    // Only apply parallax while hero is in view
    if (heroBottom > 0 && heroTop < window.innerHeight) {
      const parallaxValue = scrolled * this.parallaxStrength;
      this.heroElement.style.setProperty('--hero-parallax-y', `${parallaxValue}px`);
    }
    
    this.ticking = false;
  },

  updateHeroHeight() {
    // Recalculate on resize
  }
};

const SectionReveal = {
  observer: null,
  initialized: false,
  
  init() {
    if (this.initialized) return;
    this.initialized = true;
    window.SectionReveal = this;

    const options = {
      threshold: [0, 0.15, 0.3],
      rootMargin: '0px 0px -80px 0px'
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const ratio = entry.intersectionRatio;
          entry.target.style.setProperty('--reveal-progress', ratio);
          
          if (ratio > 0.1) {
            entry.target.classList.add('section-visible');
          }
        }
      });
    }, options);

    document.querySelectorAll('.section, .catalog-card, .review-card').forEach(el => {
      this.observer.observe(el);
    });
  }
};

const initScrollAnimations = () => {
  ScrollAnimator.init();
  SectionReveal.init();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollAnimations);
} else {
  initScrollAnimations();
}

window.addEventListener('load', initScrollAnimations);

export { ScrollAnimator, SectionReveal };
