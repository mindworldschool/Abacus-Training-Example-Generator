// ext/core/generator.js
//
// Генератор примеров для тренажёра.
// Отвечает за:
//  - чтение настроек из UI,
//  - подготовку конфигурации правила,
//  - вызов ExampleGenerator,
//  - адаптацию результата под формат тренажёра.
//
// Работает сейчас в первую очередь для режима "Просто":
//   - последовательные шаги вида +3, +1, -4 ...
//   - без "братьев", "друзей", "через 5"
//   - без переноса между столбцами (каждый столбец живёт сам по себе)
//
// Зависимости:
//  - UnifiedSimpleRule — описывает допустимые шаги (+N / -N), физику абакуса,
//    учитывает includeFive (Просто 4 / Просто 5), запрет первого минуса и т.д.
//  - ExampleGenerator — строит саму цепочку шагов, опираясь на правило

import { UnifiedSimpleRule } from "./rules/UnifiedSimpleRule.js";
import { ExampleGenerator } from "./ExampleGenerator.js";
import { BrothersRule } from "./rules/BrothersRule.js";
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
    console.log("🔍 [generator] settings.blocks?.simple?.digits:", settings.blocks?.simple?.digits);
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

  // 🔥 УБРАНО ОГРАНИЧЕНИЕ:
  // Раньше для многозначных обрезали до 4 из-за проблем с генерацией.
  // Теперь физика работает правильно → можно генерировать больше шагов!
  
  //
  // 3. Какие цифры разрешены ребёнку в блоке "Просто"
  //
  // Это КЛЮЧЕВО.
  //
  // Мы больше НЕ раскладываем большие числа "7 = 5+2".
  // Сейчас каждое действие в примере — это сразу ±d,
  // и d должен В ПРЯМУЮ входить в выбранный список.
  //
  // Примеры:
  //   digits=[3]          → можно +3, -3
  //   digits=[2,5,7]      → можно +2,-2,+5,-5,+7,-7
  //   digits=[1..9]       → полная свобода
  //
  const blocks = settings.blocks || {};
  const originalDigits = Array.isArray(blocks?.simple?.digits)
    ? blocks.simple.digits
        .map(n => parseInt(n, 10))
        .filter(n => Number.isFinite(n))
    : [1, 2, 3, 4]; // дефолт если UI не прислал ничего

  // Уникализируем и сортируем для стабильности
  const selectedDigits = Array.from(new Set(originalDigits)).sort(
    (a, b) => a - b
  );

  console.log("🔍 [generator] originalDigits:", originalDigits);
  console.log("🔍 [generator] selectedDigits (для блока Просто):", selectedDigits);

  //
  // 4. includeFive — методический флаг.
  //
  // Если includeFive === false:
  //   - нельзя использовать верхнюю бусину,
  //   - стойка живёт в диапазоне 0..4,
  //   - мы не генерируем дельту ±5.
  //
  // Если includeFive === true:
  //   - можно использовать верхнюю бусину,
  //   - стойка живёт в диапазоне 0..9,
  //   - возможны ходы с верхней.
  //
  const includeFive =
    (blocks?.simple?.includeFive ??
      settings.includeFive ??
      selectedDigits.includes(5)) === true;

  //
  // 5. Ограничения направления:
  //    onlyAddition = "тренируем только сложение"
  //    onlySubtraction = "тренируем только вычитание"
  //
  const onlyAddition =
    (blocks?.simple?.onlyAddition ??
      settings.onlyAddition ??
      false) === true;
  const onlySubtraction =
    (blocks?.simple?.onlySubtraction ??
      settings.onlySubtraction ??
      false) === true;

  //
  // 6. Флаги будущих методик.
  // 🔥 ВАЖНО: Блок считается активным, если в нем выбраны цифры (digits.length > 0)
  // Поле "active" не используется в state.js, поэтому проверяем digits.
  //
  const brothersDigits = Array.isArray(blocks?.brothers?.digits)
    ? blocks.brothers.digits.filter(d => {
        const parsed = parseInt(d, 10);
        return !isNaN(parsed) && parsed >= 1 && parsed <= 4;
      })
    : [];
  const friendsDigits = Array.isArray(blocks?.friends?.digits)
    ? blocks.friends.digits.filter(d => d != null && d !== "")
    : [];
  const mixDigits = Array.isArray(blocks?.mix?.digits)
    ? blocks.mix.digits.filter(d => d != null && d !== "")
    : [];

  const brothersActive = brothersDigits.length > 0;
  const friendsActive = friendsDigits.length > 0;
  const mixActive = mixDigits.length > 0;

  console.log(`🔍 [generator] Проверка активации блоков:`, {
    brothersDigits,
    brothersActive,
    blocksFromSettings: blocks?.brothers
  });

  //
  // 7. Собираем конфигурацию для правил.
  //
  // Эта конфигурация используется как для UnifiedSimpleRule, так и для BrothersRule.
  //
  const ruleConfig = {
    // структура числа
    digitCount: digitCount,
    combineLevels: combineLevels,

    // желаемая длина примера
    minSteps: minSteps,
    maxSteps: maxSteps,

    // какие абсолютные шаги вообще можно давать ребёнку (+d / -d)
    selectedDigits: selectedDigits,

    // доступ к верхней бусине (формирует режим "Просто 4" vs "Просто 5")
    includeFive: includeFive,
    hasFive: includeFive, // совместимость со старым кодом

    // ограничения направления
    onlyAddition: onlyAddition,
    onlySubtraction: onlySubtraction,

    // методическое правило блока "Просто":
    firstActionMustBePositive: true,

    // эти два поля сейчас не используются в "Просто",
    // но оставляем, чтобы внешний код не падал
    requireBlock: false,
    blockPlacement: "auto",

    // передаём исходный блок настроек целиком (UI),
    // чтобы правило при желании могло подсмотреть детали
    blocks: blocks
  };

  console.log(
    "🧩 [generator] ruleConfig:",
    JSON.stringify(
      {
        digitCount: ruleConfig.digitCount,
        combineLevels: ruleConfig.combineLevels,
        minSteps: ruleConfig.minSteps,
        maxSteps: ruleConfig.maxSteps,
        selectedDigits: ruleConfig.selectedDigits,
        includeFive: ruleConfig.includeFive,
        onlyAddition: ruleConfig.onlyAddition,
        onlySubtraction: ruleConfig.onlySubtraction,
        brothersActive: brothersActive,
        brothersDigits: brothersDigits,
        friendsActive: friendsActive,
        mixActive: mixActive
      },
      null,
      2
    )
  );

  //
  // 8. Создаём правило.
  //
  // Логика выбора:
  // 1. Определяем базовый класс правила (UnifiedSimpleRule или BrothersRule)
  // 2. Если digitCount > 1 → оборачиваем в MultiDigitGenerator
  // 3. Если digitCount === 1 → используем правило напрямую
  //
  let rule;

