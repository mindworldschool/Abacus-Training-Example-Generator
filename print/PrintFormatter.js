// print/PrintFormatter.js
// Форматирование примеров в HTML таблицу для печати

/**
 * PrintFormatter - класс для форматирования примеров в HTML
 * 
 * ФУНКЦИОНАЛ:
 * - Создание HTML таблицы с примерами
 * - Нумерация примеров
 * - Секция ответов (опционально)
 * - Адаптивная компоновка (столбцы, строки)
 * - Поддержка разных макетов
 * 
 * ИСПОЛЬЗОВАНИЕ:
 * const html = PrintFormatter.formatToTable(examples, {
 *   showAnswers: false,
 *   columns: 10,
 *   rows: 2
 * });
 */
export class PrintFormatter {
  /**
   * Создать HTML таблицу с примерами
   * 
   * @param {Array} examples - Массив примеров
   * @param {Object} options - Опции форматирования
   * @param {boolean} options.showAnswers - Показывать ли ответы
   * @param {number} options.columns - Количество колонок
   * @param {number} options.rows - Количество строк
   * @param {string} options.title - Заголовок листа
   * @param {string} options.comment - Комментарий к заданиям
   * @returns {string} HTML код
   */
  static formatToTable(examples, options = {}) {
    const {
      showAnswers = false,
      columns = 10,
      rows = Math.ceil(examples.length / 10),
      title = "Завдання для тренування на абакусі",
      comment = ""
    } = options;

    console.log(`📄 Форматирование ${examples.length} примеров в таблицу ${rows}x${columns}`);

    let html = '<div class="worksheet">';
    
    // Заголовок
    if (title || comment) {
      html += '<div class="worksheet-header">';
      if (title) {
        html += `<h1 class="worksheet-title">${this._escapeHtml(title)}</h1>`;
      }
      if (comment) {
        html += `<p class="worksheet-comment">${this._escapeHtml(comment)}</p>`;
      }
      html += '</div>';
    }

    // Таблица с примерами
    html += '<table class="examples-table">';
    
    for (let row = 0; row < rows; row++) {
      html += '<tr>';
      
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        
        if (index >= examples.length) {
          // Пустая ячейка
          html += '<td class="example-cell example-cell--empty"></td>';
        } else {
          const example = examples[index];
          html += this._formatExampleCell(example, showAnswers);
        }
      }
      
      html += '</tr>';
    }
    
    html += '</table>';
    html += '</div>';

