// core/rules/BaseRule.js - Базовое правило для генерации примеров

/**
 * BaseRule - абстрактный базовый класс для всех правил генерации примеров.
 * Он задаёт общий интерфейс и безопасные дефолты.
 *
 * ВАЖНО:
 *  - Конкретные режимы (например "Просто") МОГУТ и ДОЛЖНЫ переопределять
 *    generateStartState(), generateStepsCount(), getAvailableActions(),
 *    validateExample() и т.д.
 *
 *  - Здесь НЕ должно быть жёстких методических ограничений
 *    (например "стойка максимум 9" или "стартуем с 10"),
 *    потому что это ломает специализированные режимы.
 */
export class BaseRule {
  constructor(config = {}) {
    // 🔥 ИСПРАВЛЕНИЕ: убрали this.name - дочерние классы сами устанавливают имя
    this.description = "Базовая логика для всех правил";

    // Базовая конфигурация.
    // ВНИМАНИЕ: не навязываем maxState=9 жёстко.
    // Наследник (например UnifiedSimpleRule) может передать свой maxState
    // (4 для 'Просто 4' или 9 для 'Просто 5'), и мы не должны его перетирать.
    this.config = {
      minState: 0,             // Минимальное состояние для каждого разряда
      maxState: config.maxState ?? 9, // Максимальное состояние (по умолчанию 9, но уважать входной config)

      minSteps: config.minSteps ?? 1, // Минимальное количество шагов
      maxSteps: config.maxSteps ?? 3, // Максимальное количество шагов

      allowedActions: config.allowedActions ?? [],   // Разрешённые действия (если правило использует статический список)
      forbiddenActions: config.forbiddenActions ?? [],

      digitCount: config.digitCount ?? 1,            // Количество разрядов (1=однозначные, 2=двузначные и т.д.)
      combineLevels: config.combineLevels ?? false,  // Комбинировать уровни (все разряды движутся одновременно)

      onlyAddition: config.onlyAddition ?? false,     // Только сложение
      onlySubtraction: config.onlySubtraction ?? false, // Только вычитание

      // Дополнительные параметры (могут использоваться специализированными правилами)
      selectedDigits: config.selectedDigits ?? [],    // Выбранные цифры для генерации
      includeFive: config.includeFive ?? true,        // Включать пятёрку (для UnifiedSimpleRule)

      ...config  // Все остальные параметры из входного config
    };
  }

  /**
   * Генерация стартового состояния
   * Дочерние классы ДОЛЖНЫ переопределить этот метод если нужна своя логика
   * 
   * @returns {number|Array} Стартовое состояние (число или массив для многоразрядных)
   */
  generateStartState() {
    // По умолчанию начинаем с 0
    if (this.config.digitCount === 1) {
      return 0;
    }
    
    // Для многоразрядных - массив нулей
    return new Array(this.config.digitCount).fill(0);
  }

  /**
   * Генерация количества шагов в примере
   * Дочерние классы могут переопределить
   * 
   * @returns {number} Количество шагов
   */
  generateStepsCount() {
    const { minSteps, maxSteps } = this.config;
    
    if (minSteps === maxSteps) {
      return minSteps;
    }
    
    return minSteps + Math.floor(Math.random() * (maxSteps - minSteps + 1));
  }

  /**
   * Получить список доступных действий для текущего состояния
   * ОБЯЗАТЕЛЬНО переопределяется в дочерних классах
   * 
   * @param {number|Array} state - Текущее состояние
   * @param {boolean} isFirst - Первое ли это действие в примере
   * @param {number} position - Позиция разряда (для многоразрядных)
   * @returns {Array<number>} Массив доступных действий
   */
  getAvailableActions(state, isFirst, position = 0) {
    console.warn("⚠️ BaseRule.getAvailableActions вызван напрямую - это заглушка!");
    
    // Заглушка: возвращаем простые действия ±1, ±2, ±3
    const actions = [];
    
    if (!isFirst && !this.config.onlyAddition) {
      actions.push(-3, -2, -1);
    }
    
    if (!this.config.onlySubtraction) {
      actions.push(1, 2, 3);
    }
    
    return actions;
  }

