// core/MultiDigitGenerator.js - Генератор многозначных примеров

/**
 * MultiDigitGenerator - класс-обёртка для генерации многозначных примеров.
 * 
 * Принимает любое правило (SimpleRule, BrothersRule, FriendsRule...) и применяет
 * его к каждому разряду НЕЗАВИСИМО, формируя многозначные числа.
 * 
 * КЛЮЧЕВЫЕ ОСОБЕННОСТИ:
 * 1. Каждый разряд живёт по правилам базового правила (физика абакуса)
 * 2. Использует ВЫБРАННЫЕ в настройках цифры (selectedDigits из config)
 * 3. Цифры в одном числе уникальны (например +21 ✅, +22 редко)
 * 4. Поддержка переменной разрядности (+389-27+164)
 * 5. Избегание нулевых разрядов (+20 максимум 1 раз)
 * 
 * ПРИМЕР 1 (выбрано [1,2,3,4,5]):
 * Разрядность: 2
 * Результат: +21+34-12+51 = 94
 * 
 * ПРИМЕР 2 (выбрано [1,2,3,4,5,6,7,8,9]):
 * Разрядность: 2
 * Результат: +19-76+82+34 = 59
 */

export class MultiDigitGenerator {
  /**
   * @param {Class} RuleClass - класс правила (UnifiedSimpleRule, BrothersRule...)
   * @param {number} maxDigitCount - максимальное количество разрядов (2-9)
   * @param {Object} config - конфигурация
   */
  constructor(RuleClass, maxDigitCount, config = {}) {
    // Создаём экземпляр базового правила с теми же настройками
    // selectedDigits берутся из config - пользователь выбирает их в UI
    this.baseRule = new RuleClass(config);
    
    // ВАЖНО: Количество разрядов в ПРИМЕРЕ (что показываем пользователю)
    this.displayDigitCount = Math.max(1, Math.min(9, maxDigitCount));
    
    // ВАЖНО: Абакус всегда на 1 разряд БОЛЬШЕ для переноса!
    this.maxDigitCount = this.displayDigitCount + 1;
    
    console.log(`📊 Разрядность: пример=${this.displayDigitCount}, абакус=${this.maxDigitCount}`);
    
    this.config = {
      ...config,
      maxDigitCount: this.maxDigitCount,
      
      // Режим переменной разрядности (переключатель в UI)
      // true: +123-12+56 (разная длина чисел)
      // false: +123+456-789 (фиксированная длина)
      variableDigitCounts: config.variableDigitCounts ?? false,
      
      // Вероятность повторяющихся цифр (+22, +33) - редко!
      duplicateDigitProbability: 0.1, // 10% шанс
      
      // Максимум нулевых разрядов в примере (+20, +100)
      maxZeroDigits: 1,
      
      // Счётчики для контроля редких событий
      _duplicatesUsed: 0,
      _zeroDigitsUsed: 0
    };
    
    // Имя для логов
    this.name = `${this.baseRule.name} (Multi-Digit ${this.displayDigitCount})`;
    
    // Получаем selectedDigits из базового правила
    const selectedDigits = this.baseRule.config?.selectedDigits || [];
    
    console.log(`🔢 MultiDigitGenerator создан:
  Базовое правило: ${this.baseRule.name}
  Разрядность примера: ${this.displayDigitCount}
  Разрядность абакуса: ${this.maxDigitCount} (+1 для переноса)
  Выбранные цифры: [${selectedDigits.join(', ')}]
  Переменная разрядность: ${this.config.variableDigitCounts}
  Вероятность дубликатов: ${this.config.duplicateDigitProbability * 100}%
  Макс. нулей: ${this.config.maxZeroDigits}`);
  }

