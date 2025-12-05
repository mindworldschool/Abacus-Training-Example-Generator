// print/PrintGenerator.js
// Генератор пакета примеров для печати

import { generateExample } from "../core/generator.js";

/**
 * PrintGenerator - генератор пакета примеров для печатных листов
 * 
 * ФУНКЦИОНАЛ:
 * - Генерация N примеров по заданным настройкам
 * - Интеграция всех правил (Просто, Братья, Друзі, Мікс)
 * - Валидация параметров
 * - Обработка ошибок генерации
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * const generator = new PrintGenerator({
 *   examplesCount: 20,
 *   actionsCount: 5,
 *   digitCount: 1,
 *   blocks: { simple: { digits: [1,2,3,4,5] } }
 * });
 * 
 * const examples = generator.generate();
 * // => [{ id: 1, steps: ['+3', '+1', '-2'], answer: 2 }, ...]
 */
export class PrintGenerator {
  constructor(config) {
    this.config = {
      // Количество примеров для генерации
      examplesCount: config.examplesCount || 20,
      
      // Количество действий в каждом примере
      actionsCount: config.actionsCount || 5,
      
      // Разрядность (1-9)
      digitCount: config.digitCount || 1,
      
      // Активные блоки
      blocks: config.blocks || {},
      
      // Комбинирование разрядов (для многоразрядных)
      combineLevels: config.combineLevels || false,
      
      // Максимум попыток на один пример
      maxAttemptsPerExample: config.maxAttemptsPerExample || 100,
      
      // Логировать процесс
      verbose: config.verbose ?? false
    };

    console.log("🖨️ PrintGenerator создан:", {
      примеров: this.config.examplesCount,
      действий: this.config.actionsCount,
      разрядность: this.config.digitCount,
      блоки: Object.keys(this.config.blocks).filter(k => 
        this.config.blocks[k]?.digits?.length > 0
      )
    });
  }

  /**
   * Сгенерировать пакет примеров
   * @returns {Array} Массив примеров
   */
  generate() {
    console.log(`🎲 Генерация ${this.config.examplesCount} примеров...`);
    
    // Валидация настроек
    try {
      this.validate();
    } catch (error) {
      console.error("❌ Ошибка валидации:", error.message);
      throw error;
    }

    const examples = [];
    const errors = [];
    
    for (let i = 0; i < this.config.examplesCount; i++) {
      try {
        const example = this._generateSingleExample(i + 1);
        
        if (example) {
          examples.push(example);
          
          if (this.config.verbose && (i + 1) % 10 === 0) {
            console.log(`✅ Сгенерировано ${i + 1}/${this.config.examplesCount} примеров`);
          }
        } else {
          errors.push({ id: i + 1, error: "Не удалось сгенерировать пример" });
        }
      } catch (error) {
        console.error(`❌ Ошибка генерации примера ${i + 1}:`, error.message);
        errors.push({ id: i + 1, error: error.message });
      }
    }

    console.log(`✅ Генерация завершена: ${examples.length} примеров, ${errors.length} ошибок`);
    
    if (errors.length > 0 && this.config.verbose) {
      console.warn("⚠️ Ошибки генерации:", errors);
    }

    return examples;
  }

  /**
   * Сгенерировать один пример
   * @param {number} id - ID примера
   * @returns {Object|null} Пример или null при ошибке
   */
  _generateSingleExample(id) {
    let attempts = 0;
    const maxAttempts = this.config.maxAttemptsPerExample;

    while (attempts < maxAttempts) {
      try {
        // Формируем настройки для генератора
        const settings = {
          digits: this.config.digitCount,
          combineLevels: this.config.combineLevels,
          actions: {
            count: this.config.actionsCount
          },
          blocks: this.config.blocks
        };

        // Вызываем генератор из core/generator.js
        const rawExample = generateExample(settings);

        // Проверка что пример валиден
        if (!rawExample || !rawExample.steps || rawExample.steps.length === 0) {
          attempts++;
          continue;
        }

        // Формируем результат
        return {
          id: id,
          steps: rawExample.steps,
          answer: rawExample.answer,
          start: rawExample.start || 0
        };

      } catch (error) {
        attempts++;

        if (attempts >= maxAttempts) {
          console.error(`❌ Превышен лимит попыток для примера ${id}:`, error.message);

          // Возвращаем простой fallback пример вместо null
          return this._generateFallbackExample(id);
        }
      }
    }

    // Возвращаем fallback пример
    return this._generateFallbackExample(id);
  }

