// ui/PrintScreen.js
// Экран генератора печатных заданий для учителей

import { PrintGenerator } from "../print/PrintGenerator.js";
import { PrintFormatter } from "../print/PrintFormatter.js";
import { getTranslations } from "../i18n/translations.js";

/**
 * Главная функция рендеринга экрана генератора
 * @param {HTMLElement} container - Контейнер для рендера
 */
export function renderPrintScreen(container) {
  console.log("🖨️ Рендеринг экрана генератора печатных заданий");

  // Получаем переводы (по умолчанию украинский)
  const t = getTranslations('uk');

  // Очищаем контейнер
  container.innerHTML = '';

  // Создаем главный контейнер
  const screen = document.createElement('div');
  screen.className = 'print-screen';

  // === ЗАГОЛОВОК ===
  const header = createHeader(t);
  screen.appendChild(header);

  // === НАСТРОЙКИ ===
  const settingsSection = createSettingsSection(t);
  screen.appendChild(settingsSection);

  // === СЕКЦИЯ РЕЗУЛЬТАТА (изначально скрыта) ===
  const resultSection = createResultSection(t);
  resultSection.style.display = 'none';
  screen.appendChild(resultSection);

  container.appendChild(screen);

  console.log("✅ Экран генератора отрисован");
}

/**
 * Создание заголовка
 */
function createHeader(t) {
  const header = document.createElement('div');
  header.className = 'print-header';

  const title = document.createElement('h1');
  title.textContent = t.title;
  header.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'print-subtitle';
  subtitle.textContent = t.subtitle;
  header.appendChild(subtitle);

  return header;
}

/**
 * Создание секции настроек
 */
function createSettingsSection(t) {
  const section = document.createElement('div');
  section.className = 'print-settings';

  // Заголовок
  const h2 = document.createElement('h2');
  h2.textContent = t.settings.title;
  section.appendChild(h2);

  // Сетка настроек
  const grid = document.createElement('div');
  grid.className = 'settings-grid';

  // Количество примеров
  grid.appendChild(createNumberInput(
    'examplesCount',
    t.settings.examplesCount,
    20,
    1,
    1000  // Максимум 1000 примеров
  ));

  // Количество действий
  grid.appendChild(createNumberInput(
    'actionsCount',
    t.settings.actionsCount,
    5,
    1,
    20
  ));

  // Разрядность
  grid.appendChild(createSelect(
    'digitCount',
    t.settings.digitCount,
    [
      { value: 1, label: t.digits[1] },
      { value: 2, label: t.digits[2] },
      { value: 3, label: t.digits[3] },
      { value: 4, label: t.digits[4] }
    ],
    1
  ));

  section.appendChild(grid);

  // Дополнительные поля (заголовок и комментарий)
  const titleInput = createTextInput(
    'worksheetTitle',
    t.settings.worksheetTitle,
    t.settings.worksheetTitlePlaceholder
  );
  titleInput.classList.add('setting-item--full');
  section.appendChild(titleInput);

  const commentInput = createTextInput(
    'worksheetComment',
    t.settings.worksheetComment,
    t.settings.worksheetCommentPlaceholder
  );
  commentInput.classList.add('setting-item--full');
  section.appendChild(commentInput);

  // === БЛОКИ ===
  const blocksSection = createBlocksSection(t);
  section.appendChild(blocksSection);

  // === КНОПКА ГЕНЕРАЦИИ ===
  const generateSection = document.createElement('div');
  generateSection.className = 'generate-section';

  const generateBtn = document.createElement('button');
  generateBtn.className = 'btn-primary btn-large';
  generateBtn.id = 'generateBtn';
  generateBtn.textContent = t.buttons.generate;
  generateBtn.onclick = () => handleGenerate(t);
  generateSection.appendChild(generateBtn);

  section.appendChild(generateSection);

  return section;
}

