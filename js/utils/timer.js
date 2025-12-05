/**
 * timer.js — Таймеры для тренажёра
 *
 * 1) Секундомер (легаси UI): mm:ss в элементе по ID
 *    - startTimer(elementId?: string)
 *    - stopTimer(): number
 *    - getElapsedTime(): number
 *    - isRunning(): boolean
 *    - formatTime(totalSeconds): string      // "mm:ss"
 *
 * 2) Пер-пример обратный отсчёт (новый по ТЗ)
 *    - startAnswerTimer(limit: number|string, options?: {
 *        onTick?: (remainingMs:number)=>void,
 *        onExpire?: ()=>void,
 *        textElementId?: string,
 *        barSelector?: string
 *      })
 *      // limit может быть:
 *      //   1            → 1 минута
 *      //   "1 минута"   → 1 минута
 *      //   "1:30"       → 1 минута 30 секунд
 *      //   "30 сек"     → 30 секунд
 *      //   60000        → 60000 мс (распознаётся как мс)
 *    - stopAnswerTimer()
 *    - getRemainingMs(): number
 *    - isAnswerTimerRunning(): boolean
 */

/* =========================
 * 1) СЕКУНДОМЕР (как было)
 * ========================= */
let timerInterval = null;
let seconds = 0;
let displayElementId = null;

/** Запуск секундомера (mm:ss) */
export function startTimer(elementId = 'timer') {
  stopTimer();
  seconds = 0;
  displayElementId = elementId;
  updateStopwatchDisplay();
  timerInterval = setInterval(() => {
    seconds++;
    updateStopwatchDisplay();
  }, 1000);
}

/** Остановка секундомера, возвращает прошедшие секунды */
export function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  return seconds;
}

/** Текущее значение секундомера в секундах */
export function getElapsedTime() {
  return seconds;
}

/** Секундомер запущен? */
export function isRunning() {
  return timerInterval !== null;
}

/** Обновление отображения секундомера (mm:ss) */
function updateStopwatchDisplay() {
  if (!displayElementId) return;
  const el = document.getElementById(displayElementId);
  if (!el) return;
  el.textContent = formatTime(seconds);
}

// Преобразует миллисекунды в формат MM:SS
export function formatTime(ms) {
  if (typeof ms !== "number" || !isFinite(ms) || ms < 0) return "00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${mm}:${ss}`;
}

/* ======================================
 * 2) ПЕР- ПРИМЕР ОБРАТНЫЙ ОТСЧЁТ (НОВЫЙ)
 * ====================================== */
let answerTimerId = null;       // setInterval id
let answerTimerEndAt = 0;       // timestamp ms
let answerTimerTotal = 0;       // duration ms
let answerTimerOpts = null;     // { onTick, onExpire, textElementId, barSelector }

/**
 * Универсальный парсер длительности → миллисекунды
 * Поддерживает: "MM:SS", "1 мин", "30 сек", "90s", чистые числа (минуты),
 * а также числовые миллисекунды (распознаются автоматически).
 */
function toDurationMs(limit) {
  // 1) Формат "MM:SS"
  if (typeof limit === 'string' && limit.includes(':')) {
    const [mRaw, sRaw] = limit.split(':');
    const m = parseInt(String(mRaw).trim(), 10) || 0;
    const s = parseInt(String(sRaw).trim(), 10) || 0;
    return (m * 60 + s) * 1000;
  }

  // Нормализуем строку для распознавания единиц
  const str = String(limit).trim().toLowerCase();

  // 2) Секунды в тексте
  if (/[0-9]/.test(str) && /(сек|sec|s)\b/.test(str)) {
    const n = parseFloat(str.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
    return Math.round(n * 1000);
  }

  // 3) Минуты в тексте
  if (/[0-9]/.test(str) && /(мин|хв|min|m)\b/.test(str)) {
    const n = parseFloat(str.replace(',', '.').replace(/[^\d.]/g, '')) || 0;
    return Math.round(n * 60 * 1000);
  }

  // 4) Чистое число
  if (!isNaN(Number(limit))) {
    const num = Number(limit);

    // эвристика: большие числа считаем миллисекундами
    // (например, 60000 → уже мс)
    if (num >= 10000) return Math.round(num);

    // иначе трактуем как минуты (требование задачи)
    return Math.round(num * 60 * 1000);
  }

  // Фолбэк
  return 0;
}

/**
 * Запуск обратного отсчёта. Принимает минуты/секунды/мм:сс/мс.
 * @param {number|string} limit
 * @param {{onTick?:Function,onExpire?:Function,textElementId?:string,barSelector?:string}} [options]
 */
export function startAnswerTimer(limit, options = {}) {
  stopAnswerTimer(); // гасим, если был

  const durationMs = toDurationMs(limit);
  if (!durationMs || durationMs <= 0) return;

  answerTimerTotal = durationMs;
  answerTimerEndAt = Date.now() + durationMs;
  answerTimerOpts = options;

  // Первый рендер
  tickAnswerTimer(true);

  // Периодическое обновление (100 мс)
  answerTimerId = setInterval(tickAnswerTimer, 100);
}

/** Остановка обратного отсчёта */
export function stopAnswerTimer() {
  if (answerTimerId) clearInterval(answerTimerId);
  answerTimerId = null;
  answerTimerEndAt = 0;
  answerTimerTotal = 0;
  answerTimerOpts = null;
}

/** Остаток миллисекунд (если не запущен — 0) */
export function getRemainingMs() {
  if (!isAnswerTimerRunning()) return 0;
  return Math.max(0, answerTimerEndAt - Date.now());
}

/** Обратный отсчёт активен? */
export function isAnswerTimerRunning() {
  return !!answerTimerId && answerTimerEndAt > 0;
}
// --- внутреннее: шаг тика обратного отсчёта ---
function tickAnswerTimer(firstPaint = false) {
  const now = Date.now();
  let remaining = Math.max(0, answerTimerEndAt - now);

  // Текст "mm:ss"
  if (answerTimerOpts?.textElementId) {
    const el = document.getElementById(answerTimerOpts.textElementId);
    if (el) {
      // передаём миллисекунды в formatTime()
      el.textContent = formatTime(remaining);
    }
  }

  // Прогресс-бар
  if (answerTimerOpts?.barSelector) {
    const barEl = document.querySelector(answerTimerOpts.barSelector);
    if (barEl && answerTimerTotal > 0) {
      const used = answerTimerTotal - remaining;
      const pct = Math.max(0, Math.min(100, (used / answerTimerTotal) * 100));
      barEl.style.width = pct + '%';
    }
  }

  // Колбэк onTick
  if (!firstPaint && typeof answerTimerOpts?.onTick === 'function') {
    try {
      answerTimerOpts.onTick(remaining);
    } catch (_) {}
  }

  // Завершение таймера
  if (remaining <= 0) {
    const onExpire = answerTimerOpts?.onExpire;
    stopAnswerTimer();
    if (typeof onExpire === 'function') {
      try {
        onExpire();
      } catch (_) {}
    }
  }
}
