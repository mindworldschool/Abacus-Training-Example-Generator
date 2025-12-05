// ext/components/ExampleView.js - Отображение примера (столбиком/в строку)
// 🔥 ИСПРАВЛЕНО: Добавлен механизм остановки пошагового показа

export class ExampleView {
  constructor(container) {
    this.container = container;
    this.displayMode = "column"; // "column" | "inline"
    this.currentTimer = null;     // ✅ ID текущего таймера
    this.isAnimating = false;     // ✅ Флаг активной анимации
  }

  /**
   * Установка режима отображения
   * @param {string} mode - 'column' или 'inline'
   */
  setDisplayMode(mode) {
    if (mode === "column" || mode === "inline") {
      this.displayMode = mode;
    }
  }

  /**
   * Рендер примера (массив строк типа "+2", "-5")
   * @param {Array<string>|string} steps - массив шагов или строка
   * @param {string} mode - режим отображения (опционально)
   */
  render(steps, mode = null) {
    // ✅ Останавливаем анимацию если она была
    this.stopAnimation();
    
    if (mode) {
      this.setDisplayMode(mode);
    }

    // Очищаем контейнер
    this.container.innerHTML = "";
    this.container.className = `example-view example--${this.displayMode}`;

    // Универсальность: поддерживаем и старый формат (expr = "+3 +1 -2")
    let stepsArray = [];
    if (Array.isArray(steps)) {
      stepsArray = steps;
    } else if (typeof steps === "string") {
      stepsArray = steps.trim().split(/\s+/);
    } else {
      console.warn("⚠️ ExampleView: неверный формат steps:", steps);
      return;
    }

    // 🔥 АДАПТИВНАЯ СТИЛИЗАЦИЯ
    this._applyAdaptiveStyles(stepsArray);

    if (this.displayMode === "column") {
      this.renderColumn(stepsArray);
    } else {
      this.renderInline(stepsArray);
    }
  }

  /**
   * 🔥 НОВОЕ: Применяет адаптивные стили в зависимости от длины чисел
   * @param {Array<string>} steps
   */
  _applyAdaptiveStyles(stepsArray) {
    // Находим максимальную длину числа
    let maxLength = 0;
    for (const step of stepsArray) {
      // Убираем знак + или - и считаем длину
      const numberStr = step.replace(/[+-]/g, '');
      maxLength = Math.max(maxLength, numberStr.length);
    }

    console.log(`📏 Максимальная длина числа: ${maxLength} разрядов, всего действий: ${stepsArray.length}`);

    // 🔥 АДАПТИВНЫЙ РАЗМЕР ШРИФТА
    let fontSize;
    if (maxLength <= 1) {
      fontSize = 72; // Однозначные - БОЛЬШОЙ шрифт
    } else if (maxLength === 2) {
      fontSize = 64; // Двузначные
    } else if (maxLength === 3) {
      fontSize = 56; // Трёхзначные
    } else if (maxLength <= 5) {
      fontSize = 48; // 4-5 разрядов
    } else if (maxLength <= 7) {
      fontSize = 40; // 6-7 разрядов
    } else if (maxLength <= 9) {
      fontSize = 32; // 8-9 разрядов
    } else {
      fontSize = 28; // Больше 9 разрядов
    }

    // 🔥 АДАПТИВНАЯ ШИРИНА ОКНА
    // Базовая ширина + ширина на каждый разряд
    const baseWidth = 200; // Минимальная ширина
    const widthPerDigit = 32; // Пикселей на каждый разряд (при fontSize=56)
    const adaptiveWidth = baseWidth + (maxLength * widthPerDigit * (fontSize / 56));
    
    // Максимальная ширина - не больше 90% экрана
    const maxWidth = window.innerWidth * 0.9;
    const finalWidth = Math.min(adaptiveWidth, maxWidth);

    // 🔥 ВЫСОТА С УЧЁТОМ КОЛИЧЕСТВА ДЕЙСТВИЙ
    const lineHeight = fontSize * 1.4; // Межстрочный интервал
    const maxVisibleLines = 12; // Максимум видимых строк
    const contentHeight = stepsArray.length * lineHeight;
    const maxHeight = maxVisibleLines * lineHeight;

    // Применяем стили к контейнеру
    this.container.style.fontSize = `${fontSize}px`;
    this.container.style.lineHeight = `${lineHeight}px`;
    this.container.style.width = `${finalWidth}px`;
    this.container.style.minWidth = `${baseWidth}px`;
    this.container.style.maxWidth = `${maxWidth}px`;
    
    // 🔥 ВСЕГДА ВЫРАВНИВАНИЕ СЛЕВА
    this.container.style.textAlign = 'left';
    this.container.style.justifyContent = 'flex-start';
    
    // 🔥 СКРОЛЛ ДЛЯ ДЛИННЫХ СПИСКОВ
    if (stepsArray.length > maxVisibleLines) {
      this.container.style.maxHeight = `${maxHeight}px`;
      this.container.style.overflowY = 'auto';
      this.container.style.overflowX = 'hidden';
      console.log(`📜 Включён скролл: ${stepsArray.length} действий > ${maxVisibleLines}`);
    } else {
      this.container.style.maxHeight = 'none';
      this.container.style.overflowY = 'visible';
    }

    // 🔥 ОТСТУПЫ ВНУТРИ ОКНА
    this.container.style.padding = '20px';
    this.container.style.boxSizing = 'border-box';

    console.log(`✅ Стили применены: fontSize=${fontSize}px, width=${finalWidth}px, строк=${stepsArray.length}`);
  }

