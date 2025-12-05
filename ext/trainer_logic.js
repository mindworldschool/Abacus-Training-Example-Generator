// ext/trainer_logic.js — Trainer logic (патч B с исправлением навигации и retry)
// 🔥 ИСПРАВЛЕНО: Добавлена остановка пошагового показа при переходе между экранами
//
// Главное отличие от старой версии в репозитории:
// 1. Мы разделяем переходы:
//    - onExitTrainer() → вернуться в настройки
//    - onShowResultsScreen() → показать ГЛОБАЛЬНЫЙ экран результатов
// 2. Кнопка "⏹ Выйти" больше НЕ открывает экран результатов. Только настройки.
// 3. Режим "Исправить ошибки" запускается правильно: только ошибочные примеры,
//    никаких новых сгенерированных примеров и ровно столько, сколько было ошибок.
// 4. finishTraining() теперь НЕ рендерит локальный экран "Итоги сессии" прямо
//    в тренажёре. Он сохраняет результаты в state и вызывает onShowResultsScreen().
//    Внешний экран "Результаты" теперь единственный финальный экран.
// 5. ✅ НОВОЕ: Добавлена остановка анимации (exampleView.stopAnimation()) при:
//    - Переходе в настройки (кнопка "Выйти")
//    - Завершении тренировки (finishTraining)
//    - Начале нового примера (showNextExample)
//
// Всё остальное (session.mode, reviewQueue, renderResultsScreen и т.д.) мы
// сохраняем для совместимости, но теперь они не ломают UX.

import { ExampleView } from "./components/ExampleView.js";
import { Abacus } from "./components/AbacusNew.js";
import { generateExample } from "./core/generator.js";
import { startAnswerTimer, stopAnswerTimer } from "../js/utils/timer.js";
import { BigStepOverlay } from "../ui/components/BigStepOverlay.js";
import { playSound } from "../js/utils/sound.js";
import { logger } from "../core/utils/logger.js";
import { UI, DEFAULTS } from "../core/utils/constants.js";
import { eventBus, EVENTS } from "../core/utils/events.js";
import toast from "../ui/components/Toast.js";
import { state, resetResults } from "../core/state.js";

const CONTEXT = "Trainer";

/* ---------------- Layout helpers ---------------- */

function createTrainerLayout(displayMode, exampleCount, t) {
  const layout = document.createElement("div");
  layout.className = `mws-trainer mws-trainer--${displayMode}`;

  // MAIN COLUMN
  const trainerMain = document.createElement("div");
  trainerMain.className = `trainer-main trainer-main--${displayMode}`;

  const exampleArea = document.createElement("div");
  exampleArea.id = "area-example";
  exampleArea.className = "example-view";
  trainerMain.appendChild(exampleArea);

  // SIDE PANEL
  const panelControls = document.createElement("div");
  panelControls.id = "panel-controls";

  // --- Answer input block
  const answerSection = document.createElement("div");
  answerSection.className = "answer-section-panel";

  const answerLabel = document.createElement("div");
  answerLabel.className = "answer-label";
  answerLabel.textContent = t?.("trainer.answerLabel") || "Ответ:";

  const answerInput = document.createElement("input");
  answerInput.type = "number";
  answerInput.id = "answer-input";
  answerInput.placeholder = "";

  const submitBtn = document.createElement("button");
  submitBtn.className = "btn btn--primary";
  submitBtn.id = "btn-submit";
  submitBtn.textContent = t?.("trainer.submitButton") || "Ответить";

  answerSection.append(answerLabel, answerInput, submitBtn);

  // --- Live stats capsule
  const statsCapsule = createResultsCapsule(exampleCount, t);

  // --- Progress bars
  const progressContainer = createProgressContainer(t);

  // --- Timer bar
  const timerContainer = document.createElement("div");
  timerContainer.id = "answer-timer";
  const timerBar = document.createElement("div");
  timerBar.className = "bar";
  timerContainer.appendChild(timerBar);

  const timerText = document.createElement("div");
  timerText.id = "answerTimerText";
  timerText.className = "answer-timer__text";

  // --- Abacus toggle card
  const abacusCard = document.createElement("div");
  abacusCard.className = "panel-card panel-card--compact";

  const abacusBtn = document.createElement("button");
  abacusBtn.className = "btn btn--secondary btn--fullwidth";
  abacusBtn.id = "btn-show-abacus";
  abacusBtn.textContent = t?.("trainer.showAbacus") || "🧮 Показать абакус";

  abacusCard.appendChild(abacusBtn);

  // --- Exit button card
  const exitCard = document.createElement("div");
  exitCard.className = "panel-card panel-card--compact";

  const exitBtn = document.createElement("button");
  exitBtn.id = "btn-exit-trainer";
  exitBtn.className = "btn btn--secondary btn--fullwidth btn--danger";
  exitBtn.textContent = t?.("trainer.exitButton") || "⏹ Выйти";

  exitCard.appendChild(exitBtn);

  panelControls.append(
    answerSection,
    statsCapsule,
    progressContainer,
    timerContainer,
    timerText,
    abacusCard,
    exitCard
  );

  layout.append(trainerMain, panelControls);
  return layout;
}

