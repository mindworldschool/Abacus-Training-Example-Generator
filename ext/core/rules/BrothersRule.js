// ext/core/rules/BrothersRule.js - Правило "Братья" с поддержкой простых шагов

import { BaseRule } from "./BaseRule.js";

export class BrothersRule extends BaseRule {
  constructor(config = {}) {
    super(config);

    // 🔥 Устанавливаем имя напрямую
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
   * Создание таблицы обменных пар
   * Для каждого выбранного "брата N" создаем возможные переходы через 5
   */
  _buildBrotherPairs(digits) {
    const pairs = new Set();
    
    for (const n of digits) {
      const brother = 5 - n; // брат для n
      
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
          // - можем добавить brother нижних после -5
          if (U === 1 && L + brother <= 4) {
            pairs.add(`${v}-${vNext}-brother${n}`);
          }
        }
      }
    }
    
    console.log(`📊 Создано ${pairs.size} братских переходов`);
    return pairs;
  }

  // ===== Помощники по физике одной стойки S∈[0..9] =====
  _U(S) { return S >= 5 ? 1 : 0; }
  _L(S) { return S >= 5 ? S - 5 : S; }

  _canPlusLower(S, v) {
    if (v < 1 || v > 4) return false;
    const L = this._L(S);
    const U = this._U(S);
    if (U === 0) {
      return L + v <= 4; // нижние бусины не выходят за 4
    } else {
      return S + v <= 9; // общее состояние не выходит за 9
    }
  }

  _canMinusLower(S, v) {
    if (v < 1 || v > 4) return false;
    const L = this._L(S);
    return L >= v; // достаточно активных нижних бусин
  }

  /** Начальное состояние */
  generateStartState() {
    return 0;
  }

  /** Случайная длина цепочки */
  generateStepsCount() {
    const min = this.config.minSteps;
    const max = this.config.maxSteps;
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /** Проверка валидности состояния */
  isValidState(v) {
    return v >= this.config.minState && v <= this.config.maxState;
  }

  /**
   * Возвращаем И братские, И простые шаги
   * 
   * ЛОГИКА "Только сложение/вычитание":
   * - Применяется ТОЛЬКО к братским шагам (выбранной тренируемой цифре)
   * - Простые вспомогательные шаги ВСЕГДА доступны с любым знаком
   * 
   * ЛОГИКА "Избежание повторов":
   * - Не повторяем одно и то же число подряд (особенно с противоположным знаком)
   * - Между повторами одного числа должны быть другие числа
   * 
   * @param {number} currentState - Текущее состояние (0-9)
   * @param {boolean} isFirstAction - Это первый шаг?
   * @param {Array} previousSteps - История предыдущих шагов для проверки повторов
   */
  getAvailableActions(currentState, isFirstAction = false, previousSteps = []) {
    const { onlyAddition, onlySubtraction, brothersDigits, simpleBlockDigits } = this.config;
    const v = currentState;
    const brotherActions = [];
    const simpleActions = [];

    // 🔥 НОВОЕ: Анализируем последние 2 шага для избежания повторов
    const lastStep = previousSteps.length > 0 ? 
      previousSteps[previousSteps.length - 1] : null;
    const prevStep = previousSteps.length > 1 ? 
      previousSteps[previousSteps.length - 2] : null;
    
    // Получаем значения последних шагов
    const getStepValue = (step) => {
      if (!step) return null;
      const action = step.action ?? step;
      if (typeof action === 'object') {
        return action.value; // братский шаг или объект
      }
      return action; // простой числовой шаг
    };
    
    const lastValue = getStepValue(lastStep);
    const prevValue = getStepValue(prevStep);
    
    // Функция проверки: можно ли использовать это число?
    const canUseNumber = (num) => {
      // Первый шаг - можно всё
      if (previousSteps.length === 0) return true;
      
      // Не повторяем ТОЧНО то же действие подряд
      if (lastValue === num) {
        console.log(`🚫 Фильтр повторов: пропускаем ${num} (было в последнем шаге)`);
        return false;
      }
      
      // Не делаем +N сразу после -N (и наоборот)
      if (lastValue === -num) {
        console.log(`🚫 Фильтр повторов: пропускаем ${num} (противоположное ${lastValue} было в последнем шаге)`);
        return false;
      }
      
      // Не повторяем одно абсолютное число 3 раза подряд
      // Например: +4, -4, +4 ← третий раз 4 нельзя
      if (prevValue !== null) {
        const absLast = Math.abs(lastValue);
        const absPrev = Math.abs(prevValue);
        const absNum = Math.abs(num);
        
        if (absLast === absNum && absPrev === absNum) {
          console.log(`🚫 Фильтр повторов: пропускаем ${num} (абс. значение ${absNum} уже было 2 раза подряд)`);
          return false;
        }
      }
      
      return true;
    };

    // === БРАТСКИЕ ШАГИ (с ограничением знака) ===
    for (let v2 = 0; v2 <= 9; v2++) {
      if (v2 === v) continue;
      const delta = v2 - v;
      const dir = delta > 0 ? "up" : "down";

      // 🔥 ОГРАНИЧЕНИЯ ПРИМЕНЯЮТСЯ ТОЛЬКО К БРАТСКИМ ШАГАМ!
      if (onlyAddition && delta < 0) continue;
      if (onlySubtraction && delta > 0) continue;
      if (isFirstAction && delta < 0) continue;
      
      // 🔥 НОВОЕ: Проверяем повторы для БРАТСКИХ шагов
      if (!canUseNumber(delta)) continue;

      // Ищем, есть ли для этого перехода братская формула
      let brotherN = null;
      for (const n of brothersDigits) {
        if (this.brotherPairs.has(`${v}-${v2}-brother${n}`)) {
          brotherN = n;
          break;
        }
      }

      if (brotherN != null) {
        const formula = this._buildBrotherFormula(v, v2, brotherN, dir);
        if (formula) {
          brotherActions.push({
            label: `через 5 (брат ${brotherN})`,
            value: delta,
            isBrother: true,
            brotherN: brotherN,
            formula
          });
        }
      }
    }

    // === ПРОСТЫЕ ШАГИ (БЕЗ ограничений знака - вспомогательные!) ===
    const L = this._L(v);
    const U = this._U(v);

    // ✅ СЛОЖЕНИЕ: всегда доступно
    for (const digit of simpleBlockDigits) {
      if (isFirstAction && digit <= 0) continue;
      
      // 🔥 НОВОЕ: Проверяем повторы для ПРОСТЫХ шагов
      if (!canUseNumber(digit)) continue;
      
      // Цифры 1-4: проверяем нижние бусины
      if (digit >= 1 && digit <= 4) {
        if (this._canPlusLower(v, digit)) {
          simpleActions.push(digit);
        }
      }
      // Цифра 5: проверяем верхнюю бусину
      else if (digit === 5) {
        if (U === 0 && v <= 4) {
          simpleActions.push(5);
        }
      }
      // Цифры 6-9: проверяем комбинацию верхней + нижних
      else if (digit >= 6 && digit <= 9) {
        const lower = digit - 5;
        if (U === 0 && this._canPlusLower(v, lower) && v + digit <= 9) {
          simpleActions.push(digit);
        }
      }
    }

    // ✅ ВЫЧИТАНИЕ: всегда доступно
    if (!isFirstAction) {
      for (const digit of simpleBlockDigits) {
        // 🔥 НОВОЕ: Проверяем повторы для ПРОСТЫХ шагов вычитания
        if (!canUseNumber(-digit)) continue;
        
        // Цифры 1-4: проверяем нижние бусины
        if (digit >= 1 && digit <= 4) {
          if (this._canMinusLower(v, digit)) {
            simpleActions.push(-digit);
          }
        }
        // Цифра 5: проверяем верхнюю бусину
        else if (digit === 5) {
          if (U === 1 && v >= 5) {
            simpleActions.push(-5);
          }
        }
        // Цифры 6-9: проверяем комбинацию верхней + нижних
        else if (digit >= 6 && digit <= 9) {
          const lower = digit - 5;
          if (U === 1 && this._canMinusLower(v, lower) && v - digit >= 0) {
            simpleActions.push(-digit);
          }
        }
      }
    }

    // 🔥 ПРИОРИТИЗАЦИЯ: динамический процент
    if (brotherActions.length > 0 && Math.random() < this.config.brotherPriority) {
      console.log(`👬 Приоритет братским шагам из ${v} (доступно ${brotherActions.length})`);
      return brotherActions;
    }

    const allActions = [...brotherActions, ...simpleActions];
    console.log(`🎲 Состояние ${v}: братских=${brotherActions.length}, простых=${simpleActions.length}, всего=${allActions.length}`);
    return allActions;
  }

  /**
   * Построение формулы для братского шага
   */
  _buildBrotherFormula(from, to, brotherN, direction) {
    const delta = to - from;
    const brother = 5 - brotherN;
    
    if (direction === "up") {
      // +n через +5-brother
      return [
        { op: "+", val: 5 },
        { op: "-", val: brother }
      ];
    } else {
      // -n через -5+brother
      return [
        { op: "-", val: 5 },
        { op: "+", val: brother }
      ];
    }
  }

  /**
   * Применение действия к состоянию
   */
  applyAction(currentState, action) {
    const delta = typeof action === "object" ? action.value : action;
    return currentState + delta;
  }

  /**
   * Форматирование действия для отображения
   */
  formatAction(action) {
    const val = typeof action === "object" ? action.value : action;
    return val >= 0 ? `+${val}` : `${val}`;
  }

  /**
   * Преобразование состояния в число
   */
  stateToNumber(state) {
    return typeof state === 'number' ? state : 0;
  }

  /**
   * Валидация: хотя бы 1 братский шаг
   */
  validateExample(example) {
    const { start, steps, answer } = example;
    const { minState, maxState } = this.config;

    if (!steps || steps.length < 1) {
      console.warn("❌ validateExample: нет шагов");
      return false;
    }

    let s = start;
    let hasBrother = false;

    for (const step of steps) {
      const act = step.action ?? step;
      s = this.applyAction(s, act);
      if (s < minState || s > maxState) {
        console.warn(`❌ validateExample: выход за диапазон [${minState}, ${maxState}]: ${s}`);
        return false;
      }
      if (typeof act === "object" && act.isBrother) hasBrother = true;
    }

    if (s !== answer) {
      console.warn(`❌ validateExample: ответ не совпадает: ${s} !== ${answer}`);
      return false;
    }

    if (!hasBrother) {
      console.warn("❌ validateExample: нет братских шагов");
      return false;
    }

    console.log(`✅ validateExample: пример валидный (${steps.length} шагов, есть братские)`);
    return true;
  }
}
