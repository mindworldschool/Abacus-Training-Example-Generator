// ext/components/LeoModal.js - Модальное окно с фразами Лео
import { playSound } from '../../js/utils/sound.js';

/**
 * LeoModal - компонент для показа результата (правильно/неправильно)
 * с фразами от персонажа Лео и автоматическим закрытием
 */
export class LeoModal {
  constructor() {
    // Фразы Лео для разных языков (пока только RU)
    this.phrases = {
      ru: {
        correct: [
          "Отлично! Лео доволен твоей скоростью!",
          "Супер! Мозг качается, как лев!",
          "Точно в цель! Продолжаем!",
          "Есть контакт! Ты считаешь мощно!",
          "Браво! Следующий пример ещё интереснее!",
          "Лев рычит от радости — правильно!"
        ],
        wrong: [
          "Чуть-чуть мимо. Давай попробуем иначе!",
          "Не страшно! Ошибки — ступеньки к силе.",
          "Стоп! Вдох-выдох — и ещё раз.",
          "Лео подскажет: смотри на знак и шаг.",
          "Мы ближе, чем кажется. Ещё попытка!",
          "Хорошая попытка! Сейчас возьмём верный ход."
        ]
      },
      ua: {
        correct: [
          "Відмінно! Лео задоволений твоєю швидкістю!",
          "Супер! Мозок качається, як лев!",
          "Точно в ціль! Продовжуємо!",
          "Є контакт! Ти рахуєш потужно!",
          "Браво! Наступний приклад ще цікавіший!",
          "Лев ричить від радості — правильно!"
        ],
        wrong: [
          "Трошки мимо. Давай спробуємо інакше!",
          "Не страшно! Помилки — сходинки до сили.",
          "Стоп! Вдих-видих — і ще раз.",
          "Лео підкаже: дивись на знак і крок.",
          "Ми ближче, ніж здається. Ще спроба!",
          "Гарна спроба! Зараз візьмемо вірний хід."
        ]
      },
      en: {
        correct: [
          "Excellent! Leo is proud of your speed!",
          "Super! Your brain is flexing like a lion!",
          "Right on target! Let's keep going!",
          "Contact! You're calculating powerfully!",
          "Bravo! The next example is even more interesting!",
          "Leo roars with joy — correct!"
        ],
        wrong: [
          "Almost there. Let's try differently!",
          "No worries! Mistakes are steps to strength.",
          "Stop! Breathe in, breathe out — and again.",
          "Leo hints: look at the sign and step.",
          "We're closer than it seems. One more try!",
          "Good attempt! Now let's take the right move."
        ]
      }
    };

    this.modal = null;
    this.autoCloseTimer = null;
    this.currentLanguage = 'ru'; // по умолчанию русский
    
    this.createModal();
  }

  /**
   * Установка языка для фраз
   * @param {string} lang - Код языка: 'ru', 'ua', 'en'
   */
  setLanguage(lang) {
    if (this.phrases[lang]) {
      this.currentLanguage = lang;
    }
  }

  /**
   * Создание DOM-элемента модального окна
   */
  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'leo-modal';
    this.modal.innerHTML = `
      <div class="leo-modal__card">
        <div class="leo-modal__icon">🦁</div>
        <h3 class="leo-modal__title"></h3>
        <p class="leo-modal__text"></p>
      </div>
    `;
    document.body.appendChild(this.modal);
    
    console.log('✅ LeoModal создан и добавлен в DOM');
  }

  /**
   * Показ модального окна с результатом
   * @param {boolean} isCorrect - Правильный ли ответ
   * @param {Function} onClose - Колбэк после закрытия (опционально)
   */
  show(isCorrect, onClose = null) {
    // Очищаем предыдущий таймер, если был
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }

    // Получаем фразы для текущего языка
    const langPhrases = this.phrases[this.currentLanguage] || this.phrases.ru;
    const phrases = isCorrect ? langPhrases.correct : langPhrases.wrong;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    // Стили в зависимости от результата
    const bgColor = isCorrect ? '#4ade80' : '#fb923c'; // зелёный / янтарный
    const title = isCorrect ? '✓ Правильно!' : '✗ Неправильно';

    // Обновляем содержимое
    const card = this.modal.querySelector('.leo-modal__card');
    const titleEl = this.modal.querySelector('.leo-modal__title');
    const textEl = this.modal.querySelector('.leo-modal__text');

    card.style.background = bgColor;
    card.style.color = '#fff';
    titleEl.textContent = title;
    textEl.textContent = phrase;

    // Показываем модалку
    this.modal.classList.add('leo-modal--open');

    // Воспроизводим звук
    playSound(isCorrect ? 'correct' : 'wrong');

    console.log(`🦁 LeoModal показан: ${isCorrect ? 'правильно' : 'неправильно'}`);

    // Автоматическое закрытие через 3 секунды
    this.autoCloseTimer = setTimeout(() => {
      this.hide();
      if (onClose) {
        onClose();
      }
    }, 3000);
  }

  /**
   * Скрытие модального окна
   */
  hide() {
    this.modal.classList.remove('leo-modal--open');
    
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
    
    console.log('🦁 LeoModal скрыт');
  }

  /**
   * Удаление модального окна из DOM
   */
  destroy() {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
    this.modal = null;
    console.log('🦁 LeoModal удалён');
  }
}
