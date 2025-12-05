// core/ExampleGenerator.js - Генератор примеров на основе правил

export class ExampleGenerator {
  constructor(rule) {
    this.rule = rule;
    console.log(`⚙️ Генератор создан с правилом: ${rule.name}`);
  }

  /**
   * Сгенерировать один пример.
   *  - если digitCount === 1 → одноразрядная логика (_generateSingleDigitAttempt)
   *  - если digitCount > 1 и правило НЕ MultiDigitGenerator → векторная логика
   *  - если правило MultiDigitGenerator → используем его метод напрямую
   */
  generate() {
    const ruleName = this.rule.constructor.name;
    const isMultiDigit = ruleName === 'MultiDigitGenerator';
    
    // Если правило - это MultiDigitGenerator, он сам генерирует пример
    if (isMultiDigit) {
      console.log('🔢 ExampleGenerator: используем MultiDigitGenerator');
      return this.rule.generateExample();
    }
    
    // Иначе используем старую логику
    const digitCount = this.rule.config?.digitCount || 1;
    const combineLevels = this.rule.config?.combineLevels || false;

    // Сколько попыток даём генератору, чтобы подобрать валидную цепочку
    let maxAttempts = digitCount === 1 ? 100 : (digitCount <= 3 ? 200 : 250);

    if (!combineLevels && digitCount > 1) {
      maxAttempts *= 2;
    }

    console.log(
      `🎯 Генерация примера: digitCount=${digitCount}, combineLevels=${combineLevels}, попыток=${maxAttempts}`
    );

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        let example;

        if (digitCount === 1) {
          example = this._generateSingleDigitAttempt();
        } else {
          example = this._generateMultiDigitAttemptVectorBased();
        }

        // Если получили цепочку длиннее лимита maxSteps — обрежем и пересчитаем ответ
        const maxStepsAllowed =
          this.rule.config?.maxSteps ??
          this.rule.config?.stepsCount ??
          10;

        if (example.steps.length > maxStepsAllowed) {
          example.steps = example.steps.slice(0, maxStepsAllowed);
          
          // Пересчитываем финальный ответ
          let finalState = example.start;
          for (const step of example.steps) {
            finalState += step.action;
          }
          example.answer = finalState;
        }

        // Валидация
        if (this.rule.validateExample && !this.rule.validateExample(example)) {
          continue;
        }

        console.log(`✅ Пример сгенерирован за ${attempt} попыток`);
        return example;
      } catch (err) {
        if (attempt % 50 === 0) {
          console.warn(`⚠️ Попытка ${attempt}/${maxAttempts} не удалась:`, err.message);
        }
      }
    }

    // Если не удалось за maxAttempts попыток - возвращаем минимальный пример
    console.error('❌ Не удалось сгенерировать пример за отведённые попытки');
    return this._generateFallbackExample();
  }

  /**
   * Генерация одноразрядного примера
   */
  _generateSingleDigitAttempt() {
    const startState = this.rule.generateStartState ? this.rule.generateStartState() : 0;
    const stepsCount = this.rule.generateStepsCount ? this.rule.generateStepsCount() : 3;

    let currentState = startState;
    const steps = [];

    for (let i = 0; i < stepsCount; i++) {
      const isFirst = (i === 0);
      const available = this.rule.getAvailableActions(currentState, isFirst, 0);

      if (!available || available.length === 0) {
        throw new Error(`Нет доступных действий на шаге ${i}, state=${currentState}`);
      }

      const action = available[Math.floor(Math.random() * available.length)];
      const nextState = this.rule.applyAction(currentState, action);

      steps.push({
        action: action,
        fromState: currentState,
        toState: nextState
      });

      currentState = nextState;
    }

    return {
      start: startState,
      steps: steps,
      answer: currentState
    };
  }

  /**
   * Генерация многоразрядного примера (векторная логика)
   */
  _generateMultiDigitAttemptVectorBased() {
    const digitCount = this.rule.config.digitCount || 1;
    const combineLevels = this.rule.config.combineLevels || false;

    // Стартовое состояние - вектор из digitCount нулей
    const startStateVector = new Array(digitCount).fill(0);
    const stepsCount = this.rule.generateStepsCount ? this.rule.generateStepsCount() : 3;

    let currentStateVector = [...startStateVector];
    const steps = [];

    for (let i = 0; i < stepsCount; i++) {
      const isFirst = (i === 0);

      if (combineLevels) {
        // Один общий шаг для всех разрядов
        const action = this._pickCombinedAction(currentStateVector, isFirst);
        
        // Применяем ко всем разрядам
        const nextStateVector = currentStateVector.map((val, pos) => {
          return this.rule.applyAction(val, action);
        });

        steps.push({
          action: action,
          fromState: this._vectorToNumber(currentStateVector),
          toState: this._vectorToNumber(nextStateVector)
        });

        currentStateVector = nextStateVector;
      } else {
        // Независимые шаги для каждого разряда
        const nextStateVector = [...currentStateVector];

        for (let pos = 0; pos < digitCount; pos++) {
          const available = this.rule.getAvailableActions(
            currentStateVector[pos],
            isFirst,
            pos
          );

          if (available && available.length > 0) {
            const action = available[Math.floor(Math.random() * available.length)];
            nextStateVector[pos] = this.rule.applyAction(currentStateVector[pos], action);
          }
        }

        // Записываем как один шаг
        const totalAction = this._vectorToNumber(nextStateVector) - this._vectorToNumber(currentStateVector);
        
        steps.push({
          action: totalAction,
          fromState: this._vectorToNumber(currentStateVector),
          toState: this._vectorToNumber(nextStateVector)
        });

        currentStateVector = nextStateVector;
      }
    }

    return {
      start: this._vectorToNumber(startStateVector),
      steps: steps,
      answer: this._vectorToNumber(currentStateVector)
    };
  }

  /**
   * Выбор действия для комбинированного режима
   */
  _pickCombinedAction(stateVector, isFirst) {
    // Берем доступные действия для первого разряда
    const available = this.rule.getAvailableActions(stateVector[0], isFirst, 0);
    
    if (!available || available.length === 0) {
      throw new Error('Нет доступных действий для комбинированного режима');
    }

    return available[Math.floor(Math.random() * available.length)];
  }

  /**
   * Преобразование вектора в число
   */
  _vectorToNumber(vector) {
    return vector.reduce((sum, val, idx) => {
      return sum + val * Math.pow(10, vector.length - 1 - idx);
    }, 0);
  }

  /**
   * Fallback пример на случай полного провала генерации
   */
  _generateFallbackExample() {
    console.warn('⚠️ Используем fallback пример');
    return {
      start: 0,
      steps: [
        { action: 1, fromState: 0, toState: 1 },
        { action: 1, fromState: 1, toState: 2 },
        { action: -1, fromState: 2, toState: 1 }
      ],
      answer: 1
    };
  }

  /**
   * Преобразование в формат для trainer_logic
   * { start: 0, steps: ["+3", "+1", "-2"], answer: 2 }
   */
  toTrainerFormat(example) {
    return {
      start: example.start,
      steps: example.steps.map(step => {
        const action = step.action;
        return action > 0 ? `+${action}` : `${action}`;
      }),
      answer: example.answer
    };
  }
}
