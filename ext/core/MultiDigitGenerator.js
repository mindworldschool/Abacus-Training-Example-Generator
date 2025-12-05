// ext/core/MultiDigitGenerator.js - Генератор многозначных примеров

/**
 * MultiDigitGenerator - класс-обёртка для генерации многозначных примеров.
 * 
 * Принимает любое правило (SimpleRule, BrothersRule, FriendsRule...) и применяет
 * его к каждому разряду НЕЗАВИСИМО, формируя многозначные числа.
 * 
 * КЛЮЧЕВЫЕ ОСОБЕННОСТИ:
 * 1. Каждый разряд живёт по правилам базового правила (физика абакуса)
 * 2. Использует ВЫБРАННЫЕ в настройках цифры (selectedDigits из config)
 * 3. Цифры в одном числе уникальны (например +21 ✅, +22 редко)
 * 4. Поддержка переменной разрядности (+389-27+164)
 * 5. Избегание нулевых разрядов (+20 максимум 1 раз)
 * 
 * ПРИМЕР 1 (выбрано [1,2,3,4,5]):
 * Разрядность: 2
 * Результат: +21+34-12+51 = 94
 * 
 * ПРИМЕР 2 (выбрано [1,2,3,4,5,6,7,8,9]):
 * Разрядность: 2
 * Результат: +19-76+82+34 = 59
 */

export class MultiDigitGenerator {
  /**
   * @param {Class} RuleClass - класс правила (UnifiedSimpleRule, BrothersRule...)
   * @param {number} maxDigitCount - максимальное количество разрядов (2-9)
   * @param {Object} config - конфигурация
   */
  constructor(RuleClass, maxDigitCount, config = {}) {
    // Создаём экземпляр базового правила с теми же настройками
    // selectedDigits берутся из config - пользователь выбирает их в UI
    this.baseRule = new RuleClass(config);
    
    // ВАЖНО: Количество разрядов в ПРИМЕРЕ (что показываем пользователю)
    this.displayDigitCount = Math.max(1, Math.min(9, maxDigitCount));
    
    // ВАЖНО: Абакус всегда на 1 разряд БОЛЬШЕ для переноса!
    this.maxDigitCount = this.displayDigitCount + 1;
    
    console.log(`📊 Разрядность: пример=${this.displayDigitCount}, абакус=${this.maxDigitCount}`);
    
    this.config = {
      ...config,
      maxDigitCount: this.maxDigitCount,
      
      // Режим переменной разрядности (переключатель в UI)
      // true: +123-12+56 (разная длина чисел)
      // false: +123+456-789 (фиксированная длина)
      variableDigitCounts: config.variableDigitCounts ?? false,
      
      // Вероятность повторяющихся цифр (+22, +33) - редко!
      duplicateDigitProbability: 0.1, // 10% шанс
      
      // Максимум нулевых разрядов в примере (+20, +100)
      maxZeroDigits: 1,
      
      // Счётчики для контроля редких событий
      _duplicatesUsed: 0,
      _zeroDigitsUsed: 0
    };
    
    // Имя для логов
    this.name = `${this.baseRule.name} (Multi-Digit ${this.displayDigitCount})`;
    
    // Получаем selectedDigits из базового правила
    const selectedDigits = this.baseRule.config?.selectedDigits || [];
    
    console.log(`🔢 MultiDigitGenerator создан:
  Базовое правило: ${this.baseRule.name}
  Разрядность примера: ${this.displayDigitCount}
  Разрядность абакуса: ${this.maxDigitCount} (+1 для переноса)
  Выбранные цифры: [${selectedDigits.join(', ')}]
  Переменная разрядность: ${this.config.variableDigitCounts}
  Вероятность дубликатов: ${this.config.duplicateDigitProbability * 100}%
  Макс. нулевых разрядов: ${this.config.maxZeroDigits}`);
  }

  /**
   * Генерирует начальное состояние - массив нулей для каждого разряда
   * @returns {Array<number>} - [0, 0, 0, ...] (младший разряд первый)
   */
  generateStartState() {
    return Array(this.maxDigitCount).fill(0);
  }

  /**
   * Генерирует количество шагов (делегирует базовому правилу)
   * @returns {number}
   */
  generateStepsCount() {
    return this.baseRule.generateStepsCount();
  }

