/**
 * SSMS — motion layer (scroll reveals, hero parallax)
 * Framer Motion is not used (no React); this provides purposeful motion with IO + rAF.
 */

const REVEAL_SELECTOR = [
  ".section",
  ".feature-card",
  ".testimonial-card",
  ".category-card",
  ".product-card",
  ".catalog-card",
  ".stat-card",
  ".card",
  ".catalog-sidebar",
  ".catalog-header",
  ".auth-box",
  ".checkout-section",
  ".stone-details-layout",
  ".prestige-strip",
].join(", ");

let revealObserver = null;
let parallaxBound = false;

function prefersReducedMotion() {
  return (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function ensureRevealObserver() {
  if (revealObserver) return revealObserver;
  revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("ssms-revealed");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.06, rootMargin: "0px 0px -40px 0px" },
  );
  return revealObserver;
}

function observeRevealTargets() {
  const nodes = document.querySelectorAll(REVEAL_SELECTOR);
  if (prefersReducedMotion()) {
    nodes.forEach((el) => el.classList.add("ssms-revealed"));
    return;
  }
  const obs = ensureRevealObserver();
  nodes.forEach((el) => {
    if (!el.classList.contains("ssms-revealed")) obs.observe(el);
  });
}

function setupParallaxHero() {
  const hero = document.querySelector(".parallax-hero");
  if (!hero) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = hero.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    if (rect.bottom < 0 || rect.top > vh) return;
    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
    const span = Math.min(rect.height + vh * 0.35, vh * 1.35);
    const t = Math.min(Math.max(visible / span, 0), 1);
    const y = (t - 0.5) * 22;
    hero.style.setProperty("--hero-parallax-y", `${y.toFixed(2)}px`);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
}

export function initMotionEnhancements() {
  observeRevealTargets();

  if (!parallaxBound) {
    parallaxBound = true;
    if (!prefersReducedMotion()) setupParallaxHero();
  }
}

/** Call after innerHTML updates (e.g. catalog / landing product grids). */
export function refreshRevealObservers() {
  observeRevealTargets();
}
