// core/rules/BrothersRule.js - Правило "Братья" с поддержкой простых шагов

import { BaseRule } from "./BaseRule.js";

/**
 * BrothersRule - правило "Братья" (формулы компенсации до 5)
 * 
 * КОНЦЕПЦИЯ:
 * "Братья" - это пары цифр, которые в сумме дают 5:
 * 1 ↔ 4, 2 ↔ 3, 3 ↔ 2, 4 ↔ 1
 * 
 * ФОРМУЛЫ:
 * Сложение: +N = +5 - брат(N)
 * - +1 = +5 - 4
 * - +2 = +5 - 3
 * - +3 = +5 - 2
 * - +4 = +5 - 1
 * 
 * Вычитание: -N = -5 + брат(N)
 * - -1 = -5 + 4
 * - -2 = -5 + 3
 * - -3 = -5 + 2
 * - -4 = -5 + 1
 * 
 * ОСОБЕННОСТИ:
 * - Работает в пределах одного разряда (0-9)
 * - Приоритет: Просто → Брат → Друг
 * - Пример ОБЯЗАН содержать хотя бы 1 братский шаг
 * - Вспомогательные шаги могут быть обычными (из блока "Просто")
 */
export class BrothersRule extends BaseRule {
  constructor(config = {}) {
    super(config);

    // Устанавливаем имя напрямую
    this.name = "Братья";

    // Какие "братья" тренируем: [1,2,3,4]
    const brothersDigits = Array.isArray(config.selectedDigits)
      ? config.selectedDigits.map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 4)
      : [4]; // по умолчанию только 4