// === ОПРЕДЕЛЯЕМ БАЗОВЫЙ КЛАСС ПРАВИЛА ===
let RuleClass;
let ruleConfigForClass;

if (brothersActive === true) {
  console.log("👬 [generator] Базовое правило: БРАТЬЯ");
  console.log("   📌 Выбранные братья:", brothersDigits);
  console.log("   📌 Только сложение:", blocks?.brothers?.onlyAddition);
  console.log("   📌 Только вычитание:", blocks?.brothers?.onlySubtraction);

  RuleClass = BrothersRule;
  
  // Преобразуем строковые цифры в числа
  const selectedBrothersDigits = brothersDigits
    .map(d => parseInt(d, 10))
    .filter(n => n >= 1 && n <= 4);

  ruleConfigForClass = {
    selectedDigits: selectedBrothersDigits.length > 0 ? selectedBrothersDigits : [4],
    onlyAddition: blocks?.brothers?.onlyAddition ?? false,
    onlySubtraction: blocks?.brothers?.onlySubtraction ?? false,
    minSteps: minSteps,
    maxSteps: maxSteps,
    digitCount: 1, // Базовое правило всегда для 1 разряда
    combineLevels: combineLevels,
    blocks: blocks
  };
} else {
  console.log("📘 [generator] Базовое правило: ПРОСТО");
  RuleClass = UnifiedSimpleRule;
  ruleConfigForClass = {
    ...ruleConfig,
    digitCount: 1 // Базовое правило всегда для 1 разряда
  };
}

// === ВЫБИРАЕМ ОДНОРАЗРЯДНОЕ ИЛИ МНОГОРАЗРЯДНОЕ ===
if (digitCount > 1) {
  console.log(`🔢 [generator] Режим МНОГОРАЗРЯДНЫЙ (${digitCount} разрядов)`);
  console.log(`   📌 Переменная разрядность: ${combineLevels}`);
  
  // Многоразрядный режим - используем MultiDigitGenerator
  rule = new MultiDigitGenerator(RuleClass, digitCount, {
    ...ruleConfigForClass,
    variableDigitCounts: combineLevels, // Переключатель из UI
    minSteps: minSteps,
    maxSteps: maxSteps
  });
} else {
  console.log("🔤 [generator] Режим ОДНОРАЗРЯДНЫЙ");
  
  // Одноразрядный режим - используем правило напрямую
  rule = new RuleClass(ruleConfigForClass);
}  
  //
  // 9. Генерируем пример.
  //
  const gen = new ExampleGenerator(rule);
  const rawExample = gen.generate(); // { start, steps:[{action,fromState,toState}], answer }

  //
  // 10. Преобразуем к формату, который ждёт UI/trainer_logic:
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
