/*
 * Stone Golem Animation — GSAP-powered SVG mascot
 * Eye tracking on text input, hands cover the eyes on password focus,
 * and a small peek when password visibility is toggled.
 */

function createGolemSVG() {
  const ns = "http://www.w3.org/2000/svg";

  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 300 220");
  svg.setAttribute("xmlns", ns);
  svg.id = "stoneGolem";

  svg.innerHTML = `
    <defs>
      <linearGradient id="stoneBody" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d0ccc4"/>
        <stop offset="55%" stop-color="#ada79b"/>
        <stop offset="100%" stop-color="#807a70"/>
      </linearGradient>
      <linearGradient id="stoneHead" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#d8d3ca"/>
        <stop offset="60%" stop-color="#b6b0a4"/>
        <stop offset="100%" stop-color="#878175"/>
      </linearGradient>
      <linearGradient id="stoneArm" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#c6c1b6"/>
        <stop offset="100%" stop-color="#857f73"/>
      </linearGradient>
      <linearGradient id="goldInlay" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f4d18d"/>
        <stop offset="45%" stop-color="#d8ab62"/>
        <stop offset="100%" stop-color="#a87731"/>
      </linearGradient>
      <radialGradient id="eyeGlow" cx="50%" cy="45%" r="58%">
        <stop offset="0%" stop-color="#ffd577"/>
        <stop offset="55%" stop-color="#e2ad4e"/>
        <stop offset="100%" stop-color="#9a672a"/>
      </radialGradient>
      <filter id="rockTexture" x="-6%" y="-6%" width="112%" height="112%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="5" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.1" result="distort"/>
        <feComposite in="distort" in2="SourceAlpha" operator="in"/>
      </filter>
      <filter id="golemShadow" x="-12%" y="-12%" width="124%" height="136%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.8" flood-color="#000" flood-opacity="0.16"/>
      </filter>
      <pattern id="cracks" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
        <path d="M6,8 L18,19 L12,32" fill="none" stroke="#5e574c" stroke-width="0.6" opacity="0.35"/>
        <path d="M34,6 L44,22 L38,42" fill="none" stroke="#5e574c" stroke-width="0.55" opacity="0.28"/>
        <path d="M54,26 L43,36 L47,55" fill="none" stroke="#5e574c" stroke-width="0.45" opacity="0.25"/>
      </pattern>
    </defs>

    <g id="golemMain" filter="url(#golemShadow)">
      <g id="golemBody">
        <path d="
          M112,220 L108,166 C108,145 122,130 142,128
          L158,128 C178,130 192,145 192,166
          L188,220 Z
        " fill="url(#stoneBody)" filter="url(#rockTexture)"/>
        <path d="M118,214 L114,170 L150,146 L186,170 L182,214 Z" fill="#f3eee4" opacity="0.14"/>
        <path d="
          M112,220 L108,166 C108,145 122,130 142,128
          L158,128 C178,130 192,145 192,166
          L188,220 Z
        " fill="url(#cracks)" opacity="0.38"/>

        <polygon points="150,145 160,162 150,179 140,162" fill="none" stroke="url(#goldInlay)" stroke-width="1.5" opacity="0.9"/>
        <circle cx="150" cy="162" r="2.7" fill="url(#goldInlay)" opacity="0.9"/>
      </g>

      <g id="golemHead">
        <path d="M122,129 L116,66 L150,44 L184,66 L178,129 Z" fill="url(#stoneHead)" filter="url(#rockTexture)"/>
        <path d="M122,129 L116,66 L150,44 L184,66 L178,129 Z" fill="url(#cracks)" opacity="0.34"/>
        <path d="M122,72 L150,53 L178,72" fill="none" stroke="#655e53" stroke-width="2" stroke-linecap="round" opacity="0.75"/>
        <path d="M132,98 L150,90 L168,98" fill="none" stroke="#6a6257" stroke-width="1.5" opacity="0.45"/>

        <g id="golemEyes">
          <ellipse cx="139" cy="89" rx="10" ry="8.5" fill="#302b25"/>
          <ellipse cx="161" cy="89" rx="10" ry="8.5" fill="#302b25"/>

          <g id="eyeL">
            <circle cx="139" cy="89" r="5.2" fill="url(#eyeGlow)"/>
            <circle cx="139" cy="89" r="2.1" fill="#241f19"/>
          </g>
          <g id="eyeR">
            <circle cx="161" cy="89" r="5.2" fill="url(#eyeGlow)"/>
            <circle cx="161" cy="89" r="2.1" fill="#241f19"/>
          </g>
        </g>

        <g id="golemMouth">
          <path d="M141,112 Q150,118 159,112" fill="none" stroke="#5f584e" stroke-width="2" stroke-linecap="round"/>
        </g>

        <polygon points="131,53 126,37 137,49" fill="#7f786d"/>
        <polygon points="169,53 174,37 163,49" fill="#7f786d"/>
      </g>

      <g id="armL">
        <path d="M100,143 L97,99 L121,86 L129,135 Z" fill="url(#stoneArm)" filter="url(#rockTexture)"/>
        <path d="M97,102 L92,78 L124,72 L133,95 Z" fill="#969084" filter="url(#rockTexture)"/>
        <line x1="103" y1="79" x2="112" y2="101" stroke="#655f54" stroke-width="0.9" opacity="0.5"/>
        <line x1="116" y1="76" x2="122" y2="97" stroke="#655f54" stroke-width="0.8" opacity="0.38"/>
        <g id="twoFingersL">
          <rect x="90" y="64" width="17" height="16" rx="5" ry="5" fill="#8f897d" filter="url(#rockTexture)"/>
          <rect x="109" y="63" width="17" height="16" rx="5" ry="5" fill="#8f897d" filter="url(#rockTexture)"/>
        </g>
      </g>

      <g id="armR">
        <path d="M200,143 L171,135 L179,86 L203,99 Z" fill="url(#stoneArm)" filter="url(#rockTexture)"/>
        <path d="M208,102 L172,95 L181,72 L213,78 Z" fill="#969084" filter="url(#rockTexture)"/>
        <line x1="197" y1="79" x2="188" y2="101" stroke="#655f54" stroke-width="0.9" opacity="0.5"/>
        <line x1="184" y1="76" x2="178" y2="97" stroke="#655f54" stroke-width="0.8" opacity="0.38"/>
        <g id="twoFingersR">
          <rect x="174" y="63" width="17" height="16" rx="5" ry="5" fill="#8f897d" filter="url(#rockTexture)"/>
          <rect x="193" y="64" width="17" height="16" rx="5" ry="5" fill="#8f897d" filter="url(#rockTexture)"/>
        </g>
      </g>
    </g>
  `;

  return svg;
}