    // Какие цифры разрешены в блоке "Просто" для вспомогательных шагов
    const simpleBlockDigits = config.blocks?.simple?.digits
      ? config.blocks.simple.digits.map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 9)
      : [1, 2, 3, 4, 5]; // по умолчанию 1-5

    this.config = {
      ...this.config,
      name: "Братья",
      minState: 0,
      maxState: 9,
      minSteps: config.minSteps ?? 3,
      maxSteps: config.maxSteps ?? 7,
      brothersDigits,
      simpleBlockDigits,
      onlyAddition: config.onlyAddition ?? false,
      onlySubtraction: config.onlySubtraction ?? false,
      digitCount: config.digitCount ?? 1,
      combineLevels: config.combineLevels ?? false,
      brotherPriority: 0.5,  // 50% приоритет братским шагам
      blocks: config.blocks ?? {}
    };

    console.log(
      `👬 BrothersRule: братья=[${brothersDigits.join(", ")}], ` +
      `простые=[${simpleBlockDigits.join(", ")}], ` +
      `onlyAdd=${this.config.onlyAddition}, onlySub=${this.config.onlySubtraction}`
    );

    // Таблица "братских" пар для быстрой проверки
    this.brotherPairs = this._buildBrotherPairs(brothersDigits);
  }

  /**
   * Получить "брата" для числа (дополнение до 5)
   * @param {number} n - Число от 1 до 4
   * @returns {number} Брат (5 - n)
   */
  getBrother(n) {
    return 5 - n;
  }

  /**
   * Создание таблицы обменных пар
   * Для каждого выбранного "брата N" создаем возможные переходы через 5
   */
  _buildBrotherPairs(digits) {
    const pairs = new Set();
    
    for (const n of digits) {
      const brother = this.getBrother(n); // брат для n
      
      // Переходы "вверх": v → v+n через +5-brother
      for (let v = 0; v <= 9; v++) {
        const vNext = v + n;
        if (vNext >= 0 && vNext <= 9) {
          // Проверяем физическую возможность через 5
          const U = v >= 5 ? 1 : 0;
          const L = v >= 5 ? v - 5 : v;
          
          // +n через +5-brother возможно если:
          // - верхняя бусина неактивна (U=0)
          // - после +5 можем убрать brother нижних
          if (U === 0 && L + 5 >= brother) {
            pairs.add(`${v}-${vNext}-brother${n}`);
          }
        }
      }
      
      // Переходы "вниз": v → v-n через -5+brother
      for (let v = 0; v <= 9; v++) {
        const vNext = v - n;
        if (vNext >= 0 && vNext <= 9) {
          const U = v >= 5 ? 1 : 0;
          const L = v >= 5 ? v - 5 : v;
          
          // -n через -5+brother возможно если:
          // - верхняя бусина активна (U=1)
          // - после -5 можем добавить brother нижних
          if (U === 1 && L - 5 + brother >= 0 && L - 5 + brother <= 4) {
            pairs.add(`${v}-${vNext}-brother${n}`);
          }
        }
      }
    }
    
    console.log(`👬 BrothersRule: создано ${pairs.size} возможных переходов`);
    return pairs;
  }

  /**
   * Проверка: является ли переход "братским"
   */
  _isBrotherTransition(from, to) {
    const delta = Math.abs(to - from);
    
    for (const n of this.config.brothersDigits) {
      if (delta === n) {
        const key = `${from}-${to}-brother${n}`;
        return this.brotherPairs.has(key);
      }
    }
    
    return false;
  }

  /**
   * Получить список доступных действий для текущего состояния
   * 
   * @param {number} state - Текущее состояние (0-9)
   * @param {boolean} isFirst - Первое ли это действие
   * @param {number} position - Позиция разряда (не используется)
   * @returns {Array<number>} Массив доступных действий
   */
  getAvailableActions(state, isFirst, position = 0) {
    const actions = [];
    const { onlyAddition, onlySubtraction, brothersDigits, simpleBlockDigits, brotherPriority } = this.config;

    // Первое действие всегда положительное
    if (isFirst && !onlySubtraction) {
      // Добавляем простые действия
      for (const digit of simpleBlockDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= 9) {
          actions.push(digit);
        }
      }
      
      // Добавляем братские действия с приоритетом
      for (const digit of brothersDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= 9 && this._isBrotherTransition(state, newState)) {
          // Добавляем несколько раз для повышения вероятности
          const times = Math.floor(brotherPriority * 10);
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
        if (digit <= 9) {
          actions.push(digit);
        }
      }
      
      for (const digit of brothersDigits) {
        const newState = state + digit;
        if (newState <= 9 && this._isBrotherTransition(state, newState)) {
          const times = Math.floor(brotherPriority * 10);
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
        if (newState >= 0 && newState <= 9) {
          actions.push(digit);
        }
      }
      
      // Братские действия
      for (const digit of brothersDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= 9 && this._isBrotherTransition(state, newState)) {
          const times = Math.floor(brotherPriority * 10);
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
        if (newState >= 0 && newState <= 9) {
          actions.push(-digit);
        }
      }
      
      // Братские действия
      for (const digit of brothersDigits) {
        const newState = state - digit;
        if (newState >= 0 && newState <= 9 && this._isBrotherTransition(state, newState)) {
          const times = Math.floor(brotherPriority * 10);
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
   * @param {number} state - Текущее состояние
   * @param {number} action - Действие (+N или -N)
   * @returns {number} Новое состояние
   */
  applyAction(state, action) {
    return state + action;
  }

  /**
   * Разложить действие на микро-шаги (формула брата)
   * @param {number} state - Текущее состояние
   * @param {number} action - Действие
   * @returns {Array} Массив микро-шагов
   */
  decomposeAction(state, action) {
    const absAction = Math.abs(action);
    
    // Проверяем, это братский шаг?
    if (this._isBrotherTransition(state, state + action)) {
      const brother = this.getBrother(absAction);
      
      if (action > 0) {
        // +N = +5 - брат(N)
        return [
          { action: 5, type: 'upper', description: '+5 (верхняя бусина)' },
          { action: -brother, type: 'lower', description: `-${brother} (нижние)` }
        ];
      } else {
        // -N = -5 + брат(N)
        return [
          { action: -5, type: 'upper', description: '-5 (верхняя бусина)' },
          { action: brother, type: 'lower', description: `+${brother} (нижние)` }
        ];
      }
    }
    
    // Обычный шаг
    return [{ action, type: 'simple', description: `${action > 0 ? '+' : ''}${action}` }];
  }

  /**
   * Валидация примера
   * @param {Object} example - Пример для проверки
   * @returns {boolean} Валиден ли пример
   */
  validateExample(example) {
    if (!example || !example.steps || example.steps.length === 0) {
      return false;
    }

    // Проверка 1: Есть ли хотя бы один братский шаг
    let hasBrotherStep = false;
    let currentState = example.start;

    for (const step of example.steps) {
      const action = step.action;
      const nextState = currentState + action;
      
      if (this._isBrotherTransition(currentState, nextState)) {
        hasBrotherStep = true;
        break;
      }
      
      currentState = nextState;
    }

    if (!hasBrotherStep) {
      console.warn("⚠️ BrothersRule: пример не содержит братских шагов");
      return false;
    }

    // Проверка 2: Все промежуточные состояния в диапазоне 0-9
    currentState = example.start;
    for (const step of example.steps) {
      currentState = currentState + step.action;
      
      if (currentState < 0 || currentState > 9) {
        console.warn(`⚠️ BrothersRule: состояние вышло за границы: ${currentState}`);
        return false;
      }
    }

    // Проверка 3: Соблюдены ли флаги only_addition/only_subtraction
    if (this.config.onlyAddition) {
      const hasNegative = example.steps.some(step => step.action < 0);
      if (hasNegative) {
        console.warn("⚠️ BrothersRule: найдены отрицательные действия при onlyAddition=true");
        return false;
      }
    }

    if (this.config.onlySubtraction) {
      const hasPositive = example.steps.some(step => step.action > 0);
      if (hasPositive) {
        console.warn("⚠️ BrothersRule: найдены положительные действия при onlySubtraction=true");
        return false;
      }
    }

    return true;
  }

  /**
   * Генерация стартового состояния
   * @returns {number} Стартовое состояние (обычно 0)
   */
  generateStartState() {
    return 0;
  }

  /**
   * Генерация количества шагов
   * @returns {number} Количество шагов
   */
  generateStepsCount() {
    const { minSteps, maxSteps } = this.config;
    return minSteps + Math.floor(Math.random() * (maxSteps - minSteps + 1));
  }
}
