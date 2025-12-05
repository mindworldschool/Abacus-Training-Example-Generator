import {
  initI18n,
  t,
  setLanguage,
  getAvailableLanguages,
  getCurrentLanguage,
  onLanguageChange
} from "./core/i18n.js";
import {
  state,
  setRoute,
  updateSettings,
  setLanguagePreference
} from "./core/state.js";
import { renderSettings } from "./ui/settings.js";
import { renderConfirmation } from "./ui/confirmation.js";
import { renderGame } from "./ui/game.js";
import { renderResults } from "./ui/results.js";
import { logger } from "./core/utils/logger.js";
import toast from "./ui/components/Toast.js";

const CONTEXT = "Main";

const mainContainer = document.getElementById("app");
const titleElement = document.getElementById("appTitle");
const taglineElement = document.getElementById("appTagline");
const languageContainer = document.getElementById("languageSwitcher");
const footerElement = document.getElementById("appFooter");

const screens = {
  settings: renderSettings,
  confirmation: renderConfirmation,
  game: renderGame,
  results: renderResults
};

let currentCleanup = null;

function updateHeaderTexts() {
  const titleMain = document.querySelector('.title-main');
  const titleSub = document.querySelector('.title-sub');

  if (titleMain) titleMain.textContent = t("header.titleMain");
  if (titleSub) titleSub.textContent = t("header.titleSub");

  taglineElement.textContent = t("header.tagline");
  footerElement.textContent = t("footer");
  document.title = t("header.titleMain");
  document.documentElement.lang = getCurrentLanguage();
}

function renderLanguageButtons() {
  const languages = getAvailableLanguages();
  languageContainer.innerHTML = "";
  const capsule = document.createElement("div");
  capsule.className = "language-capsule";

  languages.forEach(({ code, label }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = code.toUpperCase();
    button.title = label;
    button.dataset.lang = code;
    if (code === getCurrentLanguage()) {
      button.classList.add("language-capsule__btn--active");
    }
    button.addEventListener("click", () => {
      setLanguagePreference(code);
      setLanguage(code);
    });
    capsule.appendChild(button);
  });

  languageContainer.appendChild(capsule);
}

function renderScreen(name) {
  if (!screens[name]) {
    logger.warn(CONTEXT, `Unknown route: ${name}`);
    return;
  }

  if (typeof currentCleanup === "function") {
    currentCleanup();
    currentCleanup = null;
  }

  mainContainer.innerHTML = "";
  const context = {
    t,
    state,
    navigate: route,
    updateSettings
  };
  const cleanup = screens[name](mainContainer, context);
  if (typeof cleanup === "function") {
    currentCleanup = cleanup;
  }
}

export function route(name) {
  logger.debug(CONTEXT, `Navigating to: ${name}`);
  setRoute(name);
  renderScreen(name);
}

async function bootstrap() {
  try {
    // Проверка критических DOM элементов
    if (
      !mainContainer ||
      !titleElement ||
      !taglineElement ||
      !languageContainer ||
      !footerElement
    ) {
      const missing = [];
      if (!mainContainer) missing.push("app");
      if (!titleElement) missing.push("appTitle");
      if (!taglineElement) missing.push("appTagline");
      if (!languageContainer) missing.push("languageSwitcher");
      if (!footerElement) missing.push("appFooter");

      throw new Error(
        `Missing required DOM elements: ${missing.join(", ")}`
      );
    }

    logger.info(CONTEXT, "Application starting...");

    // 🔹 1. Определяем язык из URL (?lang=ua / ?lang=en / ?lang=ru / ?lang=es)
    const SUPPORTED_LANGS = ["ua", "en", "ru", "es"];
    const params = new URLSearchParams(window.location.search);
    let initialLang = params.get("lang");

    // 🔹 2. Если в URL нет или неправильный — пробуем из state или localStorage
    if (!SUPPORTED_LANGS.includes(initialLang)) {
      if (SUPPORTED_LANGS.includes(state.language)) {
        initialLang = state.language;
      } else {
        const saved = localStorage.getItem("mws_lang");
        if (SUPPORTED_LANGS.includes(saved)) {
          initialLang = saved;
        } else {
          initialLang = "ua";
        }
      }
    }

    // 🔹 3. Сохраняем выбор языка для будущих сессий
    localStorage.setItem("mws_lang", initialLang);
    setLanguagePreference(initialLang);

    // 🔹 4. Инициализируем i18n с нужным языком
    await initI18n(initialLang);
    // initI18n уже ставит currentLanguage, но на всякий случай синхронизируем:
    setLanguage(initialLang);

    updateHeaderTexts();
    renderLanguageButtons();
    route(state.route);

    onLanguageChange(() => {
      updateHeaderTexts();
      renderLanguageButtons();
      renderScreen(state.route);
    });

    logger.info(CONTEXT, "Application initialized successfully");
  } catch (error) {
    logger.error(CONTEXT, "Failed to initialize application:", error);
    toast.error("Не удалось загрузить приложение");
    throw error;
  }
}

// Escape key handler with cleanup
const escapeHandler = (event) => {
  if (event.key === "Escape" && state.route !== "settings") {
    route("settings");
  }
};

document.addEventListener("keydown", escapeHandler);

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  logger.debug(CONTEXT, "Cleaning up before unload");
  if (typeof currentCleanup === "function") {
    currentCleanup();
  }
  document.removeEventListener("keydown", escapeHandler);
});

// Start application
bootstrap().catch((error) => {
  logger.error(CONTEXT, "Bootstrap failed:", error);
});
