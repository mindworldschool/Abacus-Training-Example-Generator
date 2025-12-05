// ext/core/rules/BaseRule.js - Базовое правило для генерации примеров

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
      combineLevels: config.combineLevels ?? false,  // Комбинировать ли разряды в одном шаге

      ...config
    };
  }

  /**
   * Проверяет, является ли состояние валидным
   * @param {number|number[]} state - Состояние для проверки (число или массив разрядов)
   * @returns {boolean}
   */
  isValidState(state) {
    const { minState, maxState } = this.config;

    // Один разряд (число)
    if (typeof state === "number") {
      return state >= minState && state <= maxState;
    }

    // Несколько разрядов (массив)
    if (Array.isArray(state)) {
      // Каждый разряд должен лежать в допустимом диапазоне
      return state.every(
        digit => digit >= minState && digit <= maxState
      );
    }

    return false;
  }

  /**
   * Применяет действие к состоянию
   * @param {number|number[]} state - Текущее состояние (число или массив разрядов)
   * @param {number|Object} action - Действие (число для 1 разряда, {position,value} для multi-digit)
   * @returns {number|number[]} - Новое состояние
   */
  applyAction(state, action) {
    // Одноразрядный случай: state число, action число
    if (typeof state === "number" && typeof action === "number") {
      return state + action;
    }

    // Многоразрядный случай: state массив, action { position, value }
    if (Array.isArray(state) && typeof action === "object" && action !== null) {
      const { position, value } = action;
      const newState = [...state];
      newState[position] = (newState[position] || 0) + value;
      return newState;
    }

    // Смешанный/некорректный формат — не меняем состояние
    console.error("⚠️ Неподдерживаемый формат applyAction:", { state, action });
    return state;
  }

  /**
   * Получает доступные действия для текущего состояния.
   * В базовом классе это просто фильтр по this.config.allowedActions,
   * но большинство реальных правил (например UnifiedSimpleRule)
   * переопределяют эту функцию и генерируют физически возможные шаги.
   *
   * @param {number|number[]} currentState - Текущее состояние
   * @param {boolean} isFirstAction - Это первый шаг в примере?
   * @param {number} position - Для multi-digit: позиция разряда (0=единицы, 1=десятки...)
   * @returns {Array<number|Object>} - массив шагов
   */
  getAvailableActions(currentState, isFirstAction = false, position = 0) {
    const actions = [];

    for (const action of this.config.allowedActions) {
      if (this.isValidAction(currentState, action, position, isFirstAction)) {
        actions.push(action);
      }
    }

    return actions;
  }

  /**
   * Проверяет, валидно ли действие для текущего состояния:
   *  - не запрещено явно
   *  - не выводит состояние за пределы
   *
   * Наследники обычно делают свою логику (например физика абакуса),
   * так что этот метод — fallback для простых случаев.
   *
   * @param {number|number[]} currentState
   * @param {number|Object} action
   * @param {number} position
   * @param {boolean} isFirstAction
   * @returns {boolean}
   */
  isValidAction(currentState, action, position = 0, isFirstAction = false) {
    // Числовое действие (один разряд)
    if (typeof action === "number") {
      // нельзя использовать запрещённые действия
      if (this.config.forbiddenActions.includes(action)) {
        return false;
      }

      // нельзя начинать с минуса, если это методически запрещено
      if (isFirstAction && action < 0 && this.config.firstActionMustBePositive) {
        return false;
      }

      // проверяем новое состояние
      const newState = this.applyAction(currentState, action);
      if (!this.isValidState(newState)) {
        return false;
      }

      return true;
    }

    // Объект действия {position,value} для многоразрядных случаев
    if (typeof action === "object" && action !== null) {
      if (
        isFirstAction &&
        action.value < 0 &&
        this.config.firstActionMustBePositive
      ) {
        return false;
      }

      const newState = this.applyAction(currentState, action);
      if (!this.isValidState(newState)) {
        return false;
      }

      return true;
    }

    return false;
  }

  /**
   * Генерирует начальное состояние.
   *
   * По умолчанию:
   *  - Если один разряд → 0.
   *  - Если несколько разрядов → массив нулей [0,0,...].
   *
   * РАНЬШЕ здесь была логика "если combineLevels=false, стартовать с [0,0,...,1] (=10,100,1000...)".
   * Это ломало методику "Просто", где ребёнок ВСЕГДА стартует с нулевой стойки.
   *
   * Теперь мы больше не ставим эту единицу. Если какому-то режиму
   * нужно стартовать не с нуля — он сам переопределит generateStartState().
   */
  generateStartState() {
    const { digitCount } = this.config;

    if (digitCount === 1) {
      return 0;
    }

    return new Array(digitCount).fill(0);
  }

  /**
   * Генерирует количество шагов.
   * Возвращает случайное число в [minSteps .. maxSteps].
   * Наследник может переопределить.
   */
  generateStepsCount() {
    const { minSteps, maxSteps } = this.config;
    const min = Number.isFinite(minSteps) ? minSteps : 1;
    const max = Number.isFinite(maxSteps) ? maxSteps : min;
    if (min === max) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Форматирует действие для отображения в UI.
   * Для одного разряда → "+2", "-3"
   * Для multi-digit шагов → берём value.
   */
  formatAction(action) {
    if (typeof action === "number") {
      return action >= 0 ? `+${action}` : `${action}`;
    }

    if (typeof action === "object" && action !== null) {
      const { value } = action;
      return value >= 0 ? `+${value}` : `${value}`;
    }

    return String(action);
  }

  /**
   * Получить значение конкретного разряда из состояния
   * (0 = единицы, 1 = десятки и т.д.).
   */
  getDigitValue(state, position = 0) {
    if (typeof state === "number") {
      // если состояние — одно число, то только разряд 0 (единицы) имеет смысл
      return position === 0 ? state : 0;
    }
    if (Array.isArray(state)) {
      return state[position] ?? 0;
    }
    return 0;
  }

  /**
   * Преобразовать состояние (число или массив разрядов) в одно целое число.
   * По договорённости массив хранится в формате:
   *   [единицы, десятки, сотни, ...]
   * То есть индекс 0 — младший разряд.
   */
  stateToNumber(state) {
    if (typeof state === "number") {
      return state ?? 0;
    }
    if (Array.isArray(state)) {
      return state.reduce(
        (sum, digit, index) => sum + digit * Math.pow(10, index),
        0
      );
    }
    return 0;
  }

  /**
   * Минимально допустимое финальное число (используется не всеми режимами).
   * Для 1 разряда это 0.
   * Для N разрядов: минимальное N-значное число (10, 100, ...).
   * Т.е. "не ведущие нули", если это важно для режима.
   * Режим "Просто" это не использует.
   */
  getMinFinalNumber() {
    const { digitCount } = this.config;
    if (digitCount === 1) {
      return 0;
    }
    return Math.pow(10, digitCount - 1);
  }

  /**
   * Максимально допустимое финальное число (используется не всеми режимами).
   * Для 1 разряда дефолтно 9.
   * Для N разрядов: 99, 999, 9999, ...
   * Режим "Просто" тоже это не использует напрямую.
   */
  getMaxFinalNumber() {
    const { digitCount } = this.config;
    if (digitCount === 1) {
      return 9;
    }
    return Math.pow(10, digitCount) - 1;
  }
}