function initGolem(opts = {}) {
  const containerId = opts.containerId || "golemContainer";
  const trackInputId = opts.trackInputId || "username";
  const passwordInputIds = opts.passwordInputIds || ["password"];
  const toggleBtnClass = opts.toggleBtnClass || "password-toggle";

  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";
  container.appendChild(createGolemSVG());

  const eyeL = document.getElementById("eyeL");
  const eyeR = document.getElementById("eyeR");
  const eyesGroup = document.getElementById("golemEyes");
  const armL = document.getElementById("armL");
  const armR = document.getElementById("armR");
  const twoFingersL = document.getElementById("twoFingersL");
  const twoFingersR = document.getElementById("twoFingersR");
  const mouth = document.getElementById("golemMouth");
  const body = document.getElementById("golemBody");

  if (!eyeL || !eyeR || !armL || !armR || !eyesGroup) return;

  if (typeof gsap === "undefined") {
    console.warn("[StoneGolem] gsap not found — animation disabled.");
    return;
  }

  let eyesCovered = false;
  let breathTween = null;

  const EYE_REST = { x: 0, y: 0 };
  const EYE_MAX_X = 5;
  const EYE_MAX_Y = 3;

  const ARM_REST_X_L = -8;
  const ARM_REST_X_R = 8;
  const ARM_REST_Y = 42;
  const ARM_REST_ROT_L = 32;
  const ARM_REST_ROT_R = -32;

  const ARM_COVER_X_L = 30;
  const ARM_COVER_X_R = -30;
  const ARM_COVER_Y = -10;
  const ARM_COVER_ROT_L = 26;
  const ARM_COVER_ROT_R = -26;
  const FINGERS_COVER_X_L = 10;
  const FINGERS_COVER_X_R = -10;

  const ARM_PEEK_X_R = -20;
  const ARM_PEEK_Y_R = 3;
  const ARM_PEEK_ROT_R = -34;

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
    if (!breathTween) return;
    breathTween.kill();
    breathTween = null;
    gsap.to(body, { y: 0, duration: 0.4, ease: "power2.out" });
  }

  function moveEyes(ratioX, ratioY) {
    if (eyesCovered) return;
    gsap.to([eyeL, eyeR], {
      x: EYE_MAX_X * ratioX,
      y: EYE_MAX_Y * ratioY,
      duration: 0.35,
      ease: "power2.out",
    });
  }

  function resetEyes() {
    gsap.to([eyeL, eyeR], {
      x: EYE_REST.x,
      y: EYE_REST.y,
      opacity: 1,
      duration: 0.6,
      ease: "back.out(1.4)",
    });
  }

  function getCaretRatio(input) {
    const len = input.value.length;
    const end = input.selectionEnd || len;
    const charW = 8;
    const inputW = input.offsetWidth || 300;
    const caretPx = end * charW;
    const half = inputW / 2;
    const ratio = (caretPx - half) / half;
    return Math.max(-1, Math.min(1, ratio));
  }

  function coverEyes() {
    if (eyesCovered) return;
    eyesCovered = true;

    gsap.killTweensOf([armL, armR, eyeL, eyeR, eyesGroup]);

    gsap.to(mouth, {
      y: 2,
      scaleY: 1.2,
      duration: 0.25,
      transformOrigin: "center center",
    });

    gsap.to(armL, {
      x: ARM_COVER_X_L,
      y: ARM_COVER_Y,
      rotation: ARM_COVER_ROT_L,
      duration: 0.42,
      ease: "power2.out",
    });
    gsap.to(armR, {
      x: ARM_COVER_X_R,
      y: ARM_COVER_Y,
      rotation: ARM_COVER_ROT_R,
      duration: 0.42,
      ease: "power2.out",
      delay: 0.04,
    });
    gsap.to(twoFingersL, {
      x: FINGERS_COVER_X_L,
      y: 0,
      duration: 0.26,
      ease: "power2.out",
    });
    gsap.to(twoFingersR, {
      x: FINGERS_COVER_X_R,
      y: 0,
      duration: 0.26,
      ease: "power2.out",
    });
    gsap.to(eyesGroup, {
      opacity: 0,
      duration: 0.16,
      ease: "power1.out",
    });
  }

  function closeFingers() {
    if (!eyesCovered) return;

    gsap.to(armR, {
      x: ARM_COVER_X_R,
      y: ARM_COVER_Y,
      rotation: ARM_COVER_ROT_R,
      duration: 0.28,
      ease: "power2.inOut",
    });
    gsap.to(armL, {
      x: ARM_COVER_X_L,
      y: ARM_COVER_Y,
      rotation: ARM_COVER_ROT_L,
      duration: 0.28,
      ease: "power2.inOut",
    });
    gsap.to([twoFingersL, twoFingersR], {
      x: 0,
      y: 0,
      duration: 0.2,
      ease: "power2.out",
    });
    gsap.to(eyesGroup, {
      opacity: 0,
      duration: 0.16,
      ease: "power1.out",
    });
  }

  function uncoverEyes() {
    if (!eyesCovered) return;
    eyesCovered = false;

    gsap.killTweensOf([
      armL,
      armR,
      eyeL,
      eyeR,
      eyesGroup,
      twoFingersL,
      twoFingersR,
    ]);

    gsap.to(mouth, {
      y: 0,
      scaleY: 1,
      duration: 0.25,
      transformOrigin: "center center",
    });

    gsap.to(armL, {
      x: ARM_REST_X_L,
      y: ARM_REST_Y,
      rotation: ARM_REST_ROT_L,
      duration: 0.8,
      ease: "power2.out",
    });
    gsap.to(armR, {
      x: ARM_REST_X_R,
      y: ARM_REST_Y,
      rotation: ARM_REST_ROT_R,
      duration: 0.8,
      ease: "power2.out",
      delay: 0.04,
    });
    gsap.to(eyesGroup, {
      opacity: 1,
      duration: 0.2,
      ease: "power1.out",
    });
    gsap.to([twoFingersL, twoFingersR], {
      x: 0,
      y: 0,
      duration: 0.24,
      ease: "power2.out",
    });
  }

  function spreadFingers() {
    if (!eyesCovered) return;

    gsap.to(armR, {
      x: ARM_PEEK_X_R,
      y: ARM_PEEK_Y_R,
      rotation: ARM_PEEK_ROT_R,
      duration: 0.32,
      ease: "power2.inOut",
    });
    gsap.to(twoFingersR, {
      y: -4,
      duration: 0.2,
      ease: "power2.out",
    });
    gsap.to(eyesGroup, {
      opacity: 1,
      duration: 0.16,
      ease: "power1.out",
    });
  }

  const trackInput = document.getElementById(trackInputId);
  if (trackInput) {
    trackInput.addEventListener("focus", () => {
      stopBreathing();
      uncoverEyes();
    });

    trackInput.addEventListener("input", () => {
      moveEyes(getCaretRatio(trackInput), 0.15);
    });

    trackInput.addEventListener("keyup", () => {
      moveEyes(getCaretRatio(trackInput), 0.15);
    });

    trackInput.addEventListener("blur", () => {
      resetEyes();
      startBreathing();
    });
  }

  passwordInputIds.forEach((id) => {
    const pwInput = document.getElementById(id);
    if (!pwInput) return;

    const syncCover = () => {
      if (pwInput.type === "password") {
        coverEyes();
      } else {
        spreadFingers();
      }
    };

    pwInput.addEventListener("focus", () => {
      stopBreathing();
      syncCover();
    });

    pwInput.addEventListener("input", syncCover);
    pwInput.addEventListener("keyup", syncCover);

    pwInput.addEventListener("blur", () => {
      uncoverEyes();
      resetEyes();
      startBreathing();
    });
  });

  passwordInputIds.forEach((id) => {
    const pwInput = document.getElementById(id);
    if (!pwInput) return;

    const syncCover = () => {
      if (pwInput.type === "password") {
        coverEyes();
      } else {
        spreadFingers();
      }
    };

    pwInput.addEventListener("focus", () => {
      stopBreathing();
      syncCover();
    });

    pwInput.addEventListener("input", syncCover);
    pwInput.addEventListener("keyup", syncCover);

    // Watch for type attribute changes (when password toggle changes the input type)
    const observer = new MutationObserver(syncCover);
    observer.observe(pwInput, {
      attributes: true,
      attributeFilter: ["type"],
    });

    pwInput.addEventListener("blur", () => {
      uncoverEyes();
      resetEyes();
      startBreathing();
    });
  });

  const allTextInputs = document.querySelectorAll(
    '.auth-form input[type="text"], .auth-form input[type="email"], .auth-form input[type="tel"]',
  );

  allTextInputs.forEach((input) => {
    if (input.id === trackInputId) return;

    input.addEventListener("focus", () => {
      stopBreathing();
      uncoverEyes();
      const formRect = input.closest("form")?.getBoundingClientRect();
      const inputRect = input.getBoundingClientRect();
      if (formRect) {
        const ry = ((inputRect.top - formRect.top) / formRect.height) * 2 - 1;
        moveEyes(0, Math.max(-1, Math.min(1, ry * 0.4)));
      }
    });

    input.addEventListener("input", () => {
      moveEyes(getCaretRatio(input), 0.25);
    });

    input.addEventListener("keyup", () => {
      moveEyes(getCaretRatio(input), 0.25);
    });

    input.addEventListener("blur", () => {
      resetEyes();
      startBreathing();
    });
  });

  startBreathing();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => autoInit());
  } else {
    autoInit();
  }
}

function autoInit() {
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