  /**
   * Генерация простого fallback примера
   * Используется когда не удалось сгенерировать пример по правилам
   * @param {number} id - ID примера
   * @returns {Object} Простой пример
   */
  _generateFallbackExample(id) {
    console.warn(`⚠️ Используем fallback пример для ${id}`);

    // Генерируем простой пример с базовыми операциями
    const steps = [];
    const actionsCount = Math.min(3, this.config.actionsCount);

    for (let i = 0; i < actionsCount; i++) {
      const action = i === 0 ? '+1' : (i % 2 === 0 ? '+2' : '-1');
      steps.push(action);
    }

    // Вычисляем ответ
    let answer = 0;
    for (const step of steps) {
      answer += parseInt(step, 10);
    }

    return {
      id: id,
      steps: steps,
      answer: answer,
      start: 0
    };
  }

  /**
   * Валидация настроек перед генерацией
   * @throws {Error} Если настройки невалидны
   */
  validate() {
    const { examplesCount, actionsCount, digitCount, blocks } = this.config;

    // Проверка количества примеров
    if (!Number.isInteger(examplesCount) || examplesCount < 1 || examplesCount > 1000) {
      throw new Error("Количество примеров должно быть от 1 до 1000");
    }

    // Проверка количества действий
    if (!Number.isInteger(actionsCount) || actionsCount < 1 || actionsCount > 20) {
      throw new Error("Количество действий должно быть от 1 до 20");
    }

    // Проверка разрядности
    if (!Number.isInteger(digitCount) || digitCount < 1 || digitCount > 9) {
      throw new Error("Разрядность должна быть от 1 до 9");
    }

    // Проверка что хотя бы один блок активен
    const hasActiveBlock = this._hasActiveBlock(blocks);
    
    if (!hasActiveBlock) {
      throw new Error("Необходимо выбрать хотя бы один блок и цифры в нем");
    }

    // Проверка специфичных требований блоков
    
    // Друзі требует минимум 2 разряда
    if (blocks.friends?.digits?.length > 0 && digitCount < 2) {
      throw new Error("Блок 'Друзі' требует минимум 2 разряда");
    }

    // Мікс требует минимум 2 разряда
    if (blocks.mix?.digits?.length > 0 && digitCount < 2) {
      throw new Error("Блок 'Мікс' требует минимум 2 разряда");
    }

    console.log("✅ Валидация настроек пройдена");
    return true;
  }

  /**
   * Проверка наличия активного блока
   * @param {Object} blocks - Объект с блоками
   * @returns {boolean} Есть ли активный блок
   */
  _hasActiveBlock(blocks) {
    if (!blocks || typeof blocks !== 'object') {
      return false;
    }

    const blockNames = ['simple', 'brothers', 'friends', 'mix'];
    
    for (const name of blockNames) {
      const block = blocks[name];
      
      if (block && Array.isArray(block.digits) && block.digits.length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Получить статистику по сгенерированным примерам
   * @param {Array} examples - Массив примеров
   * @returns {Object} Статистика
   */
  getStatistics(examples) {
    if (!examples || examples.length === 0) {
      return {
        total: 0,
        avgSteps: 0,
        minAnswer: 0,
        maxAnswer: 0
      };
    }

    const answers = examples.map(ex => ex.answer);
    const stepCounts = examples.map(ex => ex.steps.length);

    return {
      total: examples.length,
      avgSteps: (stepCounts.reduce((a, b) => a + b, 0) / examples.length).toFixed(1),
      minAnswer: Math.min(...answers),
      maxAnswer: Math.max(...answers),
      avgAnswer: (answers.reduce((a, b) => a + b, 0) / examples.length).toFixed(1)
    };
  }

  /**
   * Получить информацию о конфигурации
   * @returns {Object} Информация
   */
  getInfo() {
    const activeBlocks = [];
    
    if (this.config.blocks.simple?.digits?.length > 0) {
      activeBlocks.push(`Просто (${this.config.blocks.simple.digits.join(',')})`);
    }
    if (this.config.blocks.brothers?.digits?.length > 0) {
      activeBlocks.push(`Братья (${this.config.blocks.brothers.digits.join(',')})`);
    }
    if (this.config.blocks.friends?.digits?.length > 0) {
      activeBlocks.push(`Друзі (${this.config.blocks.friends.digits.join(',')})`);
    }
    if (this.config.blocks.mix?.digits?.length > 0) {
      activeBlocks.push(`Мікс (${this.config.blocks.mix.digits.join(',')})`);
    }

    return {
      examplesCount: this.config.examplesCount,
      actionsCount: this.config.actionsCount,
      digitCount: this.config.digitCount,
      activeBlocks: activeBlocks,
      combineLevels: this.config.combineLevels
    };
  }
}