  /**
   * Рендер в столбик (каждый шаг на новой строке)
   * @param {Array<string>} steps
   */
  renderColumn(steps) {
    for (const step of steps) {
      const line = document.createElement("div");
      line.className = "example__line";
      line.textContent = step;
      
      // 🔥 ВСЕГДА СЛЕВА
      line.style.textAlign = 'left';
      line.style.width = '100%';
      
      this.container.appendChild(line);
    }
  }

  /**
   * Рендер в строку (все шаги одной линией)
   * @param {Array<string>} steps
   */
  renderInline(steps) {
    const line = document.createElement("div");
    line.className = "example__line example__line--inline";
    line.textContent = steps.join(" ");
    
    // 🔥 ВСЕГДА СЛЕВА
    line.style.textAlign = 'left';
    line.style.width = '100%';
    
    this.container.appendChild(line);
  }

  /**
   * Автоматическое масштабирование шрифта
   * (используется trainer_logic.js, здесь только запасной вариант)
   * @param {number} lineCount
   */
  adjustFontSize(lineCount) {
    // Теперь используется _applyAdaptiveStyles
    // Эта функция оставлена для совместимости
    console.log(`📏 adjustFontSize вызван, но используется _applyAdaptiveStyles`);
  }

  /**
   * Пошаговый показ (для диктовки или длинных цепочек)
   * @param {Array<string>} steps
   * @param {number} speed - интервал в мс
   * @param {Function} onComplete - callback после показа
   */
  renderStepByStep(steps, speed = 1000, onComplete = null) {
    // ✅ Останавливаем предыдущий показ
    this.stopAnimation();
    this.isAnimating = true;  // ✅ Устанавливаем флаг
    
    this.container.innerHTML = "";
    this.container.className = `example-view example--${this.displayMode}`;

    let index = 0;
    const stepsArray = Array.isArray(steps)
      ? steps
      : String(steps).trim().split(/\s+/);

    // 🔥 ПРИМЕНЯЕМ АДАПТИВНЫЕ СТИЛИ ПЕРЕД ПОКАЗОМ
    this._applyAdaptiveStyles(stepsArray);

    const showNext = () => {
      // ✅ ПРОВЕРКА: остановлен ли показ?
      if (!this.isAnimating) {
        console.log('⏹️ Пошаговый показ остановлен');
        return;
      }

      if (index >= stepsArray.length) {
        this.isAnimating = false;  // ✅ Сброс флага
        if (onComplete) onComplete();
        return;
      }

      if (this.displayMode === "column") {
        const line = document.createElement("div");
        line.className = "example__line";
        line.textContent = stepsArray[index];
        
        // 🔥 ВСЕГДА СЛЕВА
        line.style.textAlign = 'left';
        line.style.width = '100%';
        
        this.container.appendChild(line);
        
        // 🔥 АВТО-СКРОЛЛ К ПОСЛЕДНЕЙ СТРОКЕ
        if (this.container.scrollHeight > this.container.clientHeight) {
          this.container.scrollTop = this.container.scrollHeight;
        }
      } else {
        let line =
          this.container.querySelector(".example__line") ||
          (() => {
            const el = document.createElement("div");
            el.className = "example__line example__line--inline";
            el.style.textAlign = 'left';
            el.style.width = '100%';
            this.container.appendChild(el);
            return el;
          })();
        line.textContent = line.textContent
          ? `${line.textContent} ${stepsArray[index]}`
          : stepsArray[index];
      }

      index++;
      // ✅ СОХРАНЯЕМ ID ТАЙМЕРА
      this.currentTimer = setTimeout(showNext, speed);
    };

    showNext();
  }

  /**
   * ⏹️ НОВОЕ: Остановка пошагового показа
   */
  stopAnimation() {
    if (this.currentTimer) {
      clearTimeout(this.currentTimer);
      this.currentTimer = null;
      console.log('⏹️ Таймер очищен');
    }
    this.isAnimating = false;
  }

  /**
   * Очистка контейнера
   */
  clear() {
    // ✅ Останавливаем анимацию перед очисткой
    this.stopAnimation();
    
    this.container.innerHTML = "";
    // Сброс стилей
    this.container.style.fontSize = '';
    this.container.style.lineHeight = '';
    this.container.style.width = '';
    this.container.style.maxHeight = '';
    this.container.style.overflowY = '';
  }
}
