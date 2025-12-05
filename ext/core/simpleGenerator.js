// ext/core/simpleGenerator.js
// Генерация одного или нескольких примеров для режима "Просто",
// используя UnifiedSimpleRule

import { UnifiedSimpleRule } from "./rules/UnifiedSimpleRule.js";

/**
 * Генерирует ОДИН пример.
 *
 * @param {Object} cfg
 * @param {number[]} cfg.selectedDigits - какие цифры разрешены (модуль шага). Пример: [1,2,3,4,5,6,7,8,9] или [3] или [2,5,7]
 * @param {number} cfg.stepsCount        - длина цепочки (сколько операций показать ребёнку)
 * @param {boolean} [cfg.onlyAddition]   - если тренируем только сложение
 * @param {boolean} [cfg.onlySubtraction]- если тренируем только вычитание
 * @param {number} [cfg.digitCount=1]    - пока предполагаем 1 разряд
 *
 * Возвращает:
 * {
 *   start: 0,
 *   steps: [
 *     { action: +3, toState: 3 },
 *     { action: +1, toState: 4 },
 *     { action: +5, toState: 9 },
 *     { action: -7, toState: 2 },
 *     { action: +6, toState: 8 },
 *     { action: -8, toState: 0 }
 *   ],
 *   answer: 0
 * }
 */
export function generateOneSimpleExample(cfg) {
  // 1. создаём правило с настройками
  const rule = new UnifiedSimpleRule({
    selectedDigits: cfg.selectedDigits,
    minSteps: cfg.stepsCount,   // минимально хотим stepsCount
    maxSteps: cfg.stepsCount,   // и максимально тоже stepsCount (фиксированная длина)
    onlyAddition: cfg.onlyAddition ?? false,
    onlySubtraction: cfg.onlySubtraction ?? false,
    digitCount: cfg.digitCount ?? 1
  });

  // 2. стартовое состояние всей стойки (пока 1 разряд => просто число 0)
  let currentState = 0;

  const steps = [];

  for (let i = 0; i < cfg.stepsCount; i++) {
    // спросить у правила, какие шаги доступны сейчас
    const isFirstAction = i === 0;

    const possible = rule.getAvailableActions(
      currentState,
      isFirstAction,
      /* position */ 0
    );

    // если вообще нет допустимых шагов — тупик, выходим досрочно
    if (!possible || possible.length === 0) {
      break;
    }

    // выбираем случайный шаг
    const action = possible[Math.floor(Math.random() * possible.length)];
    // action в однознаковом режиме — это просто число, типа +3 или -7

    // применяем действие, получаем новое состояние
    const nextState = rule.applyAction(currentState, action);

    // записываем шаг в протокол
    steps.push({
      action,
      toState: nextState
    });

    // идём дальше с новым состоянием
    currentState = nextState;
  }

  // собираем итог
  const example = {
    start: 0,
    steps,
    answer: currentState
  };

  // проверка методики
  if (!rule.validateExample(example)) {
    console.warn("⚠️ пример сгенерирован, но не прошёл validateExample, пробуем другой");
    return null;
  }

  return example;
}

/**
 * Сгенерировать ПАКЕТ примеров.
 *
 * @param {Object} cfg
 * @param {number[]} cfg.selectedDigits
 * @param {number} cfg.examplesCount
 * @param {number} cfg.stepsCount
 * @param {boolean} [cfg.onlyAddition]
 * @param {boolean} [cfg.onlySubtraction]
 * @param {number} [cfg.digitCount=1]
 *
 * @returns {Array} массив корректных примеров
 */
export function generateSimpleBatch(cfg) {
  const out = [];

  for (let i = 0; i < cfg.examplesCount; i++) {
    const ex = generateOneSimpleExample(cfg);
    if (ex) {
      out.push(ex);
    } else {
      // если вдруг невалидный — просто пробуем ещё раз немедленно
      // в этой же позиции i (перегенерация в рамках этого i)
      i--;
    }
  }

  return out;
}