/**
 * Создание секции блоков (Просто, Братья, Друзі, Мікс)
 */
function createBlocksSection(t) {
  const section = document.createElement('div');
  section.className = 'blocks-section';

  const h3 = document.createElement('h3');
  h3.textContent = t.blocks.title;
  section.appendChild(h3);

  // Блок "Просто"
  section.appendChild(createBlock(
    'simple',
    t.blocks.simple,
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 5],
    t,
    false
  ));

  // Блок "Братья"
  section.appendChild(createBlock(
    'brothers',
    t.blocks.brothers,
    [1, 2, 3, 4],
    [4],
    t,
    false
  ));

  // Блок "Друзі"
  section.appendChild(createBlock(
    'friends',
    t.blocks.friends,
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [9],
    t,
    true
  ));

  // Блок "Мікс"
  section.appendChild(createBlock(
    'mix',
    t.blocks.mix,
    [6, 7, 8, 9],
    [6, 7, 8, 9],
    t,
    true
  ));

  return section;
}

/**
 * Создание одного блока выбора
 */
function createBlock(blockId, title, availableDigits, defaultDigits, t, requiresMultipleDigits) {
  const block = document.createElement('div');
  block.className = 'block';
  block.dataset.blockId = blockId;

  // Заголовок блока
  const header = document.createElement('div');
  header.className = 'block-header';

  const h4 = document.createElement('h4');
  h4.textContent = title;
  header.appendChild(h4);

  const selectAllBtn = document.createElement('button');
  selectAllBtn.className = 'btn-select-all';
  selectAllBtn.textContent = t.blocks.selectAll;
  selectAllBtn.onclick = () => toggleAllDigits(blockId, availableDigits);
  header.appendChild(selectAllBtn);

  block.appendChild(header);

  // Сетка цифр
  const digitsGrid = document.createElement('div');
  digitsGrid.className = 'digits-grid';
  digitsGrid.dataset.blockId = blockId;

  for (const digit of availableDigits) {
    const btn = document.createElement('button');
    btn.className = 'digit-btn';
    btn.textContent = digit;
    btn.dataset.digit = digit;
    btn.dataset.blockId = blockId;

    // По умолчанию активны defaultDigits
    if (defaultDigits.includes(digit)) {
      btn.classList.add('active');
    }

    btn.onclick = () => toggleDigit(btn, blockId);
    digitsGrid.appendChild(btn);
  }

  block.appendChild(digitsGrid);

  // Опции блока (только сложение / только вычитание)
  const options = document.createElement('div');
  options.className = 'block-options';

  const onlyAddLabel = document.createElement('label');
  const onlyAddCheck = document.createElement('input');
  onlyAddCheck.type = 'checkbox';
  onlyAddCheck.dataset.blockId = blockId;
  onlyAddCheck.dataset.option = 'onlyAddition';
  onlyAddLabel.appendChild(onlyAddCheck);
  onlyAddLabel.appendChild(document.createTextNode(' ' + t.blockOptions.onlyAddition));
  options.appendChild(onlyAddLabel);

  const onlySubLabel = document.createElement('label');
  const onlySubCheck = document.createElement('input');
  onlySubCheck.type = 'checkbox';
  onlySubCheck.dataset.blockId = blockId;
  onlySubCheck.dataset.option = 'onlySubtraction';
  onlySubLabel.appendChild(onlySubCheck);
  onlySubLabel.appendChild(document.createTextNode(' ' + t.blockOptions.onlySubtraction));
  options.appendChild(onlySubLabel);

  block.appendChild(options);

  // Предупреждение для блоков, требующих 2+ разрядов
  if (requiresMultipleDigits) {
    const note = document.createElement('div');
    note.className = 'block-note';
    const small = document.createElement('small');
    small.textContent = blockId === 'friends'
      ? t.warnings.friendsRequires2Digits
      : t.warnings.mixRequires2Digits;
    note.appendChild(small);
    block.appendChild(note);
  }

  return block;
}

