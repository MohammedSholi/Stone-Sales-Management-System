/*
 * SSMS - 3D Tilt Effect for Product Cards
 * Vanilla JS 3D card tilt on mouse move
 */

export class CardTilt {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      maxTilt: options.maxTilt || 15,
      perspective: options.perspective || 1000,
      scale: options.scale || 1.05,
      speed: options.speed || 400,
      easing: options.easing || "cubic-bezier(0.23, 1, 0.32, 1)",
      ...options,
    };

    this.width = null;
    this.height = null;
    this.left = null;
    this.top = null;

    this.transitionTimeout = null;
    this.updateCall = null;

    this.init();
  }

  init() {
    // Add tilt class
    this.element.classList.add("card-tilt");

    // Set perspective
    this.element.style.transformStyle = "preserve-3d";

    // Bind events
    this.element.addEventListener("mouseenter", this.onMouseEnter.bind(this));
    this.element.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.element.addEventListener("mouseleave", this.onMouseLeave.bind(this));
  }

  onMouseEnter(event) {
    this.updateElementPosition();
    this.setTransition();
  }

  onMouseMove(event) {
    if (this.updateCall !== null) {
      cancelAnimationFrame(this.updateCall);
    }

    this.event = event;
    this.updateCall = requestAnimationFrame(this.update.bind(this));
  }

  onMouseLeave() {
    this.setTransition();
    this.reset();
  }

  reset() {
    this.element.style.transform = `perspective(${this.options.perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  }

  getValues(event) {
    const x = (event.clientX - this.left) / this.width;
    const y = (event.clientY - this.top) / this.height;

    const tiltX = (this.options.maxTilt / 2 - x * this.options.maxTilt).toFixed(
      2,
    );
    const tiltY = (y * this.options.maxTilt - this.options.maxTilt / 2).toFixed(
      2,
    );

    return {
      tiltX,
      tiltY,
      percentageX: x * 100,
      percentageY: y * 100,
    };
  }

  updateElementPosition() {
    const rect = this.element.getBoundingClientRect();
    this.width = this.element.offsetWidth;
    this.height = this.element.offsetHeight;
    this.left = rect.left;
    this.top = rect.top;
  }

  update() {
    const values = this.getValues(this.event);

    this.element.style.transform = `
      perspective(${this.options.perspective}px)
      rotateX(${values.tiltX}deg)
      rotateY(${values.tiltY}deg)
      scale3d(${this.options.scale}, ${this.options.scale}, ${this.options.scale})
    `;

    this.updateCall = null;
  }

  setTransition() {
    clearTimeout(this.transitionTimeout);
    this.element.style.transition = `transform ${this.options.speed}ms ${this.options.easing}`;

    this.transitionTimeout = setTimeout(() => {
      this.element.style.transition = "";
    }, this.options.speed);
  }

  destroy() {
    this.element.removeEventListener("mouseenter", this.onMouseEnter);
    this.element.removeEventListener("mousemove", this.onMouseMove);
    this.element.removeEventListener("mouseleave", this.onMouseLeave);
    this.element.classList.remove("card-tilt");
    this.reset();
  }
}

// Auto-init for elements with data-tilt attribute
export function initTiltCards() {
  const tiltElements = document.querySelectorAll("[data-tilt]");
  tiltElements.forEach((element) => {
    new CardTilt(element);
  });
}

// Parallax scroll effect for hero
export function initParallax() {
  const hero = document.querySelector(".hero-parallax");
  if (!hero) return;

  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * 0.5;

    hero.style.transform = `translate3d(0, ${rate}px, 0)`;
  });
}

export default CardTilt;
