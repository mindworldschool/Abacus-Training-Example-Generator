/**
 * BigStepOverlay.js — визуальный компонент для покадрового показа примеров
 * Используется, если включен showSpeedEnabled в настройках.
 *
 * Пример использования:
 * import { BigStepOverlay } from "../ui/components/BigStepOverlay.js";
 * const overlay = new BigStepOverlay();
 * overlay.show("+3");
 * await delay(500);
 * overlay.hide();
 */

export class BigStepOverlay {
  constructor(scale = 1.15, color = "#EC8D00") {
    // Создаём элемент оверлея, если его ещё нет
    this.el = document.createElement("div");
    this.el.id = "big-step-overlay";
    this.el.style.setProperty("--big-scale", String(scale));
    this.el.style.setProperty("--big-color", color);

    document.body.appendChild(this.el);
  }

  /**
   * Показать шаг (например, "+3" или "−5")
   * @param {string|number} text
   * @param {string} [color] - Optional color override
   */
  show(text, color = null) {
    this.el.textContent = text;
    if (color) {
      this.el.style.setProperty("--big-color", color);
    }
    this.el.classList.add("show");
  }

  /** Скрыть */
  hide() {
    this.el.classList.remove("show");
  }

  /** Полная очистка (скрыть и стереть текст) */
  clear() {
    this.hide();
    this.el.textContent = "";
  }
}
