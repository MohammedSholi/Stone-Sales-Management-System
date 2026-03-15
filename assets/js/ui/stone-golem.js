/*
 * Stone Golem Animation — GSAP-powered SVG mascot
 * ────────────────────────────────────────────────────
 * Eye-tracking on text input  ·  Arms cover eyes on password focus
 * Peek animation on "show password"  ·  Idle breathing loop
 *
 * Usage:  import { initGolem } from "/assets/js/ui/stone-golem.js";
 *         initGolem({ trackInputId, passwordInputIds, toggleBtnClass });
 *
 * Requires GSAP (loaded via CDN in the HTML).
 */

/* ────────── SVG MARKUP (injected by init) ────────── */

/**
 * Build the entire Stone Golem SVG and return it as an <svg> element.
 * Every animatable part has an explicit `id` so GSAP can target it.
 */
function createGolemSVG() {
  const ns = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 300 220");
  svg.setAttribute("xmlns", ns);
  svg.id = "stoneGolem";

  // ── Defs: gradients + filters ──
  svg.innerHTML = `
    <defs>
      <!-- Rocky body gradient -->
      <linearGradient id="stoneBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#8a8478"/>
        <stop offset="100%" stop-color="#5c574e"/>
      </linearGradient>
      <!-- Head gradient (lighter rock) -->
      <linearGradient id="stoneHead" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#9e9688"/>
        <stop offset="100%" stop-color="#7a7368"/>
      </linearGradient>
      <!-- Arm gradient -->
      <linearGradient id="stoneArm" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stop-color="#7a7368"/>
        <stop offset="100%" stop-color="#5c574e"/>
      </linearGradient>
      <!-- Eye glow -->
      <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="#f0c060"/>
        <stop offset="100%" stop-color="#b07a3e"/>
      </radialGradient>
      <!-- Subtle inner shadow filter -->
      <filter id="rockTexture" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise"/>
        <feDiffuseLighting in="noise" lighting-color="#fff" surfaceScale="1.4" result="lit">
          <feDistantLight azimuth="225" elevation="50"/>
        </feDiffuseLighting>
        <feComposite in="SourceGraphic" in2="lit" operator="arithmetic" k1="0.9" k2="0.2" k3="0.1" k4="0"/>
      </filter>
      <!-- Drop shadow for the whole golem -->
      <filter id="golemShadow" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.18"/>
      </filter>
      <!-- Crack pattern overlay -->
      <pattern id="cracks" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
        <line x1="10" y1="0"  x2="25" y2="20" stroke="#5c574e" stroke-width="0.5" opacity="0.4"/>
        <line x1="25" y1="20" x2="18" y2="40" stroke="#5c574e" stroke-width="0.4" opacity="0.3"/>
        <line x1="40" y1="5"  x2="50" y2="30" stroke="#5c574e" stroke-width="0.5" opacity="0.35"/>
        <line x1="50" y1="30" x2="45" y2="55" stroke="#5c574e" stroke-width="0.3" opacity="0.25"/>
      </pattern>
    </defs>

    <!-- ===== MAIN GROUP (shadow applied once) ===== -->
    <g id="golemMain" filter="url(#golemShadow)">

      <!-- ── BODY ── blocky torso -->
      <g id="golemBody">
        <path d="
          M110,220 L108,160 C108,145 118,130 135,128
          L165,128 C182,130 192,145 192,160
          L190,220 Z
        " fill="url(#stoneBody)" filter="url(#rockTexture)"/>
        <!-- crack overlay -->
        <path d="
          M110,220 L108,160 C108,145 118,130 135,128
          L165,128 C182,130 192,145 192,160
          L190,220 Z
        " fill="url(#cracks)" opacity="0.5"/>
        <!-- Stone seam lines on body -->
        <line x1="130" y1="140" x2="128" y2="185" stroke="#4e4a42" stroke-width="0.7" opacity="0.5"/>
        <line x1="170" y1="140" x2="172" y2="185" stroke="#4e4a42" stroke-width="0.7" opacity="0.5"/>
        <!-- Chest rune (diamond shape) -->
        <polygon points="150,150 158,162 150,174 142,162" fill="none" stroke="#b07a3e" stroke-width="1.2" opacity="0.6"/>
        <circle cx="150" cy="162" r="3" fill="#b07a3e" opacity="0.5"/>
      </g>

      <!-- ── HEAD ── rounded-rectangle rocky head -->
      <g id="golemHead">
        <rect x="118" y="50" width="64" height="80" rx="18" ry="20"
              fill="url(#stoneHead)" filter="url(#rockTexture)"/>
        <!-- crack overlay on head -->
        <rect x="118" y="50" width="64" height="80" rx="18" ry="20"
              fill="url(#cracks)" opacity="0.4"/>
        <!-- Brow ridge -->
        <path d="M124,76 Q150,68 176,76" fill="none" stroke="#5c574e" stroke-width="2.5" stroke-linecap="round"/>

        <!-- ── EYES ── -->
        <g id="golemEyes">
          <!-- Left eye socket -->
          <ellipse cx="139" cy="88" rx="10" ry="9" fill="#3a3630"/>
          <!-- Right eye socket -->
          <ellipse cx="161" cy="88" rx="10" ry="9" fill="#3a3630"/>

          <!-- Left eye (pupil group) -->
          <g id="eyeL">
            <circle cx="139" cy="88" r="5.5" fill="url(#eyeGlow)"/>
            <circle cx="139" cy="88" r="2.2" fill="#2a2520"/>
          </g>
          <!-- Right eye (pupil group) -->
          <g id="eyeR">
            <circle cx="161" cy="88" r="5.5" fill="url(#eyeGlow)"/>
            <circle cx="161" cy="88" r="2.2" fill="#2a2520"/>
          </g>
        </g>

        <!-- ── MOUTH ── small chiseled line -->
        <g id="golemMouth">
          <path d="M141,112 Q150,117 159,112" fill="none" stroke="#4e4a42" stroke-width="2" stroke-linecap="round"/>
        </g>

        <!-- Forehead rune -->
        <circle cx="150" cy="60" r="4" fill="none" stroke="#b07a3e" stroke-width="1" opacity="0.5"/>
        <circle cx="150" cy="60" r="1.5" fill="#b07a3e" opacity="0.4"/>

        <!-- Small horn/crest nubbins -->
        <polygon points="130,52 126,38 134,48" fill="#6e685e"/>
        <polygon points="170,52 174,38 166,48" fill="#6e685e"/>
      </g>

      <!-- ── LEFT ARM (drawn in COVER position over face) ── -->
      <g id="armL">
        <!-- Forearm -->
        <rect x="100" y="96" width="28" height="50" rx="9" ry="9"
              fill="url(#stoneArm)" filter="url(#rockTexture)"/>
        <!-- Hand / palm covering left eye -->
        <rect x="96" y="76" width="40" height="26" rx="7" ry="7"
              fill="#6e685e" filter="url(#rockTexture)"/>
        <!-- Finger seams -->
        <line x1="110" y1="76" x2="110" y2="100" stroke="#5c574e" stroke-width="0.8" opacity="0.5"/>
        <line x1="122" y1="78" x2="122" y2="98" stroke="#5c574e" stroke-width="0.8" opacity="0.4"/>
        <!-- Two fingers (animated for peek) -->
        <g id="twoFingersL">
          <rect x="96"  y="66" width="17" height="16" rx="5" ry="5" fill="#756f65" filter="url(#rockTexture)"/>
          <rect x="115" y="66" width="17" height="16" rx="5" ry="5" fill="#756f65" filter="url(#rockTexture)"/>
        </g>
      </g>

      <!-- ── RIGHT ARM (drawn in COVER position over face) ── -->
      <g id="armR">
        <!-- Forearm -->
        <rect x="172" y="96" width="28" height="50" rx="9" ry="9"
              fill="url(#stoneArm)" filter="url(#rockTexture)"/>
        <!-- Hand / palm covering right eye -->
        <rect x="164" y="76" width="40" height="26" rx="7" ry="7"
              fill="#6e685e" filter="url(#rockTexture)"/>
        <!-- Finger seams -->
        <line x1="178" y1="76" x2="178" y2="100" stroke="#5c574e" stroke-width="0.8" opacity="0.5"/>
        <line x1="190" y1="78" x2="190" y2="98" stroke="#5c574e" stroke-width="0.8" opacity="0.4"/>
        <!-- Two fingers (animated for peek) -->
        <g id="twoFingersR">
          <rect x="166" y="66" width="17" height="16" rx="5" ry="5" fill="#756f65" filter="url(#rockTexture)"/>
          <rect x="185" y="66" width="17" height="16" rx="5" ry="5" fill="#756f65" filter="url(#rockTexture)"/>
        </g>
      </g>

    </g><!-- /golemMain -->
  `;

  return svg;
}