/**
 * Переключение цифры
 */
function toggleDigit(btn, blockId) {
  btn.classList.toggle('active');

  // Подсвечиваем блок если хотя бы одна цифра выбрана
  const block = document.querySelector(`.block[data-block-id="${blockId}"]`);
  const activeDigits = block.querySelectorAll('.digit-btn.active');

  if (activeDigits.length > 0) {
    block.classList.add('block--active');
  } else {
    block.classList.remove('block--active');
  }
}

/**
 * Выбрать/снять все цифры в блоке
 */
function toggleAllDigits(blockId, availableDigits) {
  const grid = document.querySelector(`.digits-grid[data-block-id="${blockId}"]`);
  const buttons = grid.querySelectorAll('.digit-btn');

  // Проверяем: все ли уже выбраны?
  const activeCount = grid.querySelectorAll('.digit-btn.active').length;
  const shouldActivate = activeCount < buttons.length;

  buttons.forEach(btn => {
    if (shouldActivate) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Обновляем стиль блока
  const block = document.querySelector(`.block[data-block-id="${blockId}"]`);
  if (shouldActivate) {
    block.classList.add('block--active');
  } else {
    block.classList.remove('block--active');
  }
}

/**
 * Создание поля ввода числа
 */
function createNumberInput(id, label, defaultValue, min, max) {
  const item = document.createElement('div');
  item.className = 'setting-item';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.setAttribute('for', id);
  item.appendChild(labelEl);

  const input = document.createElement('input');
  input.type = 'number';
  input.id = id;
  input.className = 'setting-input';
  input.value = defaultValue;
  input.min = min;
  input.max = max;
  item.appendChild(input);

  return item;
}

/**
 * Создание выпадающего списка
 */
function createSelect(id, label, options, defaultValue) {
  const item = document.createElement('div');
  item.className = 'setting-item';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.setAttribute('for', id);
  item.appendChild(labelEl);

  const select = document.createElement('select');
  select.id = id;
  select.className = 'setting-select';

  for (const opt of options) {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = opt.label;
    if (opt.value === defaultValue) {
      option.selected = true;
    }
    select.appendChild(option);
  }

  item.appendChild(select);
  return item;
}

/**
 * Создание текстового поля
 */
function createTextInput(id, label, placeholder) {
  const item = document.createElement('div');
  item.className = 'setting-item';

  const labelEl = document.createElement('label');
  labelEl.textContent = label;
  labelEl.setAttribute('for', id);
  item.appendChild(labelEl);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.className = 'setting-input';
  input.placeholder = placeholder;
  item.appendChild(input);

  return item;
}

/**
 * Создание секции результата
 */
function createResultSection(t) {
  const section = document.createElement('div');
  section.className = 'print-result';
  section.id = 'resultSection';

  const h2 = document.createElement('h2');
  h2.textContent = t.result.title;
  section.appendChild(h2);

  // Контейнер для статистики
  const statsContainer = document.createElement('div');
  statsContainer.id = 'statistics-container';
  section.appendChild(statsContainer);

  // Контейнер для превью листа
  const previewContainer = document.createElement('div');
  previewContainer.id = 'worksheet-preview';
  section.appendChild(previewContainer);

  // Контролы
  const controls = document.createElement('div');
  controls.className = 'print-controls';

  // Левая часть (чекбокс показа ответов)
  const controlsLeft = document.createElement('div');
  controlsLeft.className = 'controls-left';

  const showAnswersLabel = document.createElement('label');
  showAnswersLabel.className = 'checkbox-label';
  const showAnswersCheck = document.createElement('input');
  showAnswersCheck.type = 'checkbox';
  showAnswersCheck.id = 'showAnswersCheck';
  showAnswersCheck.onchange = (e) => toggleAnswers(e.target.checked);
  showAnswersLabel.appendChild(showAnswersCheck);
  showAnswersLabel.appendChild(document.createTextNode(' ' + t.result.showAnswers));
  controlsLeft.appendChild(showAnswersLabel);

  controls.appendChild(controlsLeft);

  // Правая часть (кнопки)
  const controlsRight = document.createElement('div');
  controlsRight.className = 'controls-right';

  const printBtn = document.createElement('button');
  printBtn.className = 'btn-primary';
  printBtn.textContent = t.buttons.print;
  printBtn.onclick = () => window.print();
  controlsRight.appendChild(printBtn);

  const newBtn = document.createElement('button');
  newBtn.className = 'btn-secondary';
  newBtn.textContent = t.buttons.newExamples;
  newBtn.onclick = () => handleGenerate(t);
  controlsRight.appendChild(newBtn);

  controls.appendChild(controlsRight);
  section.appendChild(controls);

  return section;
}

/**
 * Обработка генерации примеров
 */
function handleGenerate(t) {
  console.log("🎲 Начало генерации примеров");

  try {
    // === 1. СБОР НАСТРОЕК ===
    const settings = collectSettings();
    console.log("📊 Собранные настройки:", settings);

    // === 2. ВАЛИДАЦИЯ ===
    const validation = validateSettings(settings, t);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // === 3. ПОКАЗЫВАЕМ ИНДИКАТОР ЗАГРУЗКИ ===
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.textContent;

    // Предупреждение для больших объемов
    if (settings.examplesCount > 100) {
      const confirmed = confirm(
        `Ви збираєтесь згенерувати ${settings.examplesCount} прикладів.\n\n` +
        `Це може зайняти 10-30 секунд.\n` +
        `Також PDF файл буде містити ${Math.ceil(settings.examplesCount / 100)} сторінок.\n\n` +
        `Продовжити?`
      );
      if (!confirmed) {
        return;
      }
    }

    generateBtn.textContent = t.buttons.generating;
    generateBtn.disabled = true;

    // === 4. ГЕНЕРАЦИЯ (с небольшой задержкой для UI) ===
    setTimeout(() => {
      try {
        const generator = new PrintGenerator({
          examplesCount: settings.examplesCount,
          actionsCount: settings.actionsCount,
          digitCount: settings.digitCount,
          blocks: settings.blocks,
          combineLevels: settings.combineLevels,
          verbose: true,
          // Callback для отображения прогресса (для больших объемов)
          onProgress: (progress) => {
            if (settings.examplesCount > 100) {
              generateBtn.textContent = `${t.buttons.generating} ${progress.percent}% (${progress.current}/${progress.total})`;
            }
          }
        });

        const examples = generator.generate();
        console.log(`✅ Сгенерировано ${examples.length} примеров`);

        if (examples.length === 0) {
          alert(t.errors.noExamplesGenerated);
          return;
        }

        // === 5. ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ ===
        displayResults(examples, settings, t);

        // Прокручиваем к результатам
        document.getElementById('resultSection').scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

      } catch (error) {
        console.error("❌ Ошибка генерации:", error);
        alert(t.errors.generationFailed + '\n' + error.message);
      } finally {
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
      }
    }, 100);

  } catch (error) {
    console.error("❌ Критическая ошибка:", error);
    alert(t.errors.generationFailed + '\n' + error.message);
  }
}

/**
 * Сбор настроек из UI
 */
function collectSettings() {
  const examplesCount = parseInt(document.getElementById('examplesCount').value, 10);
  const actionsCount = parseInt(document.getElementById('actionsCount').value, 10);
  const digitCount = parseInt(document.getElementById('digitCount').value, 10);
  const worksheetTitle = document.getElementById('worksheetTitle').value.trim();
  const worksheetComment = document.getElementById('worksheetComment').value.trim();

  // Собираем блоки
  const blocks = {};

  ['simple', 'brothers', 'friends', 'mix'].forEach(blockId => {
    const block = document.querySelector(`.block[data-block-id="${blockId}"]`);
    const activeButtons = block.querySelectorAll('.digit-btn.active');
    const digits = Array.from(activeButtons).map(btn => parseInt(btn.dataset.digit, 10));

    const onlyAddition = block.querySelector(`input[data-option="onlyAddition"]`).checked;
    const onlySubtraction = block.querySelector(`input[data-option="onlySubtraction"]`).checked;

    blocks[blockId] = {
      digits: digits,
      onlyAddition: onlyAddition,
      onlySubtraction: onlySubtraction
    };
  });

  return {
    examplesCount,
    actionsCount,
    digitCount,
    worksheetTitle,
    worksheetComment,
    blocks,
    combineLevels: false // Пока отключено
  };
}

/**
 * Валидация настроек
 */
function validateSettings(settings, t) {
  // Проверка количества примеров
  if (settings.examplesCount < 1 || settings.examplesCount > 1000) {
    return { valid: false, error: t.errors.examplesCountInvalid };
  }

  // Проверка количества действий
  if (settings.actionsCount < 1 || settings.actionsCount > 20) {
    return { valid: false, error: t.errors.actionsCountInvalid };
  }

  // Проверка разрядности
  if (settings.digitCount < 1 || settings.digitCount > 9) {
    return { valid: false, error: t.errors.digitCountInvalid };
  }

  // Проверка что хотя бы один блок активен
  const hasActiveBlock = Object.values(settings.blocks).some(block => block.digits.length > 0);
  if (!hasActiveBlock) {
    return { valid: false, error: t.errors.noBlocksSelected };
  }

  // Проверка для блоков "Друзі" и "Мікс" (требуют минимум 2 разряда)
  if (settings.blocks.friends.digits.length > 0 && settings.digitCount < 2) {
    return { valid: false, error: t.errors.friendsNeed2Digits };
  }

  if (settings.blocks.mix.digits.length > 0 && settings.digitCount < 2) {
    return { valid: false, error: t.errors.mixNeed2Digits };
  }

  return { valid: true };
}

/**
 * Отображение результатов
 */
function displayResults(examples, settings, t) {
  // Показываем секцию результата
  const resultSection = document.getElementById('resultSection');
  resultSection.style.display = 'block';

  // === СТАТИСТИКА ===
  const statsContainer = document.getElementById('statistics-container');
  const statsHtml = PrintFormatter.formatStatisticsBlock(examples);
  statsContainer.innerHTML = statsHtml;

  // === ПРЕВЬЮ ЛИСТА ===
  const previewContainer = document.getElementById('worksheet-preview');
  const title = settings.worksheetTitle || t.worksheet.defaultTitle;
  const comment = settings.worksheetComment || '';

  const showAnswers = document.getElementById('showAnswersCheck').checked;

  const worksheetHtml = PrintFormatter.formatToTable(examples, {
    showAnswers: showAnswers,
    title: title,
    comment: comment,
    columns: 10,
    rows: Math.ceil(examples.length / 10)
  });

  previewContainer.innerHTML = worksheetHtml;

  // Сохраняем примеры для переключения ответов
  window.currentExamples = examples;
  window.currentSettings = settings;
  window.currentTranslations = t;
}

/**
 * Переключение отображения ответов
 */
function toggleAnswers(showAnswers) {
  if (!window.currentExamples) return;

  const previewContainer = document.getElementById('worksheet-preview');
  const title = window.currentSettings.worksheetTitle || window.currentTranslations.worksheet.defaultTitle;
  const comment = window.currentSettings.worksheetComment || '';

  const worksheetHtml = PrintFormatter.formatToTable(window.currentExamples, {
    showAnswers: showAnswers,
    title: title,
    comment: comment,
    columns: 10,
    rows: Math.ceil(window.currentExamples.length / 10)
  });

  previewContainer.innerHTML = worksheetHtml;
}
