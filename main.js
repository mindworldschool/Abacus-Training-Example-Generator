// main.js
// Главная точка входа приложения - Генератор печатных заданий

import { renderPrintScreen } from "./ui/PrintScreen.js";

/**
 * Главная функция запуска приложения
 */
function init() {
  console.log("🚀 Запуск генератора печатных заданий...");
  
  // Получаем контейнер приложения
  const appContainer = document.getElementById('app');
  
  if (!appContainer) {
    console.error("❌ Контейнер #app не найден!");
    return;
  }

  try {
    // Очищаем контейнер
    appContainer.innerHTML = '';
    
    // Рендерим главный экран генератора
    renderPrintScreen(appContainer);
    
    console.log("✅ Приложение запущено успешно");
  } catch (error) {
    console.error("❌ Ошибка при запуске приложения:", error);
    
    // Показываем сообщение об ошибке пользователю
    appContainer.innerHTML = `
      <div class="error-screen">
        <h1>❌ Помилка</h1>
        <p>Не вдалося запустити додаток.</p>
        <p class="error-details">${error.message}</p>
        <button onclick="window.location.reload()">Перезавантажити</button>
      </div>
    `;
  }
}

/**
 * Обработчик загрузки DOM
 */
if (document.readyState === 'loading') {
  // DOM еще загружается
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM уже загружен
  init();
}

/**
 * Обработчик ошибок
 */
window.addEventListener('error', (event) => {
  console.error("❌ Глобальная ошибка:", event.error);
});

/**
 * Обработчик необработанных промисов
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error("❌ Необработанный промис:", event.reason);
});

/**
 * Экспорт для отладки (доступен в консоли как window.app)
 */
window.app = {
  version: '1.0.0',
  name: 'Abacus Print Generator',
  restart: () => {
    window.location.reload();
  }
};

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   📄 ГЕНЕРАТОР ЗАВДАНЬ ДЛЯ АБАКУСА                       ║
║   Версія: ${window.app.version}                                      ║
║                                                           ║
║   Створіть набір прикладів для тренування                ║
║   ментальної арифметики                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