function createResultsCapsule(exampleCount, t) {
  const container = document.createElement("div");
  container.className = "results-capsule-extended";

  const header = document.createElement("div");
  header.className = "results-capsule-extended__header";

  const label = document.createElement("span");
  label.className = "results-capsule-extended__label";
  label.textContent = t?.("confirmation.list.actions") || "Примеры:";

  const counter = document.createElement("span");
  counter.className = "results-capsule-extended__counter";

  const completed = document.createElement("span");
  completed.id = "stats-completed";
  completed.textContent = "0";

  const total = document.createElement("span");
  total.id = "stats-total";
  total.textContent = String(exampleCount);

  counter.append(completed, " / ", total);
  header.append(label, counter);

  const capsule = document.createElement("div");
  capsule.className = "results-capsule";

  // correct cell
  const correctSide = document.createElement("div");
  correctSide.className = "results-capsule__side results-capsule__side--correct";

  const correctIcon = document.createElement("div");
  correctIcon.className = "results-capsule__icon";
  correctIcon.textContent = "✓";

  const correctValue = document.createElement("div");
  correctValue.className = "results-capsule__value";
  correctValue.id = "stats-correct";
  correctValue.textContent = "0";

  correctSide.append(correctIcon, correctValue);

  // divider
  const divider = document.createElement("div");
  divider.className = "results-capsule__divider";

  // wrong cell
  const incorrectSide = document.createElement("div");
  incorrectSide.className = "results-capsule__side results-capsule__side--incorrect";

  const incorrectIcon = document.createElement("div");
  incorrectIcon.className = "results-capsule__icon";
  incorrectIcon.textContent = "✗";

  const incorrectValue = document.createElement("div");
  incorrectValue.className = "results-capsule__value";
  incorrectValue.id = "stats-incorrect";
  incorrectValue.textContent = "0";

  incorrectSide.append(incorrectIcon, incorrectValue);

  capsule.append(correctSide, divider, incorrectSide);
  container.append(header, capsule);

  return container;
}

function createProgressContainer(t) {
  const container = document.createElement("div");
  container.className = "progress-container";

  const progressBar = document.createElement("div");
  progressBar.className = "progress-bar";

  const correctBar = document.createElement("div");
  correctBar.className = "progress-bar__correct";
  correctBar.id = "progress-correct";
  correctBar.style.width = "0%";

  const incorrectBar = document.createElement("div");
  incorrectBar.className = "progress-bar__incorrect";
  incorrectBar.id = "progress-incorrect";
  incorrectBar.style.width = "0%";

  progressBar.append(correctBar, incorrectBar);

  const labels = document.createElement("div");
  labels.className = "progress-label";

  const correctLabel = document.createElement("span");
  correctLabel.className = "progress-label__correct";
  correctLabel.textContent = t?.("trainer.correctLabel") || "Правильно: ";
  const correctPercent = document.createElement("strong");
  correctPercent.id = "percent-correct";
  correctPercent.textContent = "0%";
  correctLabel.appendChild(correctPercent);

  const incorrectLabel = document.createElement("span");
  incorrectLabel.className = "progress-label__incorrect";
  incorrectLabel.textContent = t?.("trainer.incorrectLabel") || "Ошибки: ";
  const incorrectPercent = document.createElement("strong");
  incorrectPercent.id = "percent-incorrect";
  incorrectPercent.textContent = "0%";
  incorrectLabel.appendChild(incorrectPercent);

  labels.append(correctLabel, incorrectLabel);
  container.append(progressBar, labels);

  return container;
}

