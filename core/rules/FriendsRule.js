// core/rules/FriendsRule.js
// Правило "Друзі" (формулы 10) - компенсация до 10 с переносами между разрядами

import { BaseRule } from "./BaseRule.js";

/**
 * FriendsRule - правило "Друзі" для генерации примеров с формулами компенсации до 10
 * 
 * КОНЦЕПЦИЯ:
 * "Друзья" - это пары цифр, которые в сумме дают 10:
 * 1 ↔ 9, 2 ↔ 8, 3 ↔ 7, 4 ↔ 6, 5 ↔ 5
 * 
 * ФОРМУЛЫ:
 * Сложение: +N = +10 - друг(N)
 * - +9 = +10 - 1
 * - +8 = +10 - 2
 * - +7 = +10 - 3
 * - +6 = +10 - 4
 * 
 * Вычитание: -N = -10 + друг(N)
 * - -9 = -10 + 1
 * - -8 = -10 + 2
 * - -7 = -10 + 3
 * - -6 = -10 + 4
 * 
 * ОСОБЕННОСТИ:
 * - Требует минимум 2 разряда (единицы + десятки)
 * - Работает с переносами между разрядами
 * - Пример ОБЯЗАН содержать хотя бы 1 дружеский шаг
 */
export class FriendsRule extends BaseRule {
  constructor(config = {}) {
    super(config);

    // Устанавливаем имя напрямую
    this.name = "Друзі";

    // Какие "друзья" тренируем: [9,8,7,6,5,4,3,2,1]
    const friendsDigits = Array.isArray(config.selectedDigits)
      ? config.selectedDigits.map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 9)
      : [9]; // по умолчанию только 9