  /**
   * Главный метод генерации примера
   * @returns {Object} { start: [0,0,...], steps: [...], answer: [n,n,...] }
   */
  generateExample() {
    const states = this.generateStartState();
    const stepsCount = this.generateStepsCount();
    const steps = [];
    
    console.log(`🎯 Генерация многозначного примера: ${stepsCount} шагов, разрядов: ${this.displayDigitCount} (абакус: ${this.maxDigitCount})`);
    
    // Сбрасываем счётчики редких событий
    this.config._duplicatesUsed = 0;
    this.config._zeroDigitsUsed = 0;
    
    // ВАЖНО: Гарантируем нужное количество шагов!
    let attempts = 0;
    const maxTotalAttempts = 1000; // Максимум попыток для всего примера
    
    while (steps.length < stepsCount && attempts < maxTotalAttempts) {
      attempts++;
      const isFirst = steps.length === 0;
      
      // Генерируем многозначное число
      const multiDigitAction = this._generateMultiDigitAction(states, isFirst, steps);
      
      if (!multiDigitAction) {
        // Не удалось - пробуем ещё раз
        if (attempts % 50 === 0) {
          console.warn(`⚠️ Попытка ${attempts}: не удалось сгенерировать шаг ${steps.length + 1}`);
        }
        continue;
      }
      
      // Применяем действие к каждому разряду (только к displayDigitCount!)
      const newStates = [...states];
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const digitAction = multiDigitAction.digits[pos] || 0;
        newStates[pos] += digitAction;
      }
      
      // Проверяем валидность новых состояний (только displayDigitCount!)
      let allValid = true;
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        if (newStates[pos] < 0 || newStates[pos] > 9) {
          allValid = false;
          console.warn(`⚠️ Разряд ${pos}: состояние ${newStates[pos]} выходит за 0-9`);
          break;
        }
      }
      
      if (!allValid) {
        // Невалидное состояние - пробуем ещё раз
        continue;
      }
      
      steps.push({
        action: multiDigitAction.sign * multiDigitAction.value, // ПОДПИСАННОЕ значение!
        states: [...newStates],
        digits: multiDigitAction.digits
      });
      
