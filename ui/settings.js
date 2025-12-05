import { createScreenShell, createButton, createStepIndicator } from "./helper.js";
import { state } from "../core/state.js";

function createFormRow(labelText) {
  const row = document.createElement("div");
  row.className = "settings-grid__row";

  const label = document.createElement("span");
  label.className = "settings-grid__label";
  label.textContent = labelText;

  const control = document.createElement("div");
  control.className = "settings-grid__control";

  row.append(label, control);

  return { row, control, label };
}

function createSelect(options, value, onChange) {
  const select = document.createElement("select");

  // если значение не задано — ставим "none" по умолчанию
  const currentValue = value || "none";

  options.forEach((option) => {
    const opt = document.createElement("option");
    opt.value = option.value;
    opt.textContent = option.label;
    if (option.value === currentValue) opt.selected = true;
    select.appendChild(opt);
  });

  // если ни одна опция не выбрана — явно проставляем
  if (![...select.options].some(o => o.selected)) {
    select.value = "none";
  }

  select.addEventListener("change", () => onChange(select.value));
  return select;
}

function createCheckbox(labelText, checked, onChange, className = "settings-checkbox") {
  const label = document.createElement("label");
  label.className = className;

  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => {
    onChange(input.checked);
    label.classList.toggle("is-active", input.checked);
  });

  const text = document.createElement("span");
  text.textContent = labelText;

  label.append(input, text);
  label.classList.toggle("is-active", checked);
  return label;
}

function createCounter({ count, infinite, infinityLabel, onUpdate }) {
  let finiteValue = count || 1;

  const wrapper = document.createElement("div");
  wrapper.className = "counter";

  const minus = document.createElement("button");
  minus.type = "button";
  minus.className = "counter__btn";
  minus.textContent = "−";

  const input = document.createElement("input");
  input.type = "number";
  input.className = "counter__input";
  input.min = "1";
  input.value = String(count ?? finiteValue);
  input.disabled = infinite;
  if (infinite) {
    input.value = "";
    input.placeholder = infinityLabel;
  }

  const plus = document.createElement("button");
  plus.type = "button";
  plus.className = "counter__btn";
  plus.textContent = "+";

  const infinityWrap = document.createElement("label");
  infinityWrap.className = "counter__infinity";
  const infinityInput = document.createElement("input");
  infinityInput.type = "checkbox";
  infinityInput.checked = infinite;
  const infinityText = document.createElement("span");
  infinityText.textContent = infinityLabel;
  infinityWrap.append(infinityInput, infinityText);

  function emit(countValue, infiniteValue) {
    const nextCount = Math.max(1, Number.isNaN(Number(countValue)) ? 1 : Number(countValue));
    if (!infiniteValue) finiteValue = nextCount;
    onUpdate({ count: nextCount, infinite: infiniteValue });
  }

  minus.addEventListener("click", () => {
    if (infinityInput.checked) return;
    const next = Math.max(1, (parseInt(input.value, 10) || finiteValue) - 1);
    input.value = String(next);
    emit(next, false);
  });

  plus.addEventListener("click", () => {
    if (infinityInput.checked) return;
    const next = (parseInt(input.value, 10) || finiteValue) + 1;
    input.value = String(next);
    emit(next, false);
  });

  input.addEventListener("change", () => {
    const value = Math.max(1, parseInt(input.value, 10) || finiteValue);
    input.value = String(value);
    emit(value, false);
  });

  infinityInput.addEventListener("change", () => {
    const isInfinite = infinityInput.checked;
    input.disabled = isInfinite;
    if (isInfinite) {
      input.value = "";
      input.placeholder = infinityLabel;
    } else {
      input.value = String(finiteValue);
      input.placeholder = "";
    }
    emit(finiteValue, isInfinite);
  });

  wrapper.append(minus, input, plus, infinityWrap);
  return wrapper;
}

function createSection(title) {
  const section = document.createElement("section");
  section.className = "settings-section";

  const heading = document.createElement("h3");
  heading.className = "settings-section__title";
  heading.textContent = title;

  section.appendChild(heading);
  return section;
}

