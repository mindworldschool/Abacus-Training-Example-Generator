// i18n/translations.js
// Переводы для генератора печатных заданий

/**
 * Словарь переводов для всех интерфейсов генератора
 * 
 * ЯЗЫКИ:
 * - uk (украинский) - основной
 * - ru (русский)
 * - en (английский)
 * - es (испанский)
 */
export const translations = {
  // ============================================
  // УКРАИНСКИЙ (основной)
  // ============================================
  uk: {
    // Заголовки
    title: "Генератор завдань для друку",
    subtitle: "Створіть набір прикладів для тренування на абакусі",
    
    // Настройки
    settings: {
      title: "Налаштування",
      examplesCount: "Кількість прикладів",
      actionsCount: "Кількість дій в прикладі",
      digitCount: "Розрядність",
      worksheetTitle: "Назва завдання (необов'язково)",
      worksheetTitlePlaceholder: "Наприклад: Завдання для тренування",
      worksheetComment: "Коментар (необов'язково)",
      worksheetCommentPlaceholder: "Наприклад: Домашнє завдання на тиждень"
    },
    
    // Блоки
    blocks: {
      title: "Виберіть блоки та цифри",
      simple: "ПРОСТО (1-9)",
      brothers: "БРАТИ (формули 5)",
      friends: "ДРУЗІ (формули 10)",
      mix: "БРАТИ І ДРУЗІ (мікс)",
      selectAll: "Вибрати все"
    },
    
    // Опции блоков
    blockOptions: {
      onlyAddition: "Тільки додавання",
      onlySubtraction: "Тільки віднімання"
    },
    
    // Предупреждения
    warnings: {
      friendsRequires2Digits: "Для 'Друзі' потрібно мінімум 2 розряди",
      mixRequires2Digits: "Для 'Мікс' потрібно мінімум 2 розряди"
    },
    
    // Кнопки
    buttons: {
      generate: "Згенерувати приклади",
      generating: "Генерація...",
      print: "Друкувати",
      newExamples: "Нові приклади",
      save: "Зберегти",
      cancel: "Скасувати"
    },
    
    // Результат
    result: {
      title: "Результат",
      showAnswers: "Показати відповіді",
      statistics: "Статистика"
    },
    
    // Статистика
    statistics: {
      title: "Статистика",
      totalExamples: "Всього прикладів",
      avgSteps: "Середня кількість дій",
      stepsRange: "Діапазон дій",
      answersRange: "Діапазон відповідей",
      additions: "Додавань",
      subtractions: "Віднімань",
      additionPercentage: "Відсоток додавань"
    },
    
    // Сообщения об ошибках
    errors: {
      noBlocksSelected: "Виберіть хоча б один блок і цифри в ньому",
      examplesCountInvalid: "Кількість прикладів повинна бути від 1 до 1000",
      actionsCountInvalid: "Кількість дій повинна бути від 1 до 20",
      digitCountInvalid: "Розрядність повинна бути від 1 до 9",
      friendsNeed2Digits: "Блок 'Друзі' вимагає мінімум 2 розряди",
      mixNeed2Digits: "Блок 'Мікс' вимагає мінімум 2 розряди",
      generationFailed: "Не вдалося згенерувати приклади",
      noExamplesGenerated: "Не вдалося згенерувати жодного прикладу"
    },
    
    // Разрядность
    digits: {
      1: "1 розряд",
      2: "2 розряди",
      3: "3 розряди",
      4: "4 розряди",
      5: "5 розрядів",
      6: "6 розрядів",
      7: "7 розрядів",
      8: "8 розрядів",
      9: "9 розрядів"
    },
    
    // Лист с заданиями
    worksheet: {
      defaultTitle: "Завдання для тренування на абакусі",
      answersTitle: "Відповіді"
    }
  },

  // ============================================
  // РУССКИЙ
  // ============================================
  ru: {
    title: "Генератор заданий для печати",
    subtitle: "Создайте набор примеров для тренировки на абакусе",
    
    settings: {
      title: "Настройки",
      examplesCount: "Количество примеров",
      actionsCount: "Количество действий в примере",
      digitCount: "Разрядность",
      worksheetTitle: "Название задания (необязательно)",
      worksheetTitlePlaceholder: "Например: Задания для тренировки",
      worksheetComment: "Комментарий (необязательно)",
      worksheetCommentPlaceholder: "Например: Домашнее задание на неделю"
    },
    
    blocks: {
      title: "Выберите блоки и цифры",
      simple: "ПРОСТО (1-9)",
      brothers: "БРАТЬЯ (формулы 5)",
      friends: "ДРУЗЬЯ (формулы 10)",
      mix: "БРАТЬЯ И ДРУЗЬЯ (микс)",
      selectAll: "Выбрать все"
    },
    
    blockOptions: {
      onlyAddition: "Только сложение",
      onlySubtraction: "Только вычитание"
    },
    
    warnings: {
      friendsRequires2Digits: "Для 'Друзья' нужно минимум 2 разряда",
      mixRequires2Digits: "Для 'Микс' нужно минимум 2 разряда"
    },
    
    buttons: {
      generate: "Сгенерировать примеры",
      generating: "Генерация...",
      print: "Печатать",
      newExamples: "Новые примеры",
      save: "Сохранить",
      cancel: "Отмена"
    },
    
    result: {
      title: "Результат",
      showAnswers: "Показать ответы",
      statistics: "Статистика"
    },
    
    statistics: {
      title: "Статистика",
      totalExamples: "Всего примеров",
      avgSteps: "Среднее количество действий",
      stepsRange: "Диапазон действий",
      answersRange: "Диапазон ответов",
      additions: "Сложений",
      subtractions: "Вычитаний",
      additionPercentage: "Процент сложений"
    },
    
    errors: {
      noBlocksSelected: "Выберите хотя бы один блок и цифры в нём",
      examplesCountInvalid: "Количество примеров должно быть от 1 до 1000",
      actionsCountInvalid: "Количество действий должно быть от 1 до 20",
      digitCountInvalid: "Разрядность должна быть от 1 до 9",
      friendsNeed2Digits: "Блок 'Друзья' требует минимум 2 разряда",
      mixNeed2Digits: "Блок 'Микс' требует минимум 2 разряда",
      generationFailed: "Не удалось сгенерировать примеры",
      noExamplesGenerated: "Не удалось сгенерировать ни одного примера"
    },
    
    digits: {
      1: "1 разряд",
      2: "2 разряда",
      3: "3 разряда",
      4: "4 разряда",
      5: "5 разрядов",
      6: "6 разрядов",
      7: "7 разрядов",
      8: "8 разрядов",
      9: "9 разрядов"
    },
    
    worksheet: {
      defaultTitle: "Задания для тренировки на абакусе",
      answersTitle: "Ответы"
    }
  },

  // ============================================
  // АНГЛИЙСКИЙ
  // ============================================
  en: {
    title: "Worksheet Generator",
    subtitle: "Create a set of abacus training exercises",
    
    settings: {
      title: "Settings",
      examplesCount: "Number of examples",
      actionsCount: "Number of actions per example",
      digitCount: "Digit count",
      worksheetTitle: "Worksheet title (optional)",
      worksheetTitlePlaceholder: "e.g.: Training Exercises",
      worksheetComment: "Comment (optional)",
      worksheetCommentPlaceholder: "e.g.: Homework for the week"
    },
    
    blocks: {
      title: "Select blocks and digits",
      simple: "SIMPLE (1-9)",
      brothers: "BROTHERS (formulas 5)",
      friends: "FRIENDS (formulas 10)",
      mix: "BROTHERS & FRIENDS (mix)",
      selectAll: "Select all"
    },
    
    blockOptions: {
      onlyAddition: "Addition only",
      onlySubtraction: "Subtraction only"
    },
    
    warnings: {
      friendsRequires2Digits: "'Friends' requires at least 2 digits",
      mixRequires2Digits: "'Mix' requires at least 2 digits"
    },
    
    buttons: {
      generate: "Generate examples",
      generating: "Generating...",
      print: "Print",
      newExamples: "New examples",
      save: "Save",
      cancel: "Cancel"
    },
    
    result: {
      title: "Result",
      showAnswers: "Show answers",
      statistics: "Statistics"
    },
    
    statistics: {
      title: "Statistics",
      totalExamples: "Total examples",
      avgSteps: "Average steps",
      stepsRange: "Steps range",
      answersRange: "Answers range",
      additions: "Additions",
      subtractions: "Subtractions",
      additionPercentage: "Addition percentage"
    },
    
    errors: {
      noBlocksSelected: "Select at least one block and digits in it",
      examplesCountInvalid: "Number of examples must be between 1 and 1000",
      actionsCountInvalid: "Number of actions must be between 1 and 20",
      digitCountInvalid: "Digit count must be between 1 and 9",
      friendsNeed2Digits: "'Friends' block requires at least 2 digits",
      mixNeed2Digits: "'Mix' block requires at least 2 digits",
      generationFailed: "Failed to generate examples",
      noExamplesGenerated: "Failed to generate any examples"
    },
    
    digits: {
      1: "1 digit",
      2: "2 digits",
      3: "3 digits",
      4: "4 digits",
      5: "5 digits",
      6: "6 digits",
      7: "7 digits",
      8: "8 digits",
      9: "9 digits"
    },
    
    worksheet: {
      defaultTitle: "Abacus Training Exercises",
      answersTitle: "Answers"
    }
  },

  // ============================================
  // ИСПАНСКИЙ
  // ============================================
  es: {
    title: "Generador de ejercicios",
    subtitle: "Crea un conjunto de ejercicios de entrenamiento con ábaco",
    
    settings: {
      title: "Configuración",
      examplesCount: "Número de ejemplos",
      actionsCount: "Número de acciones por ejemplo",
      digitCount: "Cantidad de dígitos",
      worksheetTitle: "Título de la hoja (opcional)",
      worksheetTitlePlaceholder: "ej.: Ejercicios de entrenamiento",
      worksheetComment: "Comentario (opcional)",
      worksheetCommentPlaceholder: "ej.: Tarea para la semana"
    },
    
    blocks: {
      title: "Selecciona bloques y dígitos",
      simple: "SIMPLE (1-9)",
      brothers: "HERMANOS (fórmulas 5)",
      friends: "AMIGOS (fórmulas 10)",
      mix: "HERMANOS Y AMIGOS (mezcla)",
      selectAll: "Seleccionar todo"
    },
    
    blockOptions: {
      onlyAddition: "Solo suma",
      onlySubtraction: "Solo resta"
    },
    
    warnings: {
      friendsRequires2Digits: "'Amigos' requiere al menos 2 dígitos",
      mixRequires2Digits: "'Mezcla' requiere al menos 2 dígitos"
    },
    
    buttons: {
      generate: "Generar ejemplos",
      generating: "Generando...",
      print: "Imprimir",
      newExamples: "Nuevos ejemplos",
      save: "Guardar",
      cancel: "Cancelar"
    },
    
    result: {
      title: "Resultado",
      showAnswers: "Mostrar respuestas",
      statistics: "Estadísticas"
    },
    
    statistics: {
      title: "Estadísticas",
      totalExamples: "Total de ejemplos",
      avgSteps: "Pasos promedio",
      stepsRange: "Rango de pasos",
      answersRange: "Rango de respuestas",
      additions: "Sumas",
      subtractions: "Restas",
      additionPercentage: "Porcentaje de sumas"
    },
    
    errors: {
      noBlocksSelected: "Selecciona al menos un bloque y dígitos en él",
      examplesCountInvalid: "El número de ejemplos debe estar entre 1 y 1000",
      actionsCountInvalid: "El número de acciones debe estar entre 1 y 20",
      digitCountInvalid: "La cantidad de dígitos debe estar entre 1 y 9",
      friendsNeed2Digits: "El bloque 'Amigos' requiere al menos 2 dígitos",
      mixNeed2Digits: "El bloque 'Mezcla' requiere al menos 2 dígitos",
      generationFailed: "No se pudieron generar ejemplos",
      noExamplesGenerated: "No se pudo generar ningún ejemplo"
    },
    
    digits: {
      1: "1 dígito",
      2: "2 dígitos",
      3: "3 dígitos",
      4: "4 dígitos",
      5: "5 dígitos",
      6: "6 dígitos",
      7: "7 dígitos",
      8: "8 dígitos",
      9: "9 dígitos"
    },
    
    worksheet: {
      defaultTitle: "Ejercicios de entrenamiento con ábaco",
      answersTitle: "Respuestas"
    }
  }
};

/**
 * Получить переводы для указанного языка
 * @param {string} lang - Код языка (uk, ru, en, es)
 * @returns {Object} Объект переводов
 */
export function getTranslations(lang = 'uk') {
  return translations[lang] || translations.uk;
}

/**
 * Получить перевод по ключу
 * @param {string} key - Ключ перевода (например: "settings.title")
 * @param {string} lang - Код языка
 * @returns {string} Перевод
 */
export function t(key, lang = 'uk') {
  const keys = key.split('.');
  let value = translations[lang] || translations.uk;
  
  for (const k of keys) {
    value = value[k];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  return value;
}
