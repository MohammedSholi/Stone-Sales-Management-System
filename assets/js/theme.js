/*
 * SSMS — Theme (Dark Mode) Controller
 * ─────────────────────────────────────
 * Loads BEFORE the page paints to prevent a flash of wrong theme.
 * Include as a regular <script> (not type="module") in <head>.
 *
 * API (on window.SSMSTheme):
 *   .isDark         – boolean, current state
 *   .toggle()       – flip theme
 *   .set(dark:bool) – set explicitly
 *
 * Persistence: localStorage key "ssms_dark_mode" ("1" | "0")
 */
(function () {
  "use strict";

  var STORAGE_KEY = "ssms_dark_mode";

  /* ── Resolve initial state ── */
  var stored = localStorage.getItem(STORAGE_KEY);
  var prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  var isDark = stored !== null ? stored === "1" : prefersDark;

  /* Apply immediately (script is in <head>, body exists or will exist) */
  if (isDark) {
    document.documentElement.classList.add("dark-mode");
  }

  /* When DOM is ready, also set it on <body> for CSS selectors */
  function applyToBody() {
    if (isDark) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }

  if (document.body) {
    applyToBody();
  } else {
    document.addEventListener("DOMContentLoaded", applyToBody);
  }

  /* ── Public API ── */
  function set(dark) {
    isDark = !!dark;
    localStorage.setItem(STORAGE_KEY, isDark ? "1" : "0");

    var root = document.documentElement;
    root.classList.add("ssms-theme-transition");
    window.clearTimeout(window.__ssmsThemeTransitionT);
    window.__ssmsThemeTransitionT = window.setTimeout(function () {
      root.classList.remove("ssms-theme-transition");
    }, 480);

    root.classList.toggle("dark-mode", isDark);
    document.body.classList.toggle("dark-mode", isDark);

    /* Keep every checkbox in sync (multiple toggles on page?) */
    var boxes = document.querySelectorAll(".theme-toggle__input");
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].checked = isDark;
    }
  }

  function toggle() {
    set(!isDark);
  }

  /* Expose */
  window.SSMSTheme = {
    get isDark() {
      return isDark;
    },
    toggle: toggle,
    set: set,
  };

  /* ── Wire up any toggle checkboxes once DOM is ready ── */
  document.addEventListener("DOMContentLoaded", function () {
    var boxes = document.querySelectorAll(".theme-toggle__input");
    for (var i = 0; i < boxes.length; i++) {
      boxes[i].checked = isDark;
      boxes[i].addEventListener("change", function () {
        set(this.checked);
      });
    }
  });

  /* ── React to OS-level preference change ── */
  if (window.matchMedia) {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function (e) {
        /* Only auto-switch if user hasn't manually chosen */
        if (localStorage.getItem(STORAGE_KEY) === null) {
          set(e.matches);
        }
      });
  }
})();