    return html;
  }

  /**
   * Форматирование одной ячейки с примером
   * 
   * @param {Object} example - Пример
   * @param {boolean} showAnswers - Показывать ли ответ
   * @returns {string} HTML ячейки
   */
  static _formatExampleCell(example, showAnswers) {
    let html = '<td class="example-cell">';
    
    // Номер примера
    html += `<div class="example-number">${example.id}</div>`;
    
    // Действия (шаги)
    html += '<div class="example-steps">';
    for (const step of example.steps) {
      html += `<div class="example-step">${this._escapeHtml(step)}</div>`;
    }
    html += '</div>';
    
    // Линия для ответа
    html += '<div class="answer-line"></div>';
    
    // Ответ (если нужно показать)
    if (showAnswers) {
      html += `<div class="answer-value">${example.answer}</div>`;
    } else {
      // Скрытый ответ для печати с ответами позже
      html += `<div class="answer-value answer-value--hidden" data-answer="${example.answer}"></div>`;
    }
    
    html += '</td>';
    
    return html;
  }

  /**
   * Создать HTML с только ответами (отдельный лист)
   * 
   * @param {Array} examples - Массив примеров
   * @param {Object} options - Опции
   * @returns {string} HTML код
   */
  static formatAnswersSheet(examples, options = {}) {
    const {
      columns = 10,
      rows = Math.ceil(examples.length / 10),
      title = "Відповіді"
    } = options;

    let html = '<div class="worksheet worksheet--answers">';
    
    // Заголовок
    html += '<div class="worksheet-header">';
    html += `<h1 class="worksheet-title">${this._escapeHtml(title)}</h1>`;
    html += '</div>';

    // Таблица ответов (компактная)
    html += '<table class="answers-table">';
    
    for (let row = 0; row < rows; row++) {
      html += '<tr>';
      
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        
        if (index >= examples.length) {
          html += '<td class="answer-cell answer-cell--empty"></td>';
        } else {
          const example = examples[index];
          html += `<td class="answer-cell">`;
          html += `<span class="answer-cell-number">${example.id}:</span> `;
          html += `<span class="answer-cell-value">${example.answer}</span>`;
          html += `</td>`;
        }
      }
      
      html += '</tr>';
    }
    
    html += '</table>';
    html += '</div>';

    return html;
  }

  /**
   * Создать полный HTML документ (с заданиями и ответами)
   * 
   * @param {Array} examples - Массив примеров
   * @param {Object} options - Опции
   * @returns {string} Полный HTML документ
   */
  static formatFullDocument(examples, options = {}) {
    const {
      showAnswers = false,
      includeAnswersSheet = true,
      title = "Завдання для тренування на абакусі",
      comment = ""
    } = options;

    let html = '<!DOCTYPE html>\n';
    html += '<html lang="uk">\n';
    html += '<head>\n';
    html += '  <meta charset="UTF-8">\n';
    html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
    html += `  <title>${this._escapeHtml(title)}</title>\n`;
    html += '  <link rel="stylesheet" href="print/print-styles.css">\n';
    html += '</head>\n';
    html += '<body>\n';

    // Лист с заданиями
    html += this.formatToTable(examples, {
      showAnswers,
      title,
      comment,
      ...options
    });

    // Разрыв страницы
    if (includeAnswersSheet) {
      html += '<div class="page-break"></div>\n';
      
      // Лист с ответами
      html += this.formatAnswersSheet(examples, {
        title: "Відповіді",
        ...options
      });
    }

    html += '</body>\n';
    html += '</html>';

    return html;
  }

  /**
   * Форматирование для встраивания (без DOCTYPE)
   * Используется для превью в браузере
   * 
   * @param {Array} examples - Массив примеров
   * @param {Object} options - Опции
   * @returns {string} HTML для встраивания
   */
  static formatForPreview(examples, options = {}) {
    const worksheetHtml = this.formatToTable(examples, options);
    
    // Добавляем контейнер превью
    let html = '<div class="print-preview-container">';
    html += worksheetHtml;
    html += '</div>';
    
    return html;
  }

  /**
   * Создать компактный список примеров (текстовый формат)
   * Полезно для копирования или экспорта
   * 
   * @param {Array} examples - Массив примеров
   * @param {Object} options - Опции
   * @returns {string} Текстовый список
   */
  static formatToText(examples, options = {}) {
    const { showAnswers = false } = options;
    
    let text = '';
    
    for (const example of examples) {
      text += `${example.id}. `;
      text += example.steps.join(' ');
      text += ' = ';
      text += showAnswers ? example.answer : '?';
      text += '\n';
    }
    
    return text;
  }

  /**
   * Экспорт в CSV формат
   * 
   * @param {Array} examples - Массив примеров
   * @returns {string} CSV данные
   */
  static formatToCSV(examples) {
    let csv = 'ID,Приклад,Відповідь\n';
    
    for (const example of examples) {
      const exampleStr = example.steps.join(' ');
      csv += `${example.id},"${exampleStr}",${example.answer}\n`;
    }
    
    return csv;
  }

  /**
   * Подсчет статистики по примерам
   * 
   * @param {Array} examples - Массив примеров
   * @returns {Object} Статистика
   */
  static getStatistics(examples) {
    if (!examples || examples.length === 0) {
      return null;
    }

    const stepCounts = examples.map(ex => ex.steps.length);
    const answers = examples.map(ex => ex.answer);

    // Подсчет операций
    let additionCount = 0;
    let subtractionCount = 0;

    for (const example of examples) {
      for (const step of example.steps) {
        if (step.startsWith('+')) {
          additionCount++;
        } else if (step.startsWith('-')) {
          subtractionCount++;
        }
      }
    }

    return {
      totalExamples: examples.length,
      avgStepsPerExample: (stepCounts.reduce((a, b) => a + b, 0) / examples.length).toFixed(1),
      minSteps: Math.min(...stepCounts),
      maxSteps: Math.max(...stepCounts),
      minAnswer: Math.min(...answers),
      maxAnswer: Math.max(...answers),
      avgAnswer: (answers.reduce((a, b) => a + b, 0) / examples.length).toFixed(1),
      totalAdditions: additionCount,
      totalSubtractions: subtractionCount,
      additionPercentage: ((additionCount / (additionCount + subtractionCount)) * 100).toFixed(1)
    };
  }

  /**
   * Создать информационный блок со статистикой
   * 
   * @param {Array} examples - Массив примеров
   * @returns {string} HTML блока
   */
  static formatStatisticsBlock(examples) {
    const stats = this.getStatistics(examples);
    
    if (!stats) {
      return '';
    }

    let html = '<div class="statistics-block no-print">';
    html += '<h3>📊 Статистика</h3>';
    html += '<ul class="statistics-list">';
    html += `<li>Всього прикладів: <strong>${stats.totalExamples}</strong></li>`;
    html += `<li>Середня кількість дій: <strong>${stats.avgStepsPerExample}</strong></li>`;
    html += `<li>Діапазон дій: <strong>${stats.minSteps}-${stats.maxSteps}</strong></li>`;
    html += `<li>Діапазон відповідей: <strong>${stats.minAnswer}-${stats.maxAnswer}</strong></li>`;
    html += `<li>Додавань: <strong>${stats.totalAdditions}</strong> (${stats.additionPercentage}%)</li>`;
    html += `<li>Віднімань: <strong>${stats.totalSubtractions}</strong></li>`;
    html += '</ul>';
    html += '</div>';
    
    return html;
  }

  /**
   * Экранирование HTML
   * 
   * @param {string} str - Строка для экранирования
   * @returns {string} Экранированная строка
   */
  static _escapeHtml(str) {
    if (!str) return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Вычисление оптимального количества строк и колонок
   * 
   * @param {number} examplesCount - Количество примеров
   * @param {Object} preferences - Предпочтения
   * @returns {Object} { rows, columns }
   */
  static calculateLayout(examplesCount, preferences = {}) {
    const {
      preferredColumns = 10,
      maxRows = 10
    } = preferences;

    const rows = Math.min(Math.ceil(examplesCount / preferredColumns), maxRows);
    const columns = preferredColumns;

    return { rows, columns };
  }
}
