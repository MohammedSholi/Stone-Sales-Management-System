export function createPageTranslator(dictionary) {
  const root = document;

  function getLanguage() {
    const appLanguage = window.SSMS?.currentLanguage;
    if (appLanguage === "ar" || appLanguage === "en") {
      return appLanguage;
    }

    const documentLanguage = document.documentElement.lang;
    return documentLanguage === "ar" ? "ar" : "en";
  }

  function resolveStrings(language) {
    return dictionary[language] || dictionary.en || {};
  }

  function translate(language = getLanguage()) {
    const strings = resolveStrings(language);

    root.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (key && strings[key] !== undefined) {
        element.textContent = strings[key];
      }
    });

    root.querySelectorAll("[data-i18n-html]").forEach((element) => {
      const key = element.dataset.i18nHtml;
      if (key && strings[key] !== undefined) {
        element.innerHTML = strings[key];
      }
    });

    root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.dataset.i18nPlaceholder;
      if (key && strings[key] !== undefined) {
        element.setAttribute("placeholder", strings[key]);
      }
    });

    root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      const key = element.dataset.i18nAriaLabel;
      if (key && strings[key] !== undefined) {
        element.setAttribute("aria-label", strings[key]);
      }
    });

    root.querySelectorAll("[data-i18n-title]").forEach((element) => {
      const key = element.dataset.i18nTitle;
      if (key && strings[key] !== undefined) {
        element.setAttribute("title", strings[key]);
      }
    });

    return strings;
  }

  function getText(key, language = getLanguage()) {
    const strings = resolveStrings(language);
    return strings[key] || key;
  }

  window.addEventListener("ssms:languagechange", (event) => {
    translate(event.detail?.language);
  });

  return {
    getLanguage,
    translate,
    getText,
  };
}