function createAbacusWrapper() {
  const wrapper = document.createElement("div");
  wrapper.className = "abacus-wrapper";
  wrapper.id = "abacus-wrapper";

  const header = document.createElement("div");
  header.className = "abacus-header";

  const title = document.createElement("span");
  title.className = "abacus-title";
  title.textContent = "🧮 Абакус";

  const closeBtn = document.createElement("button");
  closeBtn.className = "abacus-close-btn";
  closeBtn.id = "btn-close-abacus";
  closeBtn.title = "Закрыть";
  closeBtn.textContent = "×";

  header.append(title, closeBtn);

  const container = document.createElement("div");
  container.id = "floating-abacus-container";

  wrapper.append(header, container);
  return wrapper;
}

/**
 * Локальный экран итогов с кнопкой "Исправить ошибки"
 * ОСТАВЛЯЕМ ДЛЯ СОВМЕСТИМОСТИ, но больше не используем автоматически.
 * Вся финализация теперь уходит наружу.
 */
function renderResultsScreen(rootNode, session, { t, onRestart, onRetryErrors, onBackToSettings }) {
  rootNode.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "results-screen";

  const titleEl = document.createElement("h2");
  titleEl.className = "results-screen__title";
  titleEl.textContent = t?.("results.title") || "Итоги сессии";

  const descEl = document.createElement("div");
  descEl.className = "results-screen__desc";
  descEl.textContent =
    t?.("results.description") || "Так прошла попытка.";

  const statsEl = document.createElement("div");
  statsEl.className = "results-screen__stats";

  const correctLine = document.createElement("div");
  correctLine.className = "results-screen__row results-screen__row--success";
  const correctLabel = document.createElement("span");
  correctLabel.textContent =
    t?.("results.success") || "Верно";
  const correctValue = document.createElement("strong");
  correctValue.textContent = `${session.stats.correct}/${session.stats.total}`;
  correctLine.append(correctLabel, correctValue);

  const mistakeLine = document.createElement("div");
  mistakeLine.className = "results-screen__row results-screen__row--fail";
  const mistakesLabel = document.createElement("span");
  mistakesLabel.textContent =
    t?.("results.mistakes") || "Ошибки";
  const mistakesValue = document.createElement("strong");
  mistakesValue.textContent = `${session.stats.incorrect}`;
  mistakeLine.append(mistakesLabel, mistakesValue);

  statsEl.append(correctLine, mistakeLine);

  const actionsEl = document.createElement("div");
  actionsEl.className = "results-screen__actions";

  if (
    session.incorrectExamples &&
    session.incorrectExamples.length > 0 &&
    session.stats.incorrect > 0
  ) {
    const retryBtn = document.createElement("button");
    retryBtn.className = "btn btn--primary";
    retryBtn.id = "btn-retry-errors";
    retryBtn.textContent =
      t?.("results.retryErrors") || "Исправить ошибки";

    retryBtn.addEventListener("click", () => {
      onRetryErrors?.();
    });

    actionsEl.appendChild(retryBtn);
  }

  const backBtn = document.createElement("button");
  backBtn.className = "btn btn--secondary";
  backBtn.id = "btn-results-back";
  backBtn.textContent =
    t?.("results.cta") || "Запустить новое задание";

  backBtn.addEventListener("click", () => {
    onBackToSettings?.();
  });

  actionsEl.appendChild(backBtn);

  wrapper.append(titleEl, descEl, statsEl, actionsEl);
  rootNode.appendChild(wrapper);
}

/* ---------------- Trainer main ---------------- */

/**
 * mountTrainerUI
 *
 * @param {HTMLElement} container
 * @param {{
 *   t: Function,
 *   state: { settings: any },
 *   retryMode?: { enabled: boolean, examples: Array<{steps: string[], answer: number}> },
 *   onExitTrainer?: Function,          // уйти в настройки
 *   onShowResultsScreen?: Function     // показать глобальный экран "Результаты"
 * }}
 */