function createBlockCard({
  key,
  title,
  digits,
  stateBlock,
  onUpdate,
  allLabel,
  additionLabel,
  subtractionLabel,
  t  // ✅ ИСПРАВЛЕНИЕ 1: добавлен параметр t
}) {
  console.log(`🔍 [createBlockCard] Создание карточки "${key}"`);
  console.log(`🔍 [createBlockCard] stateBlock.digits:`, stateBlock.digits);
  console.log(`🔍 [createBlockCard] available digits:`, digits);
  
 // === СТАЛО ===
const card = document.createElement("div");
card.className = "block-card";
card.dataset.block = key;  // 🔥 НОВОЕ: для селектора

  const header = document.createElement("div");
  header.className = "block-card__header";

  const heading = document.createElement("h4");
  heading.className = "block-card__title";
  heading.textContent = title;

  const digitWrap = document.createElement("div");
  digitWrap.className = "block-card__digits";
  const orderMap = new Map(digits.map((digit, index) => [digit, index]));
  const digitInputs = digits.map((digit) => {
    const label = document.createElement("label");
    label.className = "digit-chip";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = stateBlock.digits.includes(digit);

    const text = document.createElement("span");
    text.className = "digit-chip__text";
    text.textContent = digit;

    label.append(input, text);
    label.classList.toggle("digit-chip--active", input.checked);

   // === СТАЛО ===
input.addEventListener("change", () => {
  label.classList.toggle("digit-chip--active", input.checked);
  const current = new Set(state.settings.blocks[key].digits);
  if (input.checked) current.add(digit);
  else current.delete(digit);
  const nextDigits = Array.from(current).sort((a, b) => {
    const orderA = orderMap.get(a) ?? 0;
    const orderB = orderMap.get(b) ?? 0;
    return orderA - orderB;
  });
  onUpdate({ digits: nextDigits });
  updateAllToggle();
  
  // 🔥 АВТОВЫДЕЛЕНИЕ "Просто" при работе с блоком "Братья"
  if (key === "brothers") {
    // Проверяем: есть ли хоть одна выбранная цифра в "Братья"?
    const brothersHasDigits = nextDigits.length > 0;
    
    console.log("🔄 Блок Братья изменен. Выбрано цифр:", nextDigits.length);
    console.log("🔄 Текущие цифры в Просто:", state.settings.blocks.simple.digits);
    
    if (brothersHasDigits) {
      console.log("✅ Автовыделение всех цифр 1-9 в блоке 'Просто'");
      
      // ✅ Сохраняем в state через updateSettings
      updateSettings({
        blocks: {
          ...state.settings.blocks,
          simple: {
            ...state.settings.blocks.simple,
            digits: ["1", "2", "3", "4", "5", "6", "7", "8", "9"]
          }
        }
      });
      
      // ✅ Обновляем UI с небольшой задержкой для гарантии
      setTimeout(() => {
        const simpleCard = document.querySelector('.block-card[data-block="simple"]');
        if (simpleCard) {
          // Активируем все чипы
          simpleCard.querySelectorAll('.digit-chip input').forEach(inp => {
            inp.checked = true;
            inp.closest('.digit-chip').classList.add('digit-chip--active');
          });
          
          // Активируем галочку "Все"
          const allToggle = simpleCard.querySelector('.settings-checkbox--pill input');
          if (allToggle) {
            allToggle.checked = true;
            allToggle.closest('.settings-checkbox').classList.add('is-active');
          }
          
          console.log("✅ UI блока 'Просто' обновлен");
        }
      }, 50);
    }
  }
});

    digitWrap.appendChild(label);
    return { input, label, digit };
  });

  const allToggle = createCheckbox(
    allLabel,
    stateBlock.digits.length === digits.length,
    (checked) => {
      const nextDigits = checked ? [...digits] : [];
      digitInputs.forEach(({ input, label }) => {
        input.checked = checked;
        label.classList.toggle("digit-chip--active", checked);
      });
      onUpdate({ digits: nextDigits });
      allToggle.classList.toggle("is-active", checked);
    },
    "settings-checkbox settings-checkbox--pill"
  );

  function updateAllToggle() {
    const activeCount = digitInputs.filter(({ input }) => input.checked).length;
    const input = allToggle.querySelector("input");
    const isAllSelected = activeCount === digits.length && digits.length > 0;
    
    if (key === "simple" || key === "brothers") {
      console.log(`🔍 [${key}] updateAllToggle: активно ${activeCount} из ${digits.length}`);
    }
    
    input.checked = isAllSelected;
    allToggle.classList.toggle("is-active", isAllSelected);
  }

  header.append(heading, allToggle);
  card.append(header, digitWrap);
  updateAllToggle();

  // Footer с кнопками "Только сложение" и "Только вычитание"
  // Показывается для всех блоков КРОМЕ "simple"
  if (key !== "simple") {
    const footer = document.createElement("div");
    footer.className = "block-card__footer";

    const additionToggle = createCheckbox(
      additionLabel,
      stateBlock.onlyAddition,
      (checked) => {
        console.log(`🔍 [${key}] Только сложение:`, checked);
        onUpdate({ onlyAddition: checked });
      },
      "settings-checkbox settings-checkbox--outline"
    );

    const subtractionToggle = createCheckbox(
      subtractionLabel,
      stateBlock.onlySubtraction,
      (checked) => {
        console.log(`🔍 [${key}] Только вычитание:`, checked);
        onUpdate({ onlySubtraction: checked });
      },
      "settings-checkbox settings-checkbox--outline"
    );

    footer.append(additionToggle, subtractionToggle);
    card.appendChild(footer);
  }

  return card;
}

