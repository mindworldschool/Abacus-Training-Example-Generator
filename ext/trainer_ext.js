// ext/trainer_ext.js — точка входа тренажёра (инициализация окружения)
import { preloadSounds } from "../js/utils/sound.js";
import { mountTrainerUI as _mountTrainerUI } from "./trainer_logic.js";

/**
 * 1) Гарантированно подключаем CSS тренажёра.
 *    Используем import.meta.url, чтобы корректно собрать относительный путь на GitHub Pages.
 */
(function ensureTrainerCss() {
  try {
    const href = new URL("./trainer-ext.css", import.meta.url).toString(); // ext/trainer-ext.css
    const exists = [...document.styleSheets].some(ss => {
      try { return ss.href && ss.href.endsWith("/ext/trainer-ext.css"); } catch { return false; }
    });
    if (!exists && !document.querySelector(`link[href*="ext/trainer-ext.css"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      console.log("🎨 trainer-ext.css подключён:", href);
    }
  } catch (e) {
    console.warn("⚠️ Не удалось подключить trainer-ext.css:", e);
  }
})();

/**
 * 2) Предзагружаем звуки (без падения при ошибке автоплея).
 */
(function ensureSounds() {
  try {
    preloadSounds();
    console.log("🔊 Звуки предзагружены");
  } catch (e) {
    console.warn("⚠️ Ошибка предзагрузки звуков:", e);
  }
})();

/**
 * 3) Экспорт точки монтирования UI.
 *    Оставляем именованный и дефолтный экспорт — чтобы было удобно вызывать из любого места.
 */
export const mountTrainerUI = _mountTrainerUI;
export default _mountTrainerUI;

console.log("✅ Тренажёр инициализирован: CSS+SFX готовы");
