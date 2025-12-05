/**
 * sound.js - Модуль для воспроизведения звуковых эффектов
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * import { playSound, preloadSounds } from './utils/sound.js';
 * 
 * preloadSounds(); // вызвать один раз при загрузке
 * playSound('correct'); // воспроизвести звук
 */

// Хранилище предзагруженных аудио
const sounds = {};

// Пути к звуковым файлам (адаптировано под структуру проекта)
const soundPaths = {
  correct: './assets/sfx_correct.mp3',  // правильный ответ
  wrong:   './assets/sfx_wrong.mp3',    // неправильный ответ
  next:    './assets/sfx_next.mp3',     // следующий пример
  tick:    './assets/sfx_tick.mp3',     // короткий бип (для диктанта)
  timeout: './assets/sfx_timeout.mp3'   // истечение времени
};

/**
 * Предзагрузка всех звуков
 * Вызывать один раз при инициализации приложения
 */
export function preloadSounds() {
  Object.keys(soundPaths).forEach(name => {
    const audio = new Audio(soundPaths[name]);
    audio.preload = 'auto';
    sounds[name] = audio;
  });
  console.log('✅ Звуки предзагружены:', Object.keys(sounds));
}

/**
 * Воспроизведение звука по имени
 * @param {string} name - Имя звука: 'correct', 'wrong', 'tick', 'timeout', 'next'
 * @param {{ volume?: number, playbackRate?: number }} [options]
 */
export function playSound(name, options = {}) {
  const { volume = 1, playbackRate = 1 } = options;
  const base = sounds[name];

  if (!base) {
    console.warn(`⚠️ Звук "${name}" не найден. Доступные:`, Object.keys(sounds));
    return;
  }

  try {
    // Клонируем, чтобы можно было проигрывать параллельно (tick может звучать быстро)
    const audio = base.cloneNode(true);
    audio.volume = clamp(volume);
    audio.playbackRate = clampRate(playbackRate);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (error) {
    console.error(`❌ Ошибка воспроизведения звука "${name}":`, error);
  }
}

/**
 * Установка режима mute
 * @param {boolean} muted - true = выключить звук
 */
export function setMuted(muted) {
  Object.values(sounds).forEach(a => (a.muted = muted));
}

/**
 * Установка громкости (0–1)
 */
export function setVolume(volume) {
  const v = clamp(volume);
  Object.values(sounds).forEach(a => (a.volume = v));
}

function clamp(x) {
  return Math.max(0, Math.min(1, x));
}
function clampRate(r) {
  return Math.max(0.5, Math.min(2, r));
}