export function renderSettings(container, { t, state, updateSettings, navigate }) {
  const { section, body, heading, paragraph } = createScreenShell({
    title: t("settings.title"),
    description: t("settings.description"),
    className: "settings-screen"
  });

  const indicator = createStepIndicator("settings", t);
  section.insertBefore(indicator, section.firstChild);

  heading.textContent = t("settings.title");
  paragraph.textContent = t("settings.description");

  // ✅ СИНХРОНИЗАЦИЯ: Если "Братья" активны, в "Просто" должны быть все цифры 1-9
  const settingsState = state.settings;
  
  console.log("🔍 [settings] Проверка синхронизации блоков при рендере");
  console.log("🔍 [settings] Братья digits:", settingsState.blocks.brothers.digits);
  console.log("🔍 [settings] Просто digits:", settingsState.blocks.simple.digits);
  
  const brothersSelected = settingsState.blocks.brothers.digits.length > 0;
  
  if (brothersSelected) {
    console.log("👬 [settings] Братья активны - проверяем блок Просто");
    
    const allSimpleDigits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
    const currentSimpleDigits = settingsState.blocks.simple.digits || [];
    
    // Проверяем, все ли цифры выбраны в "Просто"
    const allSelected = allSimpleDigits.every(d => currentSimpleDigits.includes(d));
    
    console.log("🔍 [settings] Все цифры выбраны в Просто?", allSelected);
    console.log("🔍 [settings] Текущие цифры в Просто:", currentSimpleDigits);
    
    if (!allSelected) {
      console.log("🔄 [settings] Восстановление всех цифр 1-9 в блоке 'Просто'");
      updateSettings({
        blocks: {
          ...settingsState.blocks,
          simple: {
            ...settingsState.blocks.simple,
            digits: allSimpleDigits
          }
        }
      });
      // Обновляем локальную копию для правильного рендера
      settingsState.blocks.simple.digits = allSimpleDigits;
      console.log("✅ [settings] Цифры обновлены:", settingsState.blocks.simple.digits);
    } else {
      console.log("✅ [settings] Все цифры уже выбраны в Просто");
    }
  } else {
    console.log("📘 [settings] Братья не активны, Просто остается без изменений");
  }

  const form = document.createElement("form");
  form.className = "form settings-form";

  const baseGrid = document.createElement("div");
  baseGrid.className = "settings-grid";

// === Варианты времени (с локализацией) ===
const lang = state?.lang || document.documentElement.lang || "ru";

const labels = {
  ru: {
    none: "Отключено",
    sec: "сек",
    min: "минута",
    min_s: "мин",
    min_pl: "минут",
  },
  ua: {
    none: "Вимкнено",
    sec: "сек",
    min: "хвилина",
    min_s: "хв",
    min_pl: "хвилин",
  },
  en: {
    none: "Disabled",
    sec: "sec",
    min: "minute",
    min_s: "min",
    min_pl: "minutes",
  },
  es: {
    none: "Desactivado",
    sec: "seg",
    min: "minuto",
    min_s: "min",
    min_pl: "minutos",
  },
};

const L = labels[lang] || labels.ru;

const timeOptions = [
  { value: "none", label: L.none },
  { value: "10 сек", label: "10 " + L.sec },
  { value: "20 сек", label: "20 " + L.sec },
  { value: "30 сек", label: "30 " + L.sec },
  { value: "40 сек", label: "40 " + L.sec },
  { value: "50 сек", label: "50 " + L.sec },
  { value: "1:00", label: "1 " + L.min },
  { value: "1:30", label: "1 " + L.min + " 30 " + L.sec },
  { value: "2:00", label: "2 " + L.min_pl },
  { value: "2:30", label: "2 " + L.min + " 30 " + L.sec },
  { value: "3:00", label: "3 " + L.min_pl },
  { value: "3:30", label: "3 " + L.min + " 30 " + L.sec },
  { value: "4:00", label: "4 " + L.min_pl },
  { value: "4:30", label: "4 " + L.min + " 30 " + L.sec },
  { value: "5:00", label: "5 " + L.min_pl },
  { value: "6:00", label: "6 " + L.min_pl },
  { value: "7:00", label: "7 " + L.min_pl },
  { value: "8:00", label: "8 " + L.min_pl },
  { value: "9:00", label: "9 " + L.min_pl },
  { value: "10:00", label: "10 " + L.min_pl },
];

  const modeRow = createFormRow(t("settings.modeLabel"));
  modeRow.control.appendChild(
    createSelect(t("settings.modeOptions"), settingsState.mode, (value) => {
      updateSettings({ mode: value });
    })
  );
  baseGrid.appendChild(modeRow.row);

  const digitsRow = createFormRow(t("settings.digitsLabel"));
  digitsRow.control.appendChild(
    createSelect(t("settings.digitsOptions"), settingsState.digits, (value) => {
      updateSettings({ digits: value });
    })
  );
  baseGrid.appendChild(digitsRow.row);

  const combineRow = createFormRow(t("settings.combineLabel"));
  combineRow.control.appendChild(
    createCheckbox("", settingsState.combineLevels, (checked) => {
      updateSettings({ combineLevels: checked });
    }, "settings-checkbox settings-checkbox--switch")
  );
  baseGrid.appendChild(combineRow.row);

  const actionsRow = createFormRow(t("settings.actions.label"));
  actionsRow.control.appendChild(
    createCounter({
      count: settingsState.actions.count,
      infinite: settingsState.actions.infinite,
      infinityLabel: t("settings.actions.infinityLabel"),
      onUpdate: ({ count, infinite }) => {
        const current = state.settings.actions;
        updateSettings({ actions: { ...current, count, infinite } });
      }
    })
  );
  baseGrid.appendChild(actionsRow.row);

  const examplesRow = createFormRow(t("settings.examples.label"));
  examplesRow.control.appendChild(
    createCounter({
      count: settingsState.examples.count,
      infinite: settingsState.examples.infinite,
      infinityLabel: t("settings.examples.infinityLabel"),
      onUpdate: ({ count, infinite }) => {
        const current = state.settings.examples;
        updateSettings({ examples: { ...current, count, infinite } });
      }
    })
  );
  baseGrid.appendChild(examplesRow.row);

// === Ограничение времени ===
const timeRow = createFormRow(t("settings.timeLabel"));

// ✅ Новая строка — если значение не задано, ставим "none"
const initialTimeLimit = settingsState.timeLimit || "none";

timeRow.control.appendChild(
  createSelect(timeOptions, initialTimeLimit, (value) => {
    const timeLimitEnabled = value !== "none";
    const timePerExampleMs = parseTimeToMs(value);
    updateSettings({
      timeLimit: value,
      timeLimitEnabled,
      timePerExampleMs
    });
  })
);
baseGrid.appendChild(timeRow.row);

  // === Скорость показа ===
  const speedRow = createFormRow(t("settings.speedLabel"));
  speedRow.control.appendChild(
    createSelect(t("settings.speedOptions"), settingsState.speed, (value) => {
      const showSpeedEnabled = value !== "0";
      const showSpeedMs = parseSpeedToMs(value);
      updateSettings({
        speed: value,
        showSpeedEnabled,
        showSpeedMs,
        showSpeedPauseAfterChainMs: 600,
        bigDigitScale: 1.15,
        lockInputDuringShow: true,
        beepOnStep: false,
        beepOnTimeout: true
      });
    })
  );
  baseGrid.appendChild(speedRow.row);

  form.appendChild(baseGrid);

  const advancedSection = createSection(t("settings.advancedLabel"));
  const toggleList = document.createElement("div");
  toggleList.className = "toggle-list";

  const toggleTranslations = t("settings.toggles");
  // Фильтруем toggles: убираем "hard" (Усложнение примера)
  Object.entries(toggleTranslations)
    .filter(([key]) => key !== "hard")
    .forEach(([key, label]) => {
      const toggle = createCheckbox(label, Boolean(settingsState.toggles[key]), (checked) => {
        updateSettings({
          toggles: { ...state.settings.toggles, [key]: checked }
        });
      }, "toggle-pill");
      toggleList.appendChild(toggle);
    });
  advancedSection.appendChild(toggleList);
  form.appendChild(advancedSection);

  const blocksSection = createSection(t("settings.blocksLabel"));
  const blocksTranslations = t("settings.blocks");
  const blockOrder = ["simple", "brothers", "friends", "mix"];

  blockOrder.forEach((key) => {
    const blockCard = createBlockCard({
      key,
      title: blocksTranslations[key].title,
      digits: blocksTranslations[key].digits,
      stateBlock: settingsState.blocks[key],
      allLabel: t("settings.allLabel"),
      additionLabel: t("settings.onlyAdditionLabel"),
      subtractionLabel: t("settings.onlySubtractionLabel"),
      t,  // ✅ ИСПРАВЛЕНИЕ 2: передан параметр t
      onUpdate: (changes) => {
        updateSettings({
          blocks: {
            ...state.settings.blocks,
            [key]: { ...state.settings.blocks[key], ...changes }
          }
        });
      }
    });
    blocksSection.appendChild(blockCard);
  });
  form.appendChild(blocksSection);

  const extraGrid = document.createElement("div");
  extraGrid.className = "settings-grid";

  const transitionRow = createFormRow(t("settings.transitionLabel"));
  transitionRow.control.appendChild(
    createSelect(t("settings.transitionOptions"), settingsState.transition, (value) => {
      updateSettings({ transition: value });
    })
  );
  extraGrid.appendChild(transitionRow.row);

  const inlineRow = createFormRow(t("settings.inlineLabel"));
  inlineRow.control.appendChild(
    createCheckbox("", settingsState.inline, (checked) => {
      updateSettings({ inline: checked });
    }, "settings-checkbox settings-checkbox--switch")
  );
  extraGrid.appendChild(inlineRow.row);

  form.appendChild(extraGrid);

  const actions = document.createElement("div");
  actions.className = "form__actions";
  const submitButton = createButton({
    label: t("settings.submit"),
    onClick: () => form.requestSubmit()
  });
  actions.appendChild(submitButton);

  form.appendChild(actions);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    navigate("confirmation");
  });

  body.appendChild(form);
  container.appendChild(section);
}