  /**
   * Применить действие к состоянию
   * Может быть переопределено в дочерних классах для сложной логики
   * 
   * @param {number|Array} state - Текущее состояние
   * @param {number|Array} action - Действие
   * @returns {number|Array} Новое состояние
   */
  applyAction(state, action) {
    if (Array.isArray(state)) {
      // Многоразрядная логика
      if (Array.isArray(action)) {
        return state.map((s, i) => s + (action[i] || 0));
      } else {
        // Одно действие на все разряды
        return state.map(s => s + action);
      }
    }
    
    // Одноразрядная логика
    return state + action;
  }

  /**
   * Валидация сгенерированного примера
   * Дочерние классы могут переопределить для специфичных проверок
   * 
   * @param {Object} example - Пример для проверки
   * @param {number|Array} example.start - Стартовое состояние
   * @param {Array} example.steps - Массив шагов
   * @param {number|Array} example.answer - Финальный ответ
   * @returns {boolean} Валиден ли пример
   */
  validateExample(example) {
    if (!example) {
      console.warn("⚠️ validateExample: пример пустой");
      return false;
    }

    if (!example.steps || example.steps.length === 0) {
      console.warn("⚠️ validateExample: нет шагов");
      return false;
    }

    // Базовая проверка: пересчитываем пример и сверяем ответ
    let currentState = example.start;
    
    for (const step of example.steps) {
      currentState = this.applyAction(currentState, step.action);
    }

    if (currentState !== example.answer) {
      console.warn(`⚠️ validateExample: ответ не совпадает. Ожидалось: ${example.answer}, получено: ${currentState}`);
      return false;
    }

    // Проверка флагов onlyAddition / onlySubtraction
    if (this.config.onlyAddition) {
      const hasNegative = example.steps.some(step => {
        const action = Array.isArray(step.action) ? step.action[0] : step.action;
        return action < 0;
      });
      
      if (hasNegative) {
        console.warn("⚠️ validateExample: найдены отрицательные действия при onlyAddition=true");
        return false;
      }
    }

    if (this.config.onlySubtraction) {
      const hasPositive = example.steps.some(step => {
        const action = Array.isArray(step.action) ? step.action[0] : step.action;
        return action > 0;
      });
      
      if (hasPositive) {
        console.warn("⚠️ validateExample: найдены положительные действия при onlySubtraction=true");
        return false;
      }
    }

    // Проверка границ состояний
    // Для многоразрядного режима (digitCount > 1) эта проверка отключается,
    // так как MultiDigitGenerator работает с большими числами (например 123)
    const isMultiDigitMode = this.config.digitCount > 1;

    if (!isMultiDigitMode) {
      currentState = example.start;
      for (const step of example.steps) {
        currentState = this.applyAction(currentState, step.action);

        // Для одноразрядных
        if (typeof currentState === 'number') {
          if (currentState < this.config.minState || currentState > this.config.maxState) {
            console.warn(`⚠️ validateExample: состояние ${currentState} вышло за границы [${this.config.minState}, ${this.config.maxState}]`);
            return false;
          }
        }

        // Для многоразрядных векторов
        if (Array.isArray(currentState)) {
          for (const digit of currentState) {
            if (digit < this.config.minState || digit > this.config.maxState) {
              console.warn(`⚠️ validateExample: разряд ${digit} вышел за границы [${this.config.minState}, ${this.config.maxState}]`);
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  /**
   * Проверка: разрешено ли действие
   * Вспомогательный метод для дочерних классов
   * 
   * @param {number} action - Действие
   * @returns {boolean} Разрешено ли
   */
  isActionAllowed(action) {
    const { allowedActions, forbiddenActions, onlyAddition, onlySubtraction } = this.config;

    // Проверка запрещённых действий
    if (forbiddenActions.length > 0 && forbiddenActions.includes(action)) {
      return false;
    }

    // Проверка разрешённых действий (если список не пустой)
    if (allowedActions.length > 0 && !allowedActions.includes(action)) {
      return false;
    }

    // Проверка флагов only
    if (onlyAddition && action < 0) {
      return false;
    }

    if (onlySubtraction && action > 0) {
      return false;
    }

    return true;
  }

  /**
   * Получить описание правила для логов
   * @returns {string} Описание
   */
  getDescription() {
    return `${this.name || 'BaseRule'}: ${this.description}`;
  }

  /**
   * Вывести конфигурацию в консоль (для отладки)
   */
  debugConfig() {
    console.log(`📋 Конфигурация правила ${this.name || 'BaseRule'}:`);
    console.log(JSON.stringify(this.config, null, 2));
  }
}