  /**
   * Главный метод генерации примера
   * Вызывается из ExampleGenerator
   */
  generateExample() {
    const stepsCount = this.baseRule.generateStepsCount 
      ? this.baseRule.generateStepsCount() 
      : 5;
    
    console.log(`🎲 Генерируем пример: ${stepsCount} шагов`);
    
    // Максимум попыток
    const maxAttempts = 500;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const example = this._generateAttempt(stepsCount);
        
        // Валидация через базовое правило (если есть)
        if (this.baseRule.validateExample && !this.baseRule.validateExample(example)) {
          continue;
        }
        
        console.log(`✅ Пример сгенерирован за ${attempt} попыток`);
        return example;
      } catch (err) {
        if (attempt % 100 === 0) {
          console.warn(`⚠️ Попытка ${attempt}/${maxAttempts}:`, err.message);
        }
      }
    }
    
    throw new Error('Не удалось сгенерировать валидный пример');
  }

  /**
   * Одна попытка генерации примера
   */
  _generateAttempt(stepsCount) {
    // Сброс счётчиков
    this.config._duplicatesUsed = 0;
    this.config._zeroDigitsUsed = 0;
    
    const startState = 0; // Всегда начинаем с 0
    let currentState = startState;
    const steps = [];
    
    for (let i = 0; i < stepsCount; i++) {
      const isFirst = (i === 0);
      
      // Генерируем многозначное число
      const action = this._generateMultiDigitAction(currentState, isFirst);
      
      if (action === null) {
        throw new Error(`Не удалось сгенерировать действие на шаге ${i}`);
      }
      
      const nextState = currentState + action;
      
      // Проверка границ
      if (nextState < 0 || nextState >= Math.pow(10, this.maxDigitCount)) {
        throw new Error(`Состояние вышло за границы: ${nextState}`);
      }
      
      steps.push({
        action: action,
        fromState: currentState,
        toState: nextState
      });
      
      currentState = nextState;
    }
    
    return {
      start: startState,
      steps: steps,
      answer: currentState
    };
  }

  /**
   * Генерация многозначного действия (+123, -456, и т.д.)
   */
  _generateMultiDigitAction(currentState, isFirst) {
    const { variableDigitCounts } = this.config;
    const selectedDigits = this.baseRule.config?.selectedDigits || [1, 2, 3, 4, 5];
    
    // Определяем разрядность этого числа
    let digitCount;
    if (variableDigitCounts) {
      // Переменная разрядность: от 1 до displayDigitCount
      digitCount = 1 + Math.floor(Math.random() * this.displayDigitCount);
    } else {
      // Фиксированная разрядность
      digitCount = this.displayDigitCount;
    }
    
    // Генерируем цифры
    const digits = [];
    const usedDigits = new Set();
    
    for (let pos = 0; pos < digitCount; pos++) {
      let digit;
      let attempts = 0;
      const maxDigitAttempts = 50;
      
      while (attempts < maxDigitAttempts) {
        // Выбираем случайную цифру из доступных
        digit = selectedDigits[Math.floor(Math.random() * selectedDigits.length)];
        
        // Проверка на уникальность (но иногда разрешаем дубликаты)
        const allowDuplicate = Math.random() < this.config.duplicateDigitProbability;
        
        if (!usedDigits.has(digit) || allowDuplicate) {
          // Проверка на нули (первая цифра не может быть 0)
          if (pos === 0 && digit === 0) {
            attempts++;
            continue;
          }
          
          // Ограничение на количество нулей
          if (digit === 0 && this.config._zeroDigitsUsed >= this.config.maxZeroDigits) {
            attempts++;
            continue;
          }
          
          break;
        }
        
        attempts++;
      }
      
      if (attempts >= maxDigitAttempts) {
        // Не удалось подобрать цифру - берем любую доступную
        digit = selectedDigits[0];
      }
      
      digits.push(digit);
      usedDigits.add(digit);
      
      if (digit === 0) {
        this.config._zeroDigitsUsed++;
      }
    }
    
    // Собираем число из цифр
    let number = 0;
    for (let i = 0; i < digits.length; i++) {
      number += digits[i] * Math.pow(10, digits.length - 1 - i);
    }
    
    // Определяем знак
    let sign;
    if (isFirst) {
      sign = 1; // Первое действие всегда положительное
    } else if (currentState === 0) {
      sign = 1; // Если состояние 0, только положительное
    } else {
      // Проверяем флаги onlyAddition/onlySubtraction
      const onlyAddition = this.baseRule.config?.onlyAddition ?? false;
      const onlySubtraction = this.baseRule.config?.onlySubtraction ?? false;
      
      if (onlyAddition) {
        sign = 1;
      } else if (onlySubtraction) {
        sign = -1;
      } else {
        sign = Math.random() < 0.5 ? 1 : -1;
      }
    }
    
    const action = number * sign;
    
    // Финальная проверка: не выходим ли за границы
    const nextState = currentState + action;
    if (nextState < 0 || nextState >= Math.pow(10, this.maxDigitCount)) {
      return null;
    }
    
    return action;
  }

  /**
   * Методы для совместимости с интерфейсом правил
   */
  getAvailableActions(state, isFirst, position) {
    // Не используется в MultiDigitGenerator, но нужно для совместимости
    return [];
  }

  applyAction(state, action) {
    return state + action;
  }

  validateExample(example) {
    // Базовая валидация
    if (!example || !example.steps || example.steps.length === 0) {
      return false;
    }
    
    // Делегируем валидацию базовому правилу
    if (this.baseRule.validateExample) {
      return this.baseRule.validateExample(example);
    }
    
    return true;
  }

  generateStartState() {
    return 0;
  }

  generateStepsCount() {
    return this.baseRule.generateStepsCount 
      ? this.baseRule.generateStepsCount() 
      : 5;
  }
}
