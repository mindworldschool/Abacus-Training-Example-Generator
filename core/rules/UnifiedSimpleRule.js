// core/rules/UnifiedSimpleRule.js - Унифицированное правило "Просто"

import { BaseRule } from "./BaseRule.js";

/**
 * UnifiedSimpleRule - правило для режима "Просто"
 * 
 * ФИЗИКА АБАКУСА:
 * - 1 верхняя бусина = 5
 * - 4 нижние бусины = 1+1+1+1
 * - Состояние = (верхняя активна ? 5 : 0) + количество активных нижних
 * 
 * ДВА РЕЖИМА:
 * 1. "Просто 4" (includeFive = false)
 *    - Используются только нижние бусины
 *    - Состояния: 0-4
 *    - Выбранные цифры: [1, 2, 3, 4]
 * 
 * 2. "Просто 5" (includeFive = true)
 *    - Используются нижние + верхняя бусина
 *    - Состояния: 0-9
 *    - Выбранные цифры: [1, 2, 3, 4, 5, 6, 7, 8, 9]
 *    - Композиции: 6=5+1, 7=5+2, 8=5+3, 9=5+4
 * 
 * ПРАВИЛА ГЕНЕРАЦИИ:
 * - Первое действие всегда положительное
 * - Если состояние = 0, следующее действие только "+"
 * - +N возможно только если есть N неактивных бусин
 * - -N возможно только если есть N активных бусин
 */
export class UnifiedSimpleRule extends BaseRule {
  constructor(config = {}) {
    super(config);

    // Устанавливаем имя напрямую
    this.name = "Просто";

    // Какие цифры выбраны пользователем
    const selectedDigits = Array.isArray(config.selectedDigits)
      ? config.selectedDigits.map(n => parseInt(n, 10)).filter(n => n >= 1 && n <= 9)
      : [1, 2, 3, 4];

    // Определяем режим по наличию цифр >= 5
    const includeFive = selectedDigits.some(d => d >= 5) || config.includeFive === true;

    // Максимальное состояние зависит от режима
    const maxState = includeFive ? 9 : 4;

    this.config = {
      ...this.config,
      name: "Просто",
      selectedDigits,
      includeFive,
      minState: 0,
      maxState: maxState,
      minSteps: config.minSteps ?? 3,
      maxSteps: config.maxSteps ?? 7,
      onlyAddition: config.onlyAddition ?? false,
      onlySubtraction: config.onlySubtraction ?? false,
      digitCount: config.digitCount ?? 1,
      combineLevels: config.combineLevels ?? false
    };

    console.log(
      `📘 UnifiedSimpleRule: цифры=[${selectedDigits.join(", ")}], ` +
      `includeFive=${includeFive}, maxState=${maxState}, ` +
      `onlyAdd=${this.config.onlyAddition}, onlySub=${this.config.onlySubtraction}`
    );
  }

  /**
   * Получить список доступных действий для текущего состояния
   * 
   * @param {number} state - Текущее состояние (0-4 или 0-9)
   * @param {boolean} isFirst - Первое ли это действие
   * @param {number} position - Позиция разряда (не используется для одноразрядных)
   * @returns {Array<number>} Массив доступных действий
   */
  getAvailableActions(state, isFirst, position = 0) {
    const actions = [];
    const { selectedDigits, maxState, onlyAddition, onlySubtraction } = this.config;

    // Первое действие всегда положительное
    if (isFirst && !onlySubtraction) {
      for (const digit of selectedDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= maxState) {
          actions.push(digit);
        }
      }
      return actions;
    }

    // Если состояние = 0, только положительные действия
    if (state === 0 && !onlySubtraction) {
      for (const digit of selectedDigits) {
        if (digit <= maxState) {
          actions.push(digit);
        }
      }
      return actions;
    }

    // Обычные действия (не первое, state > 0)
    
    // Сложение
    if (!onlySubtraction) {
      for (const digit of selectedDigits) {
        const newState = state + digit;
        if (newState >= 0 && newState <= maxState) {
          actions.push(digit);
        }
      }
    }

    // Вычитание
    if (!onlyAddition) {
      for (const digit of selectedDigits) {
        const newState = state - digit;
        if (newState >= 0 && newState <= maxState) {
          actions.push(-digit);
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
   * Проверка физической возможности действия на абакусе
   * 
   * @param {number} state - Текущее состояние (0-9)
   * @param {number} action - Действие (+N или -N)
   * @returns {boolean} Физически возможно ли
   */
  isPhysicallyPossible(state, action) {
    const newState = state + action;

    // Проверка границ
    if (newState < 0 || newState > this.config.maxState) {
      return false;
    }

    // Разложение состояния на бусины
    const upperActive = state >= 5 ? 1 : 0;  // Верхняя бусина (0 или 1)
    const lowerActive = state >= 5 ? state - 5 : state; // Нижние бусины (0-4)

    const newUpperActive = newState >= 5 ? 1 : 0;
    const newLowerActive = newState >= 5 ? newState - 5 : newState;

    // Проверяем доступность нужных бусин
    if (action > 0) {
      // Сложение
      const needUpper = newUpperActive - upperActive; // 0 или 1
      const needLower = newLowerActive - lowerActive; // может быть отрицательным!

      // Проверяем верхнюю бусину
      if (needUpper > 0 && upperActive === 1) {
        return false; // Верхняя уже активна
      }

      // Проверяем нижние бусины
      if (needLower > 0 && lowerActive + needLower > 4) {
        return false; // Не хватает нижних
      }

      if (needLower < 0 && lowerActive + needLower < 0) {
        return false; // Нельзя убрать столько нижних
      }
    } else {
      // Вычитание
      const needUpper = upperActive - newUpperActive; // 0 или 1
      const needLower = lowerActive - newLowerActive; // может быть отрицательным!

      // Проверяем верхнюю бусину
      if (needUpper > 0 && upperActive === 0) {
        return false; // Верхняя не активна
      }

      // Проверяем нижние бусины
      if (needLower > 0 && lowerActive < needLower) {
        return false; // Не хватает активных нижних
      }

      if (needLower < 0 && lowerActive - needLower > 4) {
        return false; // Слишком много нижних станет активно
      }
    }

    return true;
  }

  /**
   * Валидация примера
   * 
   * @param {Object} example - Пример для проверки
   * @returns {boolean} Валиден ли пример
   */
  validateExample(example) {
    // Базовая валидация через родительский класс
    if (!super.validateExample(example)) {
      return false;
    }

    // Дополнительная проверка: физическая возможность каждого шага
    let currentState = example.start;

    for (const step of example.steps) {
      const action = step.action;

      if (!this.isPhysicallyPossible(currentState, action)) {
        console.warn(
          `⚠️ UnifiedSimpleRule: действие ${action} физически невозможно из состояния ${currentState}`
        );
        return false;
      }

      currentState = this.applyAction(currentState, action);
    }

    return true;
  }

  /**
   * Генерация стартового состояния
   * @returns {number} Стартовое состояние (всегда 0 для "Просто")
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

  /**
   * Получить описание состояния абакуса
   * Вспомогательный метод для отладки
   * 
   * @param {number} state - Состояние (0-9)
   * @returns {string} Описание
   */
  getStateDescription(state) {
    if (state < 0 || state > 9) {
      return `Невалидное состояние: ${state}`;
    }

    const upper = state >= 5 ? 1 : 0;
    const lower = state >= 5 ? state - 5 : state;

    return `${state} = верхняя:${upper} + нижние:${lower}`;
  }
}