// === Преобразование времени ===
function parseTimeToMs(value) {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (/^\d+$/.test(String(value))) return Number(value);

  const v = String(value).trim().toLowerCase().replace(",", ".");
  if (/^\d{1,2}:\d{2}$/.test(v)) {
    const [m, s] = v.split(":").map(n => parseInt(n, 10) || 0);
    return (m * 60 + s) * 1000;
  }
  if (v.includes("none") || v.includes("без")) return 0;

  const num = parseFloat(v.match(/[\d.]+/)?.[0] ?? "0");
  if (!isFinite(num) || num <= 0) return 0;

  if (/ms\b/.test(v)) return Math.round(num);
  if (/(sec|сек|s(?![a-z]))/.test(v)) return Math.round(num * 1000);
  if (/(min|мин)/.test(v)) return Math.round(num * 60 * 1000);

  return Math.round(num * 60 * 1000);
}

// === Преобразование скорости ===
function parseSpeedToMs(value) {
  if (value == null) return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (/^\d+$/.test(String(value))) {
    const n = Number(value);
    return n > 50 ? n : n * 1000;
  }

  const v = String(value).trim().toLowerCase().replace(",", ".");
  if (v === "0" || v.includes("без")) return 0;

  const num = parseFloat(v.match(/[\d.]+/)?.[0] ?? "0");
  if (!isFinite(num) || num <= 0) return 0;

  if (/ms/.test(v)) return Math.round(num);
  if (/(sec|сек|s(?![a-z]))/.test(v)) return Math.round(num * 1000);

  return Math.round(num * 1000);
}
