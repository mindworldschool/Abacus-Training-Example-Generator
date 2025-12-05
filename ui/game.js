// ui/game.js — Training screen with proper routing + retry support
import { createStepIndicator } from "./helper.js";
import { setResults, state as globalState, resetResults } from "../core/state.js";
import { eventBus, EVENTS } from "../core/utils/events.js";
import { logger } from "../core/utils/logger.js";
import toast from "./components/Toast.js";

const CONTEXT = "GameScreen";

export async function renderGame(container, { t, state, navigate }) {
  // Очищаем контейнер
  container.innerHTML = "";

  // Обёртка экрана
  const section = document.createElement("section");
  section.className = "screen game-screen";

  // Индикация шага мастера (навигация по шагам)
  const indicator = createStepIndicator("game", t);
  section.appendChild(indicator);

  // Тело, куда маунтим тренажёр
  const body = document.createElement("div");
  body.className = "screen__body";
  section.appendChild(body);

  container.appendChild(section);

  // ====== EVENT: TRAINING_FINISH ======
  // Тренажёр шлёт это событие и добавляет phase:
  //  - "done" → нормальное завершение сессии
  //  - "exit" → пользователь нажал "Выйти"
  //
  // Здесь мы решаем КУДА уйти, и что сохранить в стейт.
  const unsubscribe = eventBus.on(EVENTS.TRAINING_FINISH, (stats) => {
    logger.info(CONTEXT, "TRAINING_FINISH event:", stats);

    // Если это нормальный финиш (phase === "done"):
    // Пишем результаты и идём на экран результатов
    if (stats.phase === "done") {
      setResults({
        success: stats.correct || 0,
        total: stats.total || 0,
        wrongExamples: stats.wrongExamples || []
      });

      // Вырубаем retryMode.enabled = false, если ошибок больше нет
      if (!stats.wrongExamples || stats.wrongExamples.length === 0) {
        globalState.retryMode = {
          enabled: false,
          examples: []
        };
      }

      navigate("results");
      return;
    }

    // Если пользователь нажал "⏹ Выйти":
    // Мы НЕ должны показывать результаты, мы должны вернуться в настройки
    if (stats.phase === "exit") {
      // Сбрасываем результаты, чтобы экран результатов не показал мусор
      resetResults();
      globalState.retryMode = {
        enabled: false,
        examples: []
      };
      navigate("settings");
      return;
    }

    // fallback: если phase не пришла (на всякий случай)
    logger.warn(CONTEXT, "Unknown training finish phase, defaulting to results");
    setResults({
      success: stats.correct || 0,
      total: stats.total || 0,
      wrongExamples: stats.wrongExamples || []
    });
    navigate("results");
  });

  try {
    // Динамически подгружаем тренажёр
    const module = await import("../ext/trainer_ext.js");
    if (!module?.mountTrainerUI) {
      throw new Error("Module trainer_ext.js loaded but mountTrainerUI not found");
    }

    logger.info(CONTEXT, "Mounting trainer...");

    // ВАЖНО 🔥
    // Тут мы должны передать:
    //  - настройки для сессии
    //  - retryMode (enabled/examples)
    //  - колбэки для навигации
    //
    // stateFromCaller приходит сверху (параметр renderGame),
    // globalState — общий синглтон из core/state.js.
    //
    // При повторном запуске после "Исправить ошибки":
    //   globalState.retryMode.enabled === true
    //   globalState.retryMode.examples === [ошибочные примеры]
    //
    // При обычном запуске:
    //   retryMode.enabled === false
    //
    // Настройки для тренировки берём так:
    // - если retryMode.enabled === true (режим исправления ошибок),
    //   используем сохраненные lastSettings, чтобы условия были те же
    // - иначе ВСЕГДА используем актуальные state.settings
    const isRetryMode = globalState.retryMode?.enabled === true;
    const effectiveSettings = isRetryMode 
      ? (globalState.lastSettings || state.settings)
      : state.settings;
    
    // Сохраняем текущие настройки для возможного retry
    if (!isRetryMode) {
      globalState.lastSettings = state.settings;
    }

    const cleanupTrainer = module.mountTrainerUI(body, {
      t,
      state: { settings: effectiveSettings },

      retryMode: globalState.retryMode || {
        enabled: false,
        examples: []
      },

      // Нажатие кнопки "⏹ Выйти" в тренажёре:
      // должно вернуть ученика на экран настроек
      onExitTrainer: () => {
        logger.info(CONTEXT, "Exit pressed → navigate(settings)");
        resetResults();
        globalState.retryMode = { enabled: false, examples: [] };
        navigate("settings");
      },

      // Завершили серию → показать глобальный экран "Результаты"
      onShowResultsScreen: () => {
        logger.info(CONTEXT, "Session done → navigate(results)");
        navigate("results");
      }
    });

    // cleanup
    return () => {
      logger.debug(CONTEXT, "Cleaning up game screen");
      unsubscribe();
      if (typeof cleanupTrainer === "function") {
        cleanupTrainer();
      }
    };
  } catch (error) {
    logger.error(CONTEXT, "Failed to load trainer:", error);

    // безопасный показ ошибки
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = "color:#d93025; padding:20px; font-weight:600;";

    const message = document.createTextNode("Не удалось загрузить тренажёр.");
    const br = document.createElement("br");
    const small = document.createElement("small");
    small.textContent = error.message;

    errorDiv.append(message, br, small);
    body.appendChild(errorDiv);

    toast.error("Не удалось загрузить тренажёр");

    return () => {
      unsubscribe();
    };
  }
}
