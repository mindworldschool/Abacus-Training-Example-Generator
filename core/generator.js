// core/generator.js
//
// Генератор примеров для тренажёра.
// Отвечает за:
//  - чтение настроек из UI,
//  - подготовку конфигурации правила,
//  - вызов ExampleGenerator,
//  - адаптацию результата под формат тренажёра.
//
// Работает для всех режимов:
//   - "Просто": последовательные шаги вида +3, +1, -4 ...
//   - "Братья": компенсация до 5
//   - "Друзі": компенсация до 10 (🆕)
//   - "Мікс": комбинация Братьев и Друзей (🆕)

import { UnifiedSimpleRule } from "./rules/UnifiedSimpleRule.js";
import { ExampleGenerator } from "./ExampleGenerator.js";
import { BrothersRule } from "./rules/BrothersRule.js";
import { FriendsRule } from "./rules/FriendsRule.js";    // 🆕 ДОБАВЛЕНО
import { MixRule } from "./rules/MixRule.js";            // 🆕 ДОБАВЛЕНО
import { MultiDigitGenerator } from "./MultiDigitGenerator.js";

/**
 * Основная внешняя функция.
 * Вызывается из trainer_logic.js при показе каждого нового примера.
 *
 * @param {Object} settings - настройки из UI
 * @returns {{ start:number, steps:string[], answer:number }}
 *          Пример в готовом формате для тренажёра.
 */
