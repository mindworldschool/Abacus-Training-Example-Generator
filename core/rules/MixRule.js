// core/rules/MixRule.js
// Правило "Брати і Друзі Мікс" - комбинированные формулы (Друг + Брат)

import { BaseRule } from "./BaseRule.js";

/**
 * MixRule - правило "Мікс" для генерации примеров с комбинированными формулами
 * 
 * КОНЦЕПЦИЯ:
 * Комбинация правил "Братьев" (компенсация до 5) и "Друзей" (компенсация до 10)
 * используется когда основное действие требует "Друга", но компенсация требует "Брата"
 * 
 * ФОРМУЛЫ:
 * +7 = +10 - 3, где -3 может быть через -5 + 2 (друг + брат)
 * +8 = +10 - 2, где -2 может быть через -5 + 3 (друг + брат)
 * +6 = +10 - 4, где -4 может быть через -5 + 1 (друг + брат)
 * 
 * ИЕРАРХИЯ ПРИМЕНЕНИЯ:
 * 1. Пробуем "Просто" (прямой счет)
 * 2. Пробуем "Брат" (компенсация до 5)
 * 3. Пробуем "Друг" (компенсация до 10)
 * 4. Применяем "Друг + Брат" (комбинация)
 * 
 * ОСОБЕННОСТИ:
 * - Цифры: 6, 7, 8, 9
 * - Требует минимум 2 разряда
 * - Пример ОБЯЗАН содержать хотя бы 1 комбинированный шаг
 */
export class MixRule extends BaseRule {
  constructor(config = {}) {
    super(config);

    // Устанавливаем имя напрямую
    this.name = "Брати і Друзі Мікс";

    // Цифры для миксованных правил: [6,7,8,9]
    const mixDigits = Array.isArray(config.selectedDigits)
      ? config.selectedDigits.map(n => parseInt(n, 10)).filter(n => n >= 6 && n <= 9)
      : [6, 7, 8, 9]; // по умолчанию все

    // Какие цифры разрешены в блоке "Просто" для вспомогательных шагов
    const simpleBlockDigits = config.blocks?.simple?.digits
      ? config.blocks.simple.digits.map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 9)
      : [1, 2, 3, 4, 5]; // по умолчанию 1-5

    this.config = {
      ...this.config,
      name: "Брати і Друзі Мікс",
      minState: 0,
      maxState: 99, // Для двухразрядных
      minSteps: config.minSteps ?? 3,
      maxSteps: config.maxSteps ?? 7,
      mixDigits,
      simpleBlockDigits,
      onlyAddition: config.onlyAddition ?? false,
      onlySubtraction: config.onlySubtraction ?? false,
      digitCount: config.digitCount ?? 2, // ВАЖНО: минимум 2 разряда!
      combineLevels: config.combineLevels ?? false,
      mixPriority: 0.6, // 60% приоритет миксованным шагам
      blocks: config.blocks ?? {}
    };

    console.log(
      `🔄 MixRule: микс=[${mixDigits.join(", ")}], ` +
      `простые=[${simpleBlockDigits.join(", ")}], ` +
      `onlyAdd=${this.config.onlyAddition}, onlySub=${this.config.onlySubtraction}`
    );