export function mountTrainerUI(container, {
  t,
  state: stateFromCaller,
  retryMode,
  onExitTrainer,
  onShowResultsScreen
}) {
  try {
    logger.info(CONTEXT, "Mounting trainer UI...");
    logger.debug(CONTEXT, "Settings:", stateFromCaller?.settings);

    const st = stateFromCaller?.settings ?? {};
    const actionsCfg = st.actions ?? {};
    const examplesCfg = st.examples ?? {};
    const blockSimpleDigits = Array.isArray(st?.blocks?.simple?.digits)
      ? st.blocks.simple.digits
      : [];

    const digits = parseInt(st.digits, 10) || 1;
    const abacusColumns = digits + 1;
    const displayMode = st.inline ? "inline" : "column";

    // ====== РЕЖИМ ЗАПУСКА: обычный или retry после "Исправить ошибки"
    const isRetryStartup =
      retryMode?.enabled && Array.isArray(retryMode.examples);

    // базовое количество примеров из настроек (основная серия)
    const baseExampleCount = getExampleCount(examplesCfg);

    // сколько примеров реально решаем в этой сессии:
    const totalForThisRun = isRetryStartup
      ? retryMode.examples.length
      : baseExampleCount;

    // === состояние сессии
    const session = {
      currentExample: null,

      stats: {
        correct: 0,
        incorrect: 0,
        total: totalForThisRun
      },

      completed: 0,

      // массив неправильных ответов этой сессии
      incorrectExamples: [],

      // режим логики тренажёра:
      //  - "main": обычная серия (генерируем примеры)
      //  - "review": исправление ошибок (берём фиксированный список примеров)
      mode: isRetryStartup ? "review" : "main",

      reviewQueue: isRetryStartup
        ? retryMode.examples.map(e => ({
            steps: [...e.steps],
            answer: e.answer
          }))
        : [],

      reviewIndex: 0
    };

    // === DOM тренажёра
    const layout = createTrainerLayout(displayMode, totalForThisRun, t);
    container.innerHTML = "";
    container.appendChild(layout);

    // Abacus wrapper
    const oldAbacus = document.getElementById("abacus-wrapper");
    if (oldAbacus) oldAbacus.remove();

    const abacusWrapper = createAbacusWrapper();
    document.body.appendChild(abacusWrapper);

    const exampleView = new ExampleView(
      document.getElementById("area-example")
    );

    const abacus = new Abacus(
      document.getElementById("floating-abacus-container"),
      { digitCount: abacusColumns }  // ✅ Передаём объект с digitCount
    );

    const overlayColor =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--color-primary"
      )?.trim() || "#EC8D00";
    const overlay = new BigStepOverlay(
      st.bigDigitScale ?? UI.BIG_DIGIT_SCALE,
      overlayColor
    );

    if (st.mode === "abacus") {
      abacusWrapper.classList.add("visible");
      const btn = document.getElementById("btn-show-abacus");
      if (btn) {
        btn.textContent =
          t?.("trainer.hideAbacus") || "🧮 Скрыть абакус";
      }
    }

    let isShowing = false;
    let showAbort = false;

    /* ---------- helpers ---------- */

    function adaptExampleFontSize(actionsCount, maxDigitsInOneStep) {
      const exampleLines = document.querySelectorAll(
        "#area-example .example__line"
      );

      if (!exampleLines.length) return;

      const actionsFactor = Math.min(actionsCount, 12) / 12;
      const digitsFactor = Math.min(maxDigitsInOneStep, 9) / 9;
      const complexityFactor = (actionsFactor + digitsFactor) / 2;

      const minFontSize = 24;
      const maxFontSize = 96;
      const fontSize =
        maxFontSize -
        complexityFactor * (maxFontSize - minFontSize);

      exampleLines.forEach((line) => {
        line.style.setProperty(
          "font-size",
          `${Math.round(fontSize)}px`,
          "important"
        );
        line.style.setProperty("line-height", "1.2", "important");
      });
    }

    function buildGeneratorSettings() {
      const selectedDigits =
        blockSimpleDigits.length > 0
          ? blockSimpleDigits.map((d) => parseInt(d, 10))
          : [1, 2, 3, 4];

      const genMin =
        actionsCfg.infinite === true
          ? DEFAULTS.ACTIONS_MIN
          : (actionsCfg.min ??
             actionsCfg.count ??
             DEFAULTS.ACTIONS_MIN);

      const genMax =
        actionsCfg.infinite === true
          ? DEFAULTS.ACTIONS_MAX
          : (actionsCfg.max ??
             actionsCfg.count ??
             DEFAULTS.ACTIONS_MAX);

      return {
        blocks: {
          simple: {
            digits: selectedDigits,
            includeFive:
              (st.blocks?.simple?.includeFive ??
                selectedDigits.includes(5)),
            onlyAddition:
              (st.blocks?.simple?.onlyAddition ?? false),
            onlySubtraction:
              (st.blocks?.simple?.onlySubtraction ?? false)
          },
          brothers: {
            active: st.blocks?.brothers?.active ?? false,
            digits: st.blocks?.brothers?.digits ?? [4],
            onlyAddition: st.blocks?.brothers?.onlyAddition ?? false,
            onlySubtraction: st.blocks?.brothers?.onlySubtraction ?? false
          },
          friends: {
            active: st.blocks?.friends?.active ?? false
          },
          mix: {
            active: st.blocks?.mix?.active ?? false
          }
        },

        actions: {
          min: genMin,
          max: genMax,
          count: actionsCfg.count,
          infinite: actionsCfg.infinite === true
        },

        digits: st.digits,
        combineLevels: st.combineLevels || false
      };
    }

    function delay(ms) {
      return new Promise((r) => setTimeout(r, ms));
    }

    function formatStep(step) {
      // шаги у нас уже со знаком "+3"/"-2"
      return String(step);
    }

    async function playSequential(
      steps,
      intervalMs,
      { beepOnStep = false } = {}
    ) {
      try {
        for (let i = 0; i < steps.length; i++) {
          if (showAbort) break;

          const stepStr = formatStep(steps[i]);
          const isOdd = i % 2 === 0;
          const color = isOdd ? "#EC8D00" : "#6db45c";

          overlay.show(stepStr, color);
          if (beepOnStep) playSound("tick");
          await delay(intervalMs);
          overlay.hide();
          await delay(UI.DELAY_BETWEEN_STEPS_MS);
        }
      } finally {
        overlay.clear();
      }
    }

    function updateStatsUI() {
      const { correct, incorrect, total } = session.stats;
      const completed = session.completed;
      const el = (id) => document.getElementById(id);

      if (el("stats-completed"))
        el("stats-completed").textContent = String(completed);
      if (el("stats-correct"))
        el("stats-correct").textContent = String(correct);
      if (el("stats-incorrect"))
        el("stats-incorrect").textContent = String(incorrect);

      const percentCorrect =
        completed > 0
          ? Math.round((correct / completed) * 100)
          : 0;
      const percentIncorrect =
        completed > 0
          ? Math.round((incorrect / completed) * 100)
          : 0;

      if (el("progress-correct"))
        el("progress-correct").style.width =
          percentCorrect + "%";
      if (el("progress-incorrect"))
        el("progress-incorrect").style.width =
          percentIncorrect + "%";

      if (el("percent-correct"))
        el("percent-correct").textContent =
          percentCorrect + "%";
      if (el("percent-incorrect"))
        el("percent-incorrect").textContent =
          percentIncorrect + "%";
    }

    function getNextExample() {
      // режим review: берём заранее сохранённые ошибочные примеры
      if (session.mode === "review") {
        if (session.reviewIndex >= session.reviewQueue.length) {
          // закончили повтор ошибок
          finishTraining();
          return null;
        }
        return session.reviewQueue[session.reviewIndex];
      }

      // обычный режим main: генерируем новый пример
      return generateExample(buildGeneratorSettings());
    }

    async function showNextExample() {
      // ✅ ИСПРАВЛЕНИЕ 1: Останавливаем анимацию перед новым примером
      exampleView.stopAnimation();
      
      overlay.clear();
      showAbort = true;
      isShowing = false;

      // если решили все примеры этой сессии → завершаем
      if (session.completed >= session.stats.total) {
        finishTraining();
        return;
      }

      const ex = getNextExample();
      if (!ex || !Array.isArray(ex.steps)) {
        finishTraining();
        return;
      }

      session.currentExample = ex;

      // оценка для адаптивного шрифта
      const actionsLen = ex.steps.length;
      let maxDigitsInStep = 1;
      for (const step of ex.steps) {
        const numericPart = String(step).replace(/[^\d-]/g, "");
        const num = parseInt(numericPart, 10);
        if (!isNaN(num)) {
          const lenAbs = Math.abs(num).toString().length;
          if (lenAbs > maxDigitsInStep) {
            maxDigitsInStep = lenAbs;
          }
        }
      }

      // сбрасываем поле ввода
      const input = document.getElementById("answer-input");
      if (input) input.value = "";

      // скорость показа шагов
      const shouldUseDictation = actionsLen > 12;
      const effectiveShowSpeed = shouldUseDictation
        ? 2000
        : (st.showSpeedMs || 0);
      const showSpeedActive =
        st.showSpeedEnabled && effectiveShowSpeed > 0;

      // Преобразуем шаги для отображения (братские объекты → строки)
      const displaySteps = ex.steps.map(step => {
        if (typeof step === "string") return step;           // "+3"
        if (step.step) return step.step;                     // братский: {step: "+1", ...}
        return String(step);                                 // fallback
      });

      // как рисуем пример
      if (showSpeedActive || shouldUseDictation) {
        // диктовка: не показываем список целиком
        const area = document.getElementById("area-example");
        if (area) area.innerHTML = "";
      } else {
        exampleView.render(displaySteps, displayMode);
        requestAnimationFrame(() => {
          adaptExampleFontSize(actionsLen, maxDigitsInStep);
        });
      }

      // блокировать ли инпут во время диктовки
      const lockDuringShow = st.lockInputDuringShow !== false;
      if (input) input.disabled = lockDuringShow;

      if (showSpeedActive || shouldUseDictation) {
        isShowing = true;
        showAbort = false;
        await playSequential(
          displaySteps,
          effectiveShowSpeed,
          { beepOnStep: !!st.beepOnStep }
        );
        if (showAbort) return;
        await delay(
          st.showSpeedPauseAfterChainMs ??
            UI.PAUSE_AFTER_CHAIN_MS
        );
        isShowing = false;
        if (lockDuringShow && input) {
          input.disabled = false;
          input.focus();
        }
      } else {
        if (input) {
          input.disabled = false;
          input.focus();
        }
      }

      logger.debug(
        CONTEXT,
        "Next example:",
        ex.steps,
        "Answer:",
        ex.answer,
        "mode:",
        session.mode
      );
    }

    function checkAnswer() {
      const input = document.getElementById("answer-input");
      if (!input) return;

      // не даём отвечать во время показа, если запрещено
      if (isShowing && st.lockInputDuringShow !== false) return;

      const userAnswer = parseInt(input.value ?? "", 10);
      if (Number.isNaN(userAnswer)) {
        toast.warning(
          t?.("trainer.pleaseEnterNumber") ||
            "Пожалуйста, введите число"
        );
        return;
      }

      // если разрешён ответ во время показа → обрываем показ
      if (isShowing && st.lockInputDuringShow === false) {
        showAbort = true;
        isShowing = false;
        overlay.clear();
        exampleView.stopAnimation();  // ✅ Останавливаем анимацию
      }

      const correctAnswer = session.currentExample.answer;
      const isCorrect = userAnswer === correctAnswer;

      if (session.mode === "review") {
        // в режиме review мы не меняем основной счётчик total,
        // но мы всё равно фиксируем правильность на экране результатов:
        if (!isCorrect) {
          // если всё ещё ошибка — кидаем пример в хвост ещё раз
          session.reviewQueue.push({
            steps: session.currentExample.steps.slice(),
            answer: correctAnswer,
            userAnswer
          });
        }
        session.reviewIndex++;
        // статистику "сколько верно / ошибочно" для retry-сессии
        if (isCorrect) {
          session.stats.correct++;
        } else {
          session.stats.incorrect++;
        }
      } else {
        // основная серия
        if (isCorrect) {
          session.stats.correct++;
        } else {
          session.stats.incorrect++;
          session.incorrectExamples.push({
            steps: session.currentExample.steps.slice(),
            answer: correctAnswer,
            userAnswer
          });
        }
        session.completed++;
      }

      updateStatsUI();
      playSound(isCorrect ? "correct" : "wrong");

      setTimeout(showNextExample, UI.TRANSITION_DELAY_MS);
    }

    function handleTimeExpired() {
      playSound("wrong");

      const correctAnswer = session.currentExample
        ? session.currentExample.answer
        : null;

      if (session.mode === "review") {
        // тайм-аут в retry-сессии: считаем как ошибку и двигаем дальше
        session.stats.incorrect++;
        session.reviewIndex++;
      } else {
        // тайм-аут в обычной сессии
        session.stats.incorrect++;
        session.incorrectExamples.push({
          steps: session.currentExample
            ? session.currentExample.steps.slice()
            : [],
          answer: correctAnswer,
          userAnswer: null
        });
        session.completed++;
      }

      updateStatsUI();
      setTimeout(showNextExample, UI.TIMEOUT_DELAY_MS);
    }

    /**
     * Ключевой момент: завершение серии.
     * Теперь мы НЕ рендерим локальный экран итогов (скрин 1).
     *
     * Вместо этого:
     *  - сохраняем результаты в global state
     *  - настраиваем retryMode в global state
     *  - сохраняем lastSettings
     *  - вызываем onShowResultsScreen(), чтобы роутер показал
     *    внешний экран "Результаты" (скрин 2)
     */
    function finishTraining() {
      // ✅ ИСПРАВЛЕНИЕ 2: Останавливаем анимацию при завершении
      exampleView.stopAnimation();
      
      stopAnswerTimer();
      showAbort = true;
      isShowing = false;
      overlay.clear();
      abacusWrapper.classList.remove("visible");

      logger.info(
        CONTEXT,
        "Training finished:",
        {
          stats: session.stats,
          incorrectExamples: session.incorrectExamples,
          mode: session.mode
        }
      );

      // сохраняем в глобальный state, чтобы results.js мог это отрисовать
      state.results = {
        total: session.stats.total,
        success: session.stats.correct,
        wrongExamples:
          session.incorrectExamples.slice()
      };

      // сохраняем очередь для повтора ошибок,
      // экран результатов потом передаст это обратно в mountTrainerUI()
      state.retryMode = {
        enabled: session.incorrectExamples.length > 0,
        examples: session.incorrectExamples.slice()
      };

      // запоминаем настройки сессии, чтобы можно было
      // повторно запустить тренировку или retry с теми же параметрами
      state.lastSettings = st;

      // Переход наружу: показать глобальный экран "Результаты"
      onShowResultsScreen?.();

      // событие наружу для любых подписчиков
      eventBus.emit?.(EVENTS.TRAINING_FINISH, {
        correct: session.stats.correct,
        total: session.stats.total,
        wrong: session.stats.incorrect,
        phase: "done",
        wrongExamples: session.incorrectExamples.slice()
      }) || eventBus.publish?.(EVENTS.TRAINING_FINISH, {
        correct: session.stats.correct,
        total: session.stats.total,
        wrong: session.stats.incorrect,
        phase: "done",
        wrongExamples: session.incorrectExamples.slice()
      });
    }

    /* эти функции оставлены ради обратной совместимости.
       теперь мы не зовём их из finishTraining() автоматически */
    function remountTrainerViewForReview() {
      session.mode = "review";
      session.reviewQueue = session.incorrectExamples.map(
        (e) => ({
          steps: [...e.steps],
          answer: e.answer
        })
      );
      session.reviewIndex = 0;

      const newLayout = createTrainerLayout(
        displayMode,
        session.reviewQueue.length,
        t
      );
      container.innerHTML = "";
      container.appendChild(newLayout);

      rebindDynamicRefsAfterRemount();
      showNextExample();
    }

    function rebindDynamicRefsAfterRemount() {
      attachListeners(); // привязать новые DOM-ноды
      updateStatsUI();

      const btnToggleAbacus = document.getElementById("btn-show-abacus");
      if (btnToggleAbacus) {
        btnToggleAbacus.textContent = abacusWrapper.classList.contains("visible")
          ? (t?.("trainer.hideAbacus") || "🧮 Скрыть абакус")
          : (t?.("trainer.showAbacus") || "🧮 Показать абакус");
      }
    }

    /* ---------- events / listeners ---------- */

    const listeners = [];

    function addListener(element, event, handler) {
      if (!element) return;
      element.addEventListener(event, handler);
      listeners.push({ element, event, handler });
    }

    function attachListeners() {
      addListener(
        document.getElementById("btn-show-abacus"),
        "click",
        () => {
          abacusWrapper.classList.toggle("visible");
          const btn = document.getElementById("btn-show-abacus");
          if (btn) {
            btn.textContent = abacusWrapper.classList.contains("visible")
              ? (t?.("trainer.hideAbacus") || "🧮 Скрыть абакус")
              : (t?.("trainer.showAbacus") || "🧮 Показать абакус");
          }
        }
      );

      addListener(
        document.getElementById("btn-close-abacus"),
        "click",
        () => {
          abacusWrapper.classList.remove("visible");
          const btn = document.getElementById("btn-show-abacus");
          if (btn)
            btn.textContent =
              t?.("trainer.showAbacus") ||
              "🧮 Показать абакус";
        }
      );

      addListener(
        document.getElementById("btn-submit"),
        "click",
        checkAnswer
      );

      addListener(
        document.getElementById("answer-input"),
        "keypress",
        (e) => {
          if (e.key === "Enter") checkAnswer();
        }
      );

      // 🛠 КНОПКА "ВЫЙТИ"
      // Раньше мы тут ещё дергали onShowResultsScreen(). Это было неправильно:
      // пользователь думал "я выхожу в настройки", а мы вели его на экран результатов.
      // Теперь вызываем ТОЛЬКО onExitTrainer().
      addListener(
        document.getElementById("btn-exit-trainer"),
        "click",
        () => {
          // ✅ ИСПРАВЛЕНИЕ 3: Останавливаем анимацию при выходе
          exampleView.stopAnimation();
          
          stopAnswerTimer();
          showAbort = true;
          isShowing = false;
          overlay.clear();
          abacusWrapper.classList.remove("visible");

          // Сбросить результаты, чтобы внешний экран результатов не показался случайно
          resetResults();
          state.retryMode = {
            enabled: false,
            examples: []
          };

          // Навигация: уводим пользователя на экран настроек
          onExitTrainer?.();

          eventBus.emit?.(EVENTS.TRAINING_FINISH, {
            correct: session.stats.correct,
            total: session.stats.total,
            phase: "exit"
          }) ||
            eventBus.publish?.(EVENTS.TRAINING_FINISH, {
              correct: session.stats.correct,
              total: session.stats.total,
              phase: "exit"
            });
        }
      );
    }

    attachListeners();

    // === Глобальный лимит (общий таймер всей сессии)
    if (st.timeLimitEnabled && st.timePerExampleMs > 0) {
      startAnswerTimer(st.timePerExampleMs, {
        onExpire: () => {
          logger.warn(CONTEXT, "Series time expired!");
          finishTraining();
        },
        textElementId: "answerTimerText",
        barSelector: "#answer-timer .bar"
      });
    }

    // === Локальный таймер на один пример
    if (st.perExampleTimerEnabled && st.perExampleTimeMs > 0) {
      startAnswerTimer(st.perExampleTimeMs, {
        onExpire: () => handleTimeExpired(),
        textElementId: "answerTimerText",
        barSelector: "#answer-timer .bar"
      });
    }

    // === Стартуем
    showNextExample();
    logger.info(
      CONTEXT,
      `Trainer started (retryStartup=${isRetryStartup}, cols=${abacusColumns}, digits=${digits})`
    );

    // === Cleanup при размонтировании
    return () => {
      const wrapper = document.getElementById("abacus-wrapper");
      if (wrapper) wrapper.remove();
      showAbort = true;
      isShowing = false;
      overlay.clear();
      stopAnswerTimer();
      
      // ✅ Останавливаем анимацию при размонтировании
      exampleView.stopAnimation();

      listeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });

      logger.debug(
        CONTEXT,
        "Trainer unmounted, listeners cleaned up"
      );
    };
  } catch (err) {
    showFatalError(err);
  }
}

/* ---------------- misc helpers ---------------- */

function showFatalError(err) {
  const msg = err?.stack || err?.message || String(err);
  logger.error(CONTEXT, "Fatal error:", err);

  const host =
    document.querySelector(".screen__body") || document.body;

  const errorDiv = document.createElement("div");
  errorDiv.style.cssText =
    "color:#d93025;padding:16px;white-space:pre-wrap";

  const title = document.createElement("b");
  title.textContent = "Не удалось загрузить тренажёр.";

  const br = document.createElement("br");

  const message = document.createTextNode(msg);

  errorDiv.append(title, br, message);
  host.insertBefore(errorDiv, host.firstChild);
}

function getExampleCount(examplesCfg) {
  if (!examplesCfg) return DEFAULTS.EXAMPLES_COUNT;
  return examplesCfg.infinite
    ? DEFAULTS.EXAMPLES_COUNT
    : (examplesCfg.count ?? DEFAULTS.EXAMPLES_COUNT);
}