      // Обновляем состояния (только displayDigitCount!)
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        states[pos] = newStates[pos];
      }
      
      console.log(`  ✅ Шаг ${steps.length}/${stepsCount}: ${multiDigitAction.sign > 0 ? '+' : ''}${multiDigitAction.value}, состояния: [${states.slice(0, this.displayDigitCount).join(', ')}]`);
    }
    
    if (steps.length < stepsCount) {
      console.warn(`⚠️ Удалось сгенерировать только ${steps.length} из ${stepsCount} шагов за ${attempts} попыток`);
    }
    
    return {
      start: this.generateStartState(),
      steps,
      answer: [...states]
    };
  }

  /**
   * Генерирует одно многозначное число (например +21, -345)
   * @param {Array<number>} states - текущие состояния разрядов
   * @param {boolean} isFirst - это первый шаг?
   * @param {Array} previousSteps - предыдущие шаги (для анализа)
   * @returns {Object|null} { value: 21, sign: 1, digits: [1, 2] }
   */
  _generateMultiDigitAction(states, isFirst, previousSteps) {
    const maxAttempts = 100; // Увеличено с 50 до 100
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Определяем количество разрядов для этого числа
        const digitCount = this._chooseDigitCount(isFirst);
        
        // Генерируем цифры для каждого разряда
        const result = this._generateDigits(states, digitCount, isFirst, previousSteps);
        
        if (!result) continue;
        
        // Проверяем валидность
        if (this._validateMultiDigitAction(result, states, isFirst)) {
          return result;
        }
      } catch (error) {
        if (attempt % 20 === 0) {
          console.warn(`  Попытка ${attempt}: ${error.message}`);
        }
      }
    }
    
    console.warn(`⚠️ Не удалось сгенерировать действие за ${maxAttempts} попыток, состояния: [${states.join(', ')}]`);
    return null;
  }

  /**
   * Выбирает количество разрядов для текущего числа
   * @param {boolean} isFirst - первый шаг?
   * @returns {number} - количество разрядов (1..displayDigitCount)
   */
  _chooseDigitCount(isFirst) {
    // Первое число всегда максимальной разрядности
    if (isFirst) {
      return this.displayDigitCount;
    }
    
    // Режим фиксированной разрядности
    if (!this.config.variableDigitCounts) {
      return this.displayDigitCount;
    }
    
    // 🔥 РЕЖИМ ПЕРЕМЕННОЙ РАЗРЯДНОСТИ:
    // Генерируем числа разной длины (например: +123-45+678)
    // Минимум: displayDigitCount - 1 (но не меньше 1)
    // Максимум: displayDigitCount
    
    const minDigits = Math.max(1, this.displayDigitCount - 1);  // ✅ Минимум 1 разряд для переменной разрядности;
    const maxDigits = this.displayDigitCount;
    
    // Если они равны (например для однозначных: min=1, max=1) → возвращаем фиксированное
    if (minDigits === maxDigits) {
      return maxDigits;
    }
    
    // Случайный выбор с весами (предпочтение большим разрядностям)
    // Например для 3-значных: 2 разряда (вес 2) или 3 разряда (вес 3)
    const weights = [];
    for (let i = minDigits; i <= maxDigits; i++) {
      weights.push({ count: i, weight: i });
    }
    
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const w of weights) {
      random -= w.weight;
      if (random <= 0) {
        console.log(`  📊 Переменная разрядность: выбрано ${w.count} разрядов (из ${minDigits}-${maxDigits})`);
        return w.count;
      }
    }
    
    return maxDigits;
  }

  /**
   * Генерирует цифры для каждого разряда
   * ПРАВИЛЬНАЯ ЛОГИКА (от пользователя):
   * 1. Для каждого разряда получаем доступные действия
   * 2. СКЛЕИВАЕМ все возможные комбинации
   * 3. Фильтруем: все разряды одного знака
   * 4. Выбираем случайную комбинацию
   * 
   * @param {Array<number>} states - текущие состояния
   * @param {number} digitCount - сколько разрядов использовать
   * @param {boolean} isFirst - первый шаг?
   * @param {Array} previousSteps - история шагов
   * @returns {Object|null}
   */
  _generateDigits(states, digitCount, isFirst, previousSteps) {
    console.log(`  🎲 Генерация ${digitCount}-значного числа из состояний [${states.slice(0, digitCount).join(', ')}]`);
    
    const allowDuplicates = Math.random() < this.config.duplicateDigitProbability
      && this.config._duplicatesUsed < 1;
    
    // === ШАГ 1: Собираем действия для КАЖДОГО разряда ===
    const actionsPerPosition = [];
    
    for (let pos = 0; pos < this.displayDigitCount; pos++) {
      const currentState = states[pos];
      
      // 🔥 ИСПРАВЛЕНИЕ: isFirstAction зависит от СОСТОЯНИЯ разряда, а не от позиции!
      // Если разряд в состоянии 0, то из него можно только добавлять (+N)
      // Это физическое ограничение абакуса, а не позиция в числе!
      const isFirstForDigit = (currentState === 0);
      
      // 🔥 ИСПРАВЛЕНИЕ: Вызываем с правильными параметрами в зависимости от правила
      // UnifiedSimpleRule: (state, isFirstAction, position)
      // BrothersRule: (state, isFirstAction, previousSteps)
      let availableActions;
      if (this.baseRule.name === "Братья") {
        // Для BrothersRule передаём previousSteps
        availableActions = this.baseRule.getAvailableActions(
          currentState,
          isFirstForDigit,
          previousSteps
        );
      } else {
        // Для UnifiedSimpleRule передаём position
        availableActions = this.baseRule.getAvailableActions(
          currentState,
          isFirstForDigit,
          pos
        );
      }
      
      if (!availableActions || availableActions.length === 0) {
        console.log(`  ⚠️ Разряд ${pos} (состояние ${currentState}): нет доступных действий`);
        actionsPerPosition[pos] = [];
        continue;
      }
      
      // Извлекаем числовые значения
      const actions = [];
      for (const action of availableActions) {
        const value = this._getActionValue(action);
        if (value !== 0) {
          actions.push(value);
        }
      }
      
      actionsPerPosition[pos] = actions;
      console.log(`  📍 Разряд ${pos} (состояние ${currentState}, isFirst=${isFirstForDigit}): [${actions.join(', ')}]`);
    }
    
    // Проверяем что есть хоть какие-то действия
    const hasAnyActions = actionsPerPosition.some(arr => arr.length > 0);
    if (!hasAnyActions) {
      console.log(`  ❌ Нет действий ни для одного разряда`);
      return null;
    }
    
    // === ШАГ 2: СКЛЕИВАЕМ все возможные комбинации ===
    // ОПТИМИЗАЦИЯ: вместо генерации всех комбинаций (может быть 10^n),
    // сначала выбираем ЗНАК, потом для каждого разряда выбираем действие
    
    // Определяем, какие знаки вообще возможны
    const possibleSigns = new Set();
    for (const actions of actionsPerPosition) {
      for (const action of actions) {
        if (action > 0) possibleSigns.add(1);
        if (action < 0) possibleSigns.add(-1);
      }
    }
    
    if (possibleSigns.size === 0) {
      console.log(`  ❌ Нет действий с ненулевым знаком`);
      return null;
    }
    
    console.log(`  ✓ Возможные знаки: [${Array.from(possibleSigns).map(s => s > 0 ? '+' : '-').join(', ')}]`);
    
    // === ПРИОРИТИЗАЦИЯ ЗНАКОВ ДЛЯ РАЗНООБРАЗИЯ ===
    let preferredSign = null;
    let priorityReason = '';
    
    // 1. АНАЛИЗ СОСТОЯНИЙ: избегаем крайних значений (0,0) и (9,9)
    const usedStates = states.slice(0, this.displayDigitCount);
    const stateSum = usedStates.reduce((sum, s) => sum + s, 0);
    const avgState = stateSum / this.displayDigitCount;
    
    // Если состояния близки к максимуму (например [9,9] или [8,9]) → приоритет минусу
    if (avgState >= 7.5 && possibleSigns.has(-1)) {
      preferredSign = -1;
      priorityReason = `состояния близки к максимуму (среднее ${avgState.toFixed(1)})`;
      console.log(`  🎯 Предпочитаем минус: ${priorityReason}`);
    }
    // Если состояния близки к минимуму (например [0,0] или [1,0]) → приоритет плюсу
    else if (avgState <= 1.5 && possibleSigns.has(1) && !isFirst) {
      preferredSign = 1;
      priorityReason = `состояния близки к минимуму (среднее ${avgState.toFixed(1)})`;
      console.log(`  🎯 Предпочитаем плюс: ${priorityReason}`);
    }
    // 2. АНАЛИЗ ПОСЛЕДНИХ ШАГОВ: чередование знаков
    else if (previousSteps.length >= 2) {
      const lastSign = Math.sign(previousSteps[previousSteps.length - 1].action);
      const prevSign = Math.sign(previousSteps[previousSteps.length - 2].action);
      
      // Если последние 2 шага одного знака → предпочесть противоположный
      if (lastSign === prevSign && lastSign !== 0) {
        preferredSign = -lastSign;
        priorityReason = `последние 2 шага были ${lastSign > 0 ? '+' : '-'}`;
        console.log(`  🎯 Предпочитаем знак ${preferredSign > 0 ? '+' : '-'} (${priorityReason})`);
      }
    }
    
    // Пробуем сгенерировать с каждым возможным знаком
    const signs = Array.from(possibleSigns);
    
    // 🔥 УМНАЯ ПРИОРИТИЗАЦИЯ:
    // Если есть предпочитаемый знак И он возможен → ставим его первым
    if (preferredSign !== null && signs.includes(preferredSign)) {
      // Убираем preferredSign из массива
      const index = signs.indexOf(preferredSign);
      if (index > -1) {
        signs.splice(index, 1);
      }
      // Ставим его первым
      signs.unshift(preferredSign);
      console.log(`  ✨ Приоритет знаку ${preferredSign > 0 ? '+' : '-'} для разнообразия`);
    } else {
      // Иначе случайный порядок знаков (как раньше)
      for (let i = signs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [signs[i], signs[j]] = [signs[j], signs[i]];
      }
    }
    
    for (const targetSign of signs) {
      console.log(`  🔄 Пробуем знак: ${targetSign > 0 ? '+' : '-'}`);
      
      const digits = Array(this.maxDigitCount).fill(0);
      const usedDigits = new Set();
      let success = true;
      
      // Для каждого разряда выбираем действие с нужным знаком
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const actions = actionsPerPosition[pos];
        if (!actions || actions.length === 0) {
          // Нет действий для этого разряда - оставляем 0
          continue;
        }
        
        // Фильтруем по знаку
        let filtered = actions.filter(a => Math.sign(a) === targetSign);
        
        // Если это первый разряд и это первое действие - не можем начинать с минуса
        if (isFirst && pos === this.displayDigitCount - 1 && filtered.length === 0 && targetSign < 0) {
          success = false;
          break;
        }
        
        if (filtered.length === 0) {
          // Нет действий с нужным знаком для этого разряда
          // Оставляем 0 и продолжаем
          continue;
        }
        
        // Фильтруем по уникальности
        if (!allowDuplicates) {
          const unique = filtered.filter(a => !usedDigits.has(Math.abs(a)));
          if (unique.length > 0) {
            filtered = unique;
          }
        }
        
        // Выбираем случайное действие
        const chosen = filtered[Math.floor(Math.random() * filtered.length)];
        digits[pos] = chosen;
        usedDigits.add(Math.abs(chosen));
        
        console.log(`    ✓ Разряд ${pos}: выбрано ${chosen > 0 ? '+' : ''}${chosen}`);
      }
      
      if (!success) {
        console.log(`  ❌ Знак ${targetSign > 0 ? '+' : '-'} не подходит`);
        continue;
      }
      
      // Проверяем что есть хоть одна ненулевая цифра
      const hasNonZero = digits.some(d => d !== 0);
      if (!hasNonZero) {
        console.log(`  ❌ Все разряды нулевые`);
        continue;
      }
      
      // 🔥 КРИТИЧЕСКАЯ ПРОВЕРКА: Старший разряд НЕ может быть 0!
      // Для фиксированной разрядности: проверяем displayDigitCount
      // Для переменной разрядности: проверяем выбранный digitCount
      const actualDigitCount = digitCount || this.displayDigitCount;
      const highestDigit = digits[actualDigitCount - 1];
      
      if (highestDigit === 0) {
        console.log(`  ❌ Старший разряд (pos ${actualDigitCount - 1}) нулевой → получится меньше разрядов`);
        continue;
      }
      
      // Успех! Считаем значение
      let value = 0;
      let finalSign = 0;
      
      for (let pos = 0; pos < this.displayDigitCount; pos++) {
        const d = digits[pos];
        if (d !== 0) {
          value += Math.abs(d) * Math.pow(10, pos);
          if (finalSign === 0) finalSign = Math.sign(d);
        }
      }
      
      console.log(`  ✅ Сгенерировано: ${finalSign >= 0 ? '+' : '-'}${value}, разряды: [${digits.slice(0, this.displayDigitCount).join(', ')}]`);
      
      return {
        value,
        sign: finalSign,
        digits,
        digitCount,
        usedDigits: Array.from(usedDigits)
      };
    }
    
    // Не удалось ни с одним знаком
    console.log(`  ❌ Не удалось сгенерировать ни с одним знаком`);
    return null;
  }

  /**
   * Валидация сгенерированного многозначного числа
   */
  _validateMultiDigitAction(result, states, isFirst) {
    const { digits, value, sign } = result;
    
    // 1. Значение должно быть > 0
    if (value === 0) {
      return false;
    }
    
    // 2. Проверяем количество нулевых разрядов (смягчаем - разрешаем больше)
    // 🔥 ИСПРАВЛЕНИЕ: Считаем только ИСПОЛЬЗУЕМЫЕ разряды, БЕЗ резервного!
    const usedDigits = digits.slice(0, this.displayDigitCount);
    const zeroCount = usedDigits.filter(d => d === 0).length;
    if (zeroCount > 0 && zeroCount >= this.displayDigitCount - 1) {
      // Слишком много нулей (например +00 в двузначном)
      if (this.config._zeroDigitsUsed >= this.config.maxZeroDigits) {
        return false;
      }
      this.config._zeroDigitsUsed++;
    }
    
    // 3. Проверяем, что новые состояния валидны (только displayDigitCount!)
    for (let pos = 0; pos < this.displayDigitCount; pos++) {
      const newState = states[pos] + digits[pos];
      if (newState < 0 || newState > 9) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Извлекает числовое значение из действия (может быть число или объект)
   */
  _getActionValue(action) {
    if (typeof action === 'object' && action !== null) {
      return action.value ?? 0;
    }
    return action;
  }

  /**
   * Выбирает случайный элемент из массива
   */
  _chooseRandom(array) {
    if (!array || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Применяет действие к состоянию
   * @param {Array<number>} state - массив состояний разрядов
   * @param {number|Object} action - действие (многозначное число или объект)
   * @returns {Array<number>}
   */
  applyAction(state, action) {
    if (typeof action === 'object' && action.digits) {
      // Объект с digits (из generateExample)
      const newState = [...state];
      for (let pos = 0; pos < this.maxDigitCount; pos++) {
        newState[pos] += (action.digits[pos] || 0);
      }
      return newState;
    }
    
    // Если число - раскладываем по разрядам
    const absValue = Math.abs(action);
    const sign = Math.sign(action);
    const digits = this._numberToDigits(absValue);
    
    const newState = [...state];
    for (let pos = 0; pos < this.maxDigitCount; pos++) {
      newState[pos] += sign * (digits[pos] || 0);
    }
    return newState;
  }

  /**
   * Раскладывает число на разряды
   * @param {number} num - число (например 123)
   * @returns {Array<number>} - [3, 2, 1] (младший разряд первый)
   */
  _numberToDigits(num) {
    const digits = [];
    let n = Math.abs(num);
    
    for (let i = 0; i < this.maxDigitCount; i++) {
      digits.push(n % 10);
      n = Math.floor(n / 10);
    }
    
    return digits;
  }

  /**
   * Преобразует состояние в число
   * @param {Array<number>} state - массив разрядов [3, 2, 1, 0] (младший первый + разряд переноса)
   * @returns {number} - число 123 (без учёта разряда переноса)
   */
  stateToNumber(state) {
    if (!Array.isArray(state)) return 0;
    
    // Считаем только displayDigitCount разрядов (без старшего разряда переноса)
    let result = 0;
    for (let i = 0; i < this.displayDigitCount && i < state.length; i++) {
      result += state[i] * Math.pow(10, i);
    }
    
    return result;
  }

  /**
   * Проверяет валидность состояния
   * @param {Array<number>} state
   * @returns {boolean}
   */
  isValidState(state) {
    if (!Array.isArray(state)) return false;
    return state.every(digit => digit >= 0 && digit <= 9);
  }

  /**
   * Форматирует действие для UI
   * @param {number|Object} action
   * @returns {string}
   */
  formatAction(action) {
    const value = typeof action === 'object' ? action.value : action;
    return value >= 0 ? `+${value}` : `${value}`;
  }

  /**
   * Валидация готового примера
   * @param {Object} example
   * @returns {boolean}
   */
  validateExample(example) {
    const { start, steps, answer } = example;
    
    // 1. Старт должен быть массивом нулей
    if (!Array.isArray(start) || start.some(s => s !== 0)) {
      console.error('❌ MultiDigit: стартовое состояние должно быть [0,0,...]');
      return false;
    }
    
    // 2. Проверяем каждый шаг
    let currentStates = [...start];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Первый шаг должен быть положительным
      if (i === 0 && step.action < 0) {
        console.error('❌ MultiDigit: первый шаг должен быть положительным');
        return false;
      }
      
      // Применяем шаг
      currentStates = this.applyAction(currentStates, step);
      
      // Проверяем валидность состояний
      if (!this.isValidState(currentStates)) {
        console.error(`❌ MultiDigit: шаг ${i + 1} привёл к невалидному состоянию [${currentStates.join(', ')}]`);
        return false;
      }
    }
    
    // 3. Финальное состояние должно совпадать с ответом
    const finalNumber = this.stateToNumber(currentStates);
    const answerNumber = this.stateToNumber(answer);
    
    if (finalNumber !== answerNumber) {
      console.error(`❌ MultiDigit: финал ${finalNumber} ≠ ответ ${answerNumber}`);
      return false;
    }
    
    console.log(`✅ MultiDigit: пример валиден (${steps.length} шагов, финал ${finalNumber})`);
    return true;
  }
}