/* ────────── ANIMATION ENGINE ────────── */

/**
 * Initialise the Stone Golem on the page.
 *
 * @param {Object}  opts
 * @param {string}  opts.containerId       - Id of the div that will hold the SVG  (default "golemContainer")
 * @param {string}  opts.trackInputId      - Id of the text/email input to track   (default "username")
 * @param {string[]}opts.passwordInputIds  - Ids of password fields                (default ["password"])
 * @param {string}  opts.toggleBtnClass    - Class on show/hide buttons            (default "password-toggle")
 */
function initGolem(opts = {}) {
  const containerId = opts.containerId || "golemContainer";
  const trackInputId = opts.trackInputId || "username";
  const passwordInputIds = opts.passwordInputIds || ["password"];
  const toggleBtnClass = opts.toggleBtnClass || "password-toggle";

  const container = document.getElementById(containerId);
  if (!container) return; // page doesn't have the container

  // Inject the SVG
  container.appendChild(createGolemSVG());

  // ── Grab SVG parts ──
  const eyeL = document.getElementById("eyeL");
  const eyeR = document.getElementById("eyeR");
  const armL = document.getElementById("armL");
  const armR = document.getElementById("armR");
  const twoFingersL = document.getElementById("twoFingersL");
  const twoFingersR = document.getElementById("twoFingersR");
  const mouth = document.getElementById("golemMouth");
  const head = document.getElementById("golemHead");
  const body = document.getElementById("golemBody");

  if (!eyeL || !eyeR || !armL || !armR) return; // svg not ready

  // Check that GSAP loaded
  if (typeof gsap === "undefined") {
    console.warn("[StoneGolem] gsap not found — animation disabled.");
    return;
  }

  /* ──────── State ──────── */
  let eyesCovered = false;
  let breathTween = null;

  /* ──────── Constants ──────── */
  const EYE_REST = { x: 0, y: 0 };
  const EYE_MAX_X = 5;
  const EYE_MAX_Y = 3;

  // Arm resting pose (snug against the golem's sides)
  const ARM_REST_X_L = -8;
  const ARM_REST_X_R = 8;
  const ARM_REST_Y = 42;
  const ARM_REST_ROT_L = 32;
  const ARM_REST_ROT_R = -32;

  // Arm covering pose (hands over eyes — SVG-drawn position)
  const ARM_COVER_X_L = 3;
  const ARM_COVER_X_R = -3;
  const ARM_COVER_Y = 0;
  const ARM_COVER_ROT = 0;

  /* ──────── Initial arm setup (resting at sides, always visible) ──────── */
  gsap.set(armL, {
    x: ARM_REST_X_L,
    y: ARM_REST_Y,
    rotation: ARM_REST_ROT_L,
    transformOrigin: "top left",
  });
  gsap.set(armR, {
    x: ARM_REST_X_R,
    y: ARM_REST_Y,
    rotation: ARM_REST_ROT_R,
    transformOrigin: "top right",
  });

  /* ──────── Idle Breathing ──────── */
  function startBreathing() {
    if (breathTween) return;
    breathTween = gsap.to(body, {
      y: -2,
      duration: 2.2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }
  function stopBreathing() {
    if (breathTween) {
      breathTween.kill();
      breathTween = null;
      gsap.to(body, { y: 0, duration: 0.4, ease: "power2.out" });
    }
  }

  /* ──────── Eye tracking ──────── */
  function moveEyes(ratioX, ratioY) {
    if (eyesCovered) return;
    const ex = EYE_MAX_X * ratioX;
    const ey = EYE_MAX_Y * ratioY;
    gsap.to([eyeL, eyeR], {
      x: ex,
      y: ey,
      duration: 0.35,
      ease: "power2.out",
    });
  }

  function resetEyes() {
    gsap.to([eyeL, eyeR], {
      x: EYE_REST.x,
      y: EYE_REST.y,
      duration: 0.6,
      ease: "back.out(1.4)",
    });
  }

  /**
   * Given a text input, compute a horizontal ratio -1…+1
   * based on selectionEnd vs input width.
   */
  function getCaretRatio(input) {
    const len = input.value.length;
    const end = input.selectionEnd || len;
    // Approximate: each character ≈ 8px at default font size
    const charW = 8;
    const inputW = input.offsetWidth || 300;
    const caretPx = end * charW;
    const half = inputW / 2;
    // ratio: -1 (far left) → +1 (far right)
    const ratio = (caretPx - half) / half;
    return Math.max(-1, Math.min(1, ratio));
  }

  /* ──────── Arms: Cover / Uncover (Yeti-style mechanics) ──────── */
  function coverEyes() {
    if (eyesCovered) return;
    eyesCovered = true;

    gsap.killTweensOf([armL, armR]);

    // Mouth becomes a surprised "o"
    gsap.to(mouth, {
      y: 2,
      scaleY: 1.3,
      duration: 0.3,
      transformOrigin: "center center",
    });

    // Left arm swings up to cover position
    gsap.to(armL, {
      x: ARM_COVER_X_L,
      y: ARM_COVER_Y,
      rotation: ARM_COVER_ROT,
      duration: 0.45,
      ease: "quad.out",
    });
    // Right arm follows with slight delay
    gsap.to(armR, {
      x: ARM_COVER_X_R,
      y: ARM_COVER_Y,
      rotation: ARM_COVER_ROT,
      duration: 0.45,
      ease: "quad.out",
      delay: 0.1,
    });
  }

  function uncoverEyes() {
    if (!eyesCovered) return;
    eyesCovered = false;

    gsap.killTweensOf([armL, armR]);
    closeFingers();

    // Mouth back to normal
    gsap.to(mouth, {
      y: 0,
      scaleY: 1,
      duration: 0.3,
      transformOrigin: "center center",
    });

    // Left arm returns to resting pose
    gsap.to(armL, {
      x: ARM_REST_X_L,
      y: ARM_REST_Y,
      rotation: ARM_REST_ROT_L,
      duration: 1.35,
      ease: "quad.out",
    });
    // Right arm follows with slight delay
    gsap.to(armR, {
      x: ARM_REST_X_R,
      y: ARM_REST_Y,
      rotation: ARM_REST_ROT_R,
      duration: 1.35,
      ease: "quad.out",
      delay: 0.1,
    });
  }

  /* ──────── Peek: lower one arm so the golem peeks over it ──────── */
  function spreadFingers() {
    // Lower the right arm partway down so the golem peeks with one eye
    gsap.to(armR, {
      x: ARM_COVER_X_R - 6,
      y: 22,
      rotation: -14,
      duration: 0.4,
      ease: "power2.inOut",
    });
  }

  function closeFingers() {
    // Raise the right arm back up to full cover
    if (eyesCovered) {
      gsap.to(armR, {
        x: ARM_COVER_X_R,
        y: ARM_COVER_Y,
        rotation: ARM_COVER_ROT,
        duration: 0.35,
        ease: "power2.inOut",
      });
    }
  }

  /* ──────── Bind Events ──────── */

  // 1. Track text input (username / email)
  const trackInput = document.getElementById(trackInputId);
  if (trackInput) {
    trackInput.addEventListener("focus", () => {
      stopBreathing();
      uncoverEyes();
    });

    trackInput.addEventListener("input", () => {
      const rx = getCaretRatio(trackInput);
      moveEyes(rx, 0.15);
    });

    // Also handle keyup for caret position changes (arrows, backspace)
    trackInput.addEventListener("keyup", () => {
      const rx = getCaretRatio(trackInput);
      moveEyes(rx, 0.15);
    });

    trackInput.addEventListener("blur", () => {
      resetEyes();
      startBreathing();
    });
  }

  // 2. Password fields → cover eyes
  passwordInputIds.forEach((id) => {
    const pwInput = document.getElementById(id);
    if (!pwInput) return;

    pwInput.addEventListener("focus", () => {
      stopBreathing();
      coverEyes();
    });

    pwInput.addEventListener("blur", () => {
      uncoverEyes();
      resetEyes();
      startBreathing();
    });
  });

  // 3. Show/Hide password toggles → peek
  document.querySelectorAll("." + toggleBtnClass).forEach((btn) => {
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault(); // don't steal focus from input
      const input = btn.closest(".password-wrapper")?.querySelector("input");
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";

      // Swap icon
      const showIcon = btn.querySelector(".icon-show");
      const hideIcon = btn.querySelector(".icon-hide");
      if (showIcon && hideIcon) {
        showIcon.style.display = isPassword ? "none" : "block";
        hideIcon.style.display = isPassword ? "block" : "none";
      }

      if (isPassword) {
        spreadFingers();
      } else {
        closeFingers();
      }
    });
  });

  // 4. Track all other non-password inputs for a softer eye follow
  //    (fullName, email, phone, address on register page)
  const allTextInputs = document.querySelectorAll(
    '.auth-form input[type="text"], .auth-form input[type="email"], .auth-form input[type="tel"]',
  );
  allTextInputs.forEach((input) => {
    if (input.id === trackInputId) return; // already bound above

    input.addEventListener("focus", () => {
      stopBreathing();
      uncoverEyes();
      // Look slightly toward this field's vertical position
      const formRect = input.closest("form")?.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      if (formRect) {
        const ry = ((inputRect.top - formRect.top) / formRect.height) * 2 - 1;
        moveEyes(0, Math.max(-1, Math.min(1, ry * 0.4)));
      }
    });

    input.addEventListener("input", () => {
      const rx = getCaretRatio(input);
      moveEyes(rx, 0.25);
    });

    input.addEventListener("keyup", () => {
      const rx = getCaretRatio(input);
      moveEyes(rx, 0.25);
    });

    input.addEventListener("blur", () => {
      resetEyes();
      startBreathing();
    });
  });

  // ── Kick off idle breathing ──
  startBreathing();
}

/* ────────── Auto-init when DOM is ready ────────── */
// This makes it work as a plain <script> tag too
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => autoInit());
  } else {
    // DOM already ready (script at bottom of body)
    autoInit();
  }
}

function autoInit() {
  // Detect which page we're on and configure accordingly
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  if (loginForm) {
    initGolem({
      containerId: "golemContainer",
      trackInputId: "username",
      passwordInputIds: ["password"],
      toggleBtnClass: "password-toggle",
    });
  } else if (registerForm) {
    initGolem({
      containerId: "golemContainer",
      trackInputId: "fullName",
      passwordInputIds: ["password", "confirmPassword"],
      toggleBtnClass: "password-toggle",
    });
  }
}