    // Таблица миксованных комбинаций
    this.mixCombinations = this._buildMixCombinations(mixDigits);
  }

  /**
   * Получить "друга" для числа (дополнение до 10)
   */
  getFriend(n) {
    return 10 - n;
  }

  /**
   * Получить "брата" для числа (дополнение до 5)
   */
  getBrother(n) {
    return 5 - n;
  }

  /**
   * Создание таблицы миксованных комбинаций
   * Для каждой цифры из [6,7,8,9] определяем возможные комбинации Друг+Брат
   */
  _buildMixCombinations(digits) {
    const combinations = new Map();
    
    for (const n of digits) {
      const friend = this.getFriend(n); // дополнение до 10
      const brother = this.getBrother(friend); // дополнение до 5 для компенсации
      
      combinations.set(n, {
        digit: n,
        friend: friend,           // Сколько нужно вычесть после +10
        brother: brother,         // Как разложить friend через брата
        formula: `+${n} = +10 - ${friend} = +10 - (5 + ${friend - 5})`,
        microSteps: [
          { action: 10, type: 'friend', description: `+10 (десяток)` },
          { action: -5, type: 'brother', description: `-5 (верхняя бусина)` },
          { action: -(friend - 5), type: 'simple', description: `-${friend - 5} (нижние)` }
        ]
      });
      
      // Для вычитания аналогично
      combinations.set(-n, {
        digit: -n,
        friend: friend,
        brother: brother,
        formula: `-${n} = -10 + ${friend} = -10 + (5 + ${friend - 5})`,
        microSteps: [
          { action: -10, type: 'friend', description: `-10 (десяток)` },
          { action: 5, type: 'brother', description: `+5 (верхняя бусина)` },
          { action: (friend - 5), type: 'simple', description: `+${friend - 5} (нижние)` }
        ]
      });
    }
    
    console.log(`🔄 MixRule: создано ${combinations.size} комбинаций`);
    return combinations;
  }

  /**
   * Проверка: является ли переход "миксованным"
   */
  _isMixTransition(from, to) {
    const delta = to - from;
    
    // Проверяем, есть ли эта цифра в наших миксованных комбинациях
    if (this.mixCombinations.has(delta)) {
      const fromUnits = from % 10;
      const toUnits = to % 10;
      const fromTens = Math.floor(from / 10);
      const toTens = Math.floor(to / 10);
      
      // Для сложения: должен быть переход через десяток
      if (delta > 0) {
        // Проверяем что единицы "перепрыгнули" через 10
        // и что в единицах friend может быть разложен через брата
        const friend = this.getFriend(delta);
        return fromUnits + delta >= 10 && fromTens < 9 && friend > 5;
      }
      
      // Для вычитания: должен быть заем из десятка
      if (delta < 0) {
        const absDelta = Math.abs(delta);
        const friend = this.getFriend(absDelta);
        return fromUnits < absDelta && fromTens > 0 && friend > 5;
      }
    }
    
    return false;
  }

  /**
   * Получить список доступных действий для текущего состояния
   */
  getAvailableActions(state, isFirst, position = 0) {
    const actions = [];
    const { onlyAddition, onlySubtraction, mixDigits, simpleBlockDigits, mixPriority } = this.config;

    // Первое действие всегда положительное
    if (isFirst && !onlySubtraction) {
      // Добавляем простые действия
      for (const digit of simpleBlockDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= 99) {
          actions.push(digit);
        }
      }
      
      // Добавляем миксованные действия с приоритетом
      for (const digit of mixDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= 99 && this._isMixTransition(state, newState)) {
          // Добавляем несколько раз для повышения вероятности
          const times = Math.floor(mixPriority * 10);
          for (let i = 0; i < times; i++) {
            actions.push(digit);
          }
        }
      }
      
      return actions;
    }

    // Если состояние = 0, только положительные действия
    if (state === 0 && !onlySubtraction) {
      for (const digit of simpleBlockDigits) {
        if (digit <= 99) {
          actions.push(digit);
        }
      }
      
      for (const digit of mixDigits) {
        const newState = state + digit;
        if (newState <= 99 && this._isMixTransition(state, newState)) {
          const times = Math.floor(mixPriority * 10);
          for (let i = 0; i < times; i++) {
            actions.push(digit);
          }
        }
      }
      
      return actions;
    }

    // Обычные действия (не первое, state > 0)
    
    // Сложение
    if (!onlySubtraction) {
      // Простые действия
      for (const digit of simpleBlockDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= 99) {
          actions.push(digit);
        }
      }
      
      // Миксованные действия
      for (const digit of mixDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= 99 && this._isMixTransition(state, newState)) {
          const times = Math.floor(mixPriority * 10);
          for (let i = 0; i < times; i++) {
            actions.push(digit);
          }
        }
      }
    }

    // Вычитание
    if (!onlyAddition) {
      // Простые действия
      for (const digit of simpleBlockDigits) {
        const newState = state - digit;
        if (newState >= 0 && newState <= 99) {
          actions.push(-digit);
        }
      }
      
      // Миксованные действия
      for (const digit of mixDigits) {
        const newState = state - digit;
        if (newState >= 0 && newState <= 99 && this._isMixTransition(state, newState)) {
          const times = Math.floor(mixPriority * 10);
          for (let i = 0; i < times; i++) {
            actions.push(-digit);
          }
        }
      }
    }

    return actions;
  }

  /**
   * Применить действие к состоянию
   */
  applyAction(state, action) {
    return state + action;
  }

  /**
   * Разложить действие на микро-шаги (Друг + Брат)
   * @param {number} action - Действие
   * @returns {Array} Массив микро-шагов
   */
  decomposeAction(action) {
    if (this.mixCombinations.has(action)) {
      return this.mixCombinations.get(action).microSteps;
    }
    return [{ action, type: 'simple', description: `${action > 0 ? '+' : ''}${action}` }];
  }

  /**
   * Валидация примера
   */
  validateExample(example) {
    if (!example || !example.steps || example.steps.length === 0) {
      return false;
    }

    // Проверка 1: Есть ли хотя бы один миксованный шаг
    let hasMixStep = false;
    let currentState = example.start;

    for (const step of example.steps) {
      const action = step.action;
      const nextState = currentState + action;
      
      if (this._isMixTransition(currentState, nextState)) {
        hasMixStep = true;
        break;
      }
      
      currentState = nextState;
    }

    if (!hasMixStep) {
      console.warn("⚠️ MixRule: пример не содержит миксованных шагов");
      return false;
    }

    // Проверка 2: Все промежуточные состояния в диапазоне 0-99
    currentState = example.start;
    for (const step of example.steps) {
      currentState = currentState + step.action;
      
      if (currentState < 0 || currentState > 99) {
        console.warn(`⚠️ MixRule: состояние вышло за границы: ${currentState}`);
        return false;
      }
    }

    // Проверка 3: Соблюдены ли флаги only_addition/only_subtraction
    if (this.config.onlyAddition) {
      const hasNegative = example.steps.some(step => step.action < 0);
      if (hasNegative) {
        console.warn("⚠️ MixRule: найдены отрицательные действия при onlyAddition=true");
        return false;
      }
    }

    if (this.config.onlySubtraction) {
      const hasPositive = example.steps.some(step => step.action > 0);
      if (hasPositive) {
        console.warn("⚠️ MixRule: найдены положительные действия при onlySubtraction=true");
        return false;
      }
    }

    return true;
  }

  /**
   * Генерация стартового состояния
   */
  generateStartState() {
    // Для "Микса" всегда начинаем с 0
    return 0;
  }

  /**
   * Генерация количества шагов
   */
  generateStepsCount() {
    const { minSteps, maxSteps } = this.config;
    return minSteps + Math.floor(Math.random() * (maxSteps - minSteps + 1));
  }
}