export function generateExample(settings = {}) {
  try {
    console.log("🧠 [generator] входные настройки:", settings);
    console.log("🔍 [generator] settings.blocks:", settings.blocks);
    console.log("🔍 [generator] settings.actions:", settings.actions);

    //
    // 1. Разрядность
    //
    // digits = сколько столбцов абакуса мы тренируем одновременно.
    // Для классического "Просто" это 1.
    //
    const digitCountRaw = parseInt(settings.digits, 10);
    const digitCount =
      Number.isFinite(digitCountRaw) && digitCountRaw > 0
        ? digitCountRaw
        : 1;

    // combineLevels:
    // true  → один шаг двигает все разряды сразу (общий вектор),
    // false → более строго (каждый столбец сам по себе).
    const combineLevels = settings.combineLevels === true;

    //
    // 2. Длина примера (сколько шагов в последовательности)
    //
    // settings.actions управляет количеством шагов:
    //   - count: фиксированная длина
    //   - min / max: диапазон
    //   - infinite: "игра бесконечно", тогда мы просто берём разумный коридор
    //
    const actionsCfg = settings.actions || {};
    console.log("🔍 [generator] actionsCfg:", actionsCfg);
    
    const minStepsRaw = actionsCfg.infinite
      ? 2
      : (actionsCfg.min ?? actionsCfg.count ?? 2);
    const maxStepsRaw = actionsCfg.infinite
      ? 12
      : (actionsCfg.max ?? actionsCfg.count ?? 4);

    let minSteps = minStepsRaw;
    let maxSteps = maxStepsRaw;

    console.log("🔍 [generator] minSteps:", minSteps, "maxSteps:", maxSteps);

    //
    // 3. Блоки (Просто, Братья, Друзі, Мікс)
    //
    const blocks = settings.blocks || {};
    
    // Какие цифры выбраны в каждом блоке
    const simpleDigits = blocks?.simple?.digits || [];
    const brothersDigits = blocks?.brothers?.digits || [];
    const friendsDigits = blocks?.friends?.digits || [];      // 🆕 ДОБАВЛЕНО
    const mixDigits = blocks?.mix?.digits || [];              // 🆕 ДОБАВЛЕНО

    console.log("🔍 [generator] simpleDigits:", simpleDigits);
    console.log("🔍 [generator] brothersDigits:", brothersDigits);
    console.log("🔍 [generator] friendsDigits:", friendsDigits);    // 🆕
    console.log("🔍 [generator] mixDigits:", mixDigits);            // 🆕

    // Определяем, какой блок активен
    const simpleActive = simpleDigits.length > 0;
    const brothersActive = brothersDigits.length > 0;
    const friendsActive = friendsDigits.length > 0;          // 🆕 ДОБАВЛЕНО
    const mixActive = mixDigits.length > 0;                  // 🆕 ДОБАВЛЕНО

    console.log("📊 [generator] Активные блоки:");
    console.log("   Просто:", simpleActive);
    console.log("   Братья:", brothersActive);
    console.log("   Друзі:", friendsActive);                 // 🆕
    console.log("   Мікс:", mixActive);                      // 🆕

    //
    // 4. Создаём правило
    //
    // Логика выбора:
    // 1. Определяем базовый класс правила
    // 2. Если digitCount > 1 → оборачиваем в MultiDigitGenerator
    // 3. Если digitCount === 1 → используем правило напрямую
    //
    let rule;

    // === ОПРЕДЕЛЯЕМ БАЗОВЫЙ КЛАСС ПРАВИЛА ===
    let RuleClass;
    let ruleConfigForClass;

    // Приоритет: Мікс > Друзі > Братья > Просто
    
    if (mixActive) {
      // 🆕 БЛОК "МІКС"
      console.log("🔄 [generator] Базовое правило: МІКС");
      console.log("   📌 Выбранные цифры:", mixDigits);
      console.log("   📌 Только сложение:", blocks?.mix?.onlyAddition);
      console.log("   📌 Только вычитание:", blocks?.mix?.onlySubtraction);

      RuleClass = MixRule;
      
      const selectedMixDigits = mixDigits
        .map(d => parseInt(d, 10))
        .filter(n => n >= 6 && n <= 9);

      ruleConfigForClass = {
        selectedDigits: selectedMixDigits.length > 0 ? selectedMixDigits : [6, 7, 8, 9],
        onlyAddition: blocks?.mix?.onlyAddition ?? false,
        onlySubtraction: blocks?.mix?.onlySubtraction ?? false,
        minSteps: minSteps,
        maxSteps: maxSteps,
        digitCount: 1,
        combineLevels: combineLevels,
        blocks: blocks
      };
      
    } else if (friendsActive) {
      // 🆕 БЛОК "ДРУЗІ"
      console.log("🤝 [generator] Базовое правило: ДРУЗІ");
      console.log("   📌 Выбранные друзья:", friendsDigits);
      console.log("   📌 Только сложение:", blocks?.friends?.onlyAddition);
      console.log("   📌 Только вычитание:", blocks?.friends?.onlySubtraction);

      RuleClass = FriendsRule;
      
      const selectedFriendsDigits = friendsDigits
        .map(d => parseInt(d, 10))
        .filter(n => n >= 1 && n <= 9);

      ruleConfigForClass = {
        selectedDigits: selectedFriendsDigits.length > 0 ? selectedFriendsDigits : [9],
        onlyAddition: blocks?.friends?.onlyAddition ?? false,
        onlySubtraction: blocks?.friends?.onlySubtraction ?? false,
        minSteps: minSteps,
        maxSteps: maxSteps,
        digitCount: 1,
        combineLevels: combineLevels,
        blocks: blocks
      };
      
    } else if (brothersActive) {
      // БЛОК "БРАТЬЯ"
      console.log("👬 [generator] Базовое правило: БРАТЬЯ");
      console.log("   📌 Выбранные братья:", brothersDigits);
      console.log("   📌 Только сложение:", blocks?.brothers?.onlyAddition);
      console.log("   📌 Только вычитание:", blocks?.brothers?.onlySubtraction);

      RuleClass = BrothersRule;
      
      const selectedBrothersDigits = brothersDigits
        .map(d => parseInt(d, 10))
        .filter(n => n >= 1 && n <= 4);

      ruleConfigForClass = {
        selectedDigits: selectedBrothersDigits.length > 0 ? selectedBrothersDigits : [4],
        onlyAddition: blocks?.brothers?.onlyAddition ?? false,
        onlySubtraction: blocks?.brothers?.onlySubtraction ?? false,
        minSteps: minSteps,
        maxSteps: maxSteps,
        digitCount: 1,
        combineLevels: combineLevels,
        blocks: blocks
      };
      
    } else {
      // БЛОК "ПРОСТО" (по умолчанию)
      console.log("📘 [generator] Базовое правило: ПРОСТО");
      
      RuleClass = UnifiedSimpleRule;
      
      // Преобразуем строковые цифры в числа
      const selectedSimpleDigits = simpleDigits
        .map(d => parseInt(d, 10))
        .filter(n => n >= 1 && n <= 9);

      // includeFive определяет максимальное состояние (4 или 9)
      const includeFive = selectedSimpleDigits.some(d => d >= 5);

      ruleConfigForClass = {
        selectedDigits: selectedSimpleDigits.length > 0 ? selectedSimpleDigits : [1, 2, 3, 4],
        includeFive: includeFive,
        onlyAddition: blocks?.simple?.onlyAddition ?? false,
        onlySubtraction: blocks?.simple?.onlySubtraction ?? false,
        minSteps: minSteps,
        maxSteps: maxSteps,
        digitCount: 1,
        combineLevels: combineLevels
      };
    }

    // === ВЫБИРАЕМ ОДНОРАЗРЯДНОЕ ИЛИ МНОГОРАЗРЯДНОЕ ===
    if (digitCount > 1) {
      console.log(`🔢 [generator] Режим МНОГОРАЗРЯДНЫЙ (${digitCount} разрядов)`);
      console.log(`   📌 Переменная разрядность: ${combineLevels}`);
      
      // Многоразрядный режим - используем MultiDigitGenerator
      rule = new MultiDigitGenerator(RuleClass, digitCount, {
        ...ruleConfigForClass,
        variableDigitCounts: combineLevels,
        minSteps: minSteps,
        maxSteps: maxSteps
      });
    } else {
      console.log("🔤 [generator] Режим ОДНОРАЗРЯДНЫЙ");
      
      // Одноразрядный режим - используем правило напрямую
      rule = new RuleClass(ruleConfigForClass);
    }

    //
    // 5. Генерируем пример
    //
    const gen = new ExampleGenerator(rule);
    const rawExample = gen.generate(); // { start, steps:[{action,fromState,toState}], answer }

    //
    // 6. Преобразуем к формату, который ждёт UI/trainer_logic:
    // {
    //    start: 0,
    //    steps: ["+3","+1","-4", ...],
    //    answer: 0
    // }
    //
    const formatted = gen.toTrainerFormat(rawExample);

    console.log(
      "✅ [generator] пример готов:",
      JSON.stringify(formatted, null, 2)
    );

    return formatted;
  } catch (error) {
    console.error("❌ [generator] Ошибка генерации примера:", error);
    console.error(error.stack);

    // Fallback: возвращаем простой пример
    console.warn("⚠️ [generator] Возвращаем fallback пример");
    return {
      start: 0,
      steps: ["+1", "+2", "-1"],
      answer: 2
    };
  }
}