    // Какие цифры разрешены в блоке "Просто" для вспомогательных шагов
    const simpleBlockDigits = config.blocks?.simple?.digits
      ? config.blocks.simple.digits.map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 9)
      : [1, 2, 3, 4, 5]; // по умолчанию 1-5

    this.config = {
      ...this.config,
      name: "Друзі",
      minState: 0,
      maxState: 99, // Для двухразрядных
      minSteps: config.minSteps ?? 3,
      maxSteps: config.maxSteps ?? 7,
      friendsDigits,
      simpleBlockDigits,
      onlyAddition: config.onlyAddition ?? false,
      onlySubtraction: config.onlySubtraction ?? false,
      digitCount: config.digitCount ?? 2, // ВАЖНО: минимум 2 разряда!
      combineLevels: config.combineLevels ?? false,
      friendPriority: 0.5, // 50% приоритет дружеским шагам
      blocks: config.blocks ?? {}
    };

    console.log(
      `🤝 FriendsRule: друзья=[${friendsDigits.join(", ")}], ` +
      `простые=[${simpleBlockDigits.join(", ")}], ` +
      `onlyAdd=${this.config.onlyAddition}, onlySub=${this.config.onlySubtraction}`
    );

    // Таблица "дружеских" пар для быстрой проверки
    this.friendPairs = this._buildFriendPairs(friendsDigits);
  }

  /**
   * Получить "друга" для числа (дополнение до 10)
   * @param {number} n - Число от 1 до 9
   * @returns {number} Друг (10 - n)
   */
  getFriend(n) {
    return 10 - n;
  }

  /**
   * Создание таблицы обменных пар
   * Для каждого выбранного "друга N" создаем возможные переходы через 10
   */
  _buildFriendPairs(digits) {
    const pairs = new Set();
    
    for (const n of digits) {
      const friend = this.getFriend(n); // друг для n
      
      // Переходы "вверх": v → v+n через +10-friend
      for (let v = 0; v <= 99; v++) {
        const vNext = v + n;
        if (vNext >= 0 && vNext <= 99) {
          // Проверяем возможность перехода через десяток
          const units = v % 10;
          const tens = Math.floor(v / 10);
          
          // +n через +10-friend возможно если:
          // - в единицах недостаточно места (units + n >= 10)
          // - есть место в десятках (tens < 9)
          if (units + n >= 10 && tens < 9) {
            pairs.add(`${v}-${vNext}-friend${n}`);
          }
        }
      }
      
      // Переходы "вниз": v → v-n через -10+friend
      for (let v = 0; v <= 99; v++) {
        const vNext = v - n;
        if (vNext >= 0 && vNext <= 99) {
          const units = v % 10;
          const tens = Math.floor(v / 10);
          
          // -n через -10+friend возможно если:
          // - в единицах недостаточно (units < n)
          // - есть откуда занять (tens > 0)
          if (units < n && tens > 0) {
            pairs.add(`${v}-${vNext}-friend${n}`);
          }
        }
      }
    }
    
    console.log(`🤝 FriendsRule: создано ${pairs.size} возможных переходов`);
    return pairs;
  }

  /**
   * Проверка: является ли переход "дружеским"
   */
  _isFriendTransition(from, to) {
    const delta = Math.abs(to - from);
    
    for (const n of this.config.friendsDigits) {
      if (delta === n) {
        const key = `${from}-${to}-friend${n}`;
        return this.friendPairs.has(key);
      }
    }
    
    return false;
  }

  /**
   * Получить список доступных действий для текущего состояния
   * @param {number} state - Текущее состояние (0-99)
   * @param {boolean} isFirst - Первое ли это действие
   * @param {number} position - Позиция разряда (не используется для друзей)
   * @returns {Array<number>} Массив доступных действий
   */
  getAvailableActions(state, isFirst, position = 0) {
    const actions = [];
    const { onlyAddition, onlySubtraction, friendsDigits, simpleBlockDigits, friendPriority } = this.config;

    // Первое действие всегда положительное
    if (isFirst && !onlySubtraction) {
      // Добавляем простые действия
      for (const digit of simpleBlockDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= 99) {
          actions.push(digit);
        }
      }
      
      // Добавляем дружеские действия с приоритетом
      for (const digit of friendsDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= 99 && this._isFriendTransition(state, newState)) {
          // Добавляем несколько раз для повышения вероятности
          const times = Math.floor(friendPriority * 10);
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
      
      for (const digit of friendsDigits) {
        const newState = state + digit;
        if (newState <= 99 && this._isFriendTransition(state, newState)) {
          const times = Math.floor(friendPriority * 10);
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
      
      // Дружеские действия
      for (const digit of friendsDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= 99 && this._isFriendTransition(state, newState)) {
          const times = Math.floor(friendPriority * 10);
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
      
      // Дружеские действия
      for (const digit of friendsDigits) {
        const newState = state - digit;
        if (newState >= 0 && newState <= 99 && this._isFriendTransition(state, newState)) {
          const times = Math.floor(friendPriority * 10);
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
   * Валидация примера
   * @param {Object} example - Пример для проверки
   * @returns {boolean} Валиден ли пример
   */
  validateExample(example) {
    if (!example || !example.steps || example.steps.length === 0) {
      return false;
    }

    // Проверка 1: Есть ли хотя бы один дружеский шаг
    let hasFriendStep = false;
    let currentState = example.start;

    for (const step of example.steps) {
      const action = step.action;
      const nextState = currentState + action;
      
      if (this._isFriendTransition(currentState, nextState)) {
        hasFriendStep = true;
        break;
      }
      
      currentState = nextState;
    }

    if (!hasFriendStep) {
      console.warn("⚠️ FriendsRule: пример не содержит дружеских шагов");
      return false;
    }

    // Проверка 2: Все промежуточные состояния в диапазоне 0-99
    currentState = example.start;
    for (const step of example.steps) {
      currentState = currentState + step.action;
      
      if (currentState < 0 || currentState > 99) {
        console.warn(`⚠️ FriendsRule: состояние вышло за границы: ${currentState}`);
        return false;
      }
    }

    // Проверка 3: Соблюдены ли флаги only_addition/only_subtraction
    if (this.config.onlyAddition) {
      const hasNegative = example.steps.some(step => step.action < 0);
      if (hasNegative) {
        console.warn("⚠️ FriendsRule: найдены отрицательные действия при onlyAddition=true");
        return false;
      }
    }

    if (this.config.onlySubtraction) {
      const hasPositive = example.steps.some(step => step.action > 0);
      if (hasPositive) {
        console.warn("⚠️ FriendsRule: найдены положительные действия при onlySubtraction=true");
        return false;
      }
    }

    return true;
  }

  /**
   * Генерация стартового состояния
   * @returns {number} Стартовое состояние (обычно 0 для друзей)
   */
  generateStartState() {
    // Для "Друзей" всегда начинаем с 0
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
