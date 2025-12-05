/**
 * State management with backward compatibility
 * Uses improved state-new.js under the hood
 */

import {
  getState,
  setState,
  setRoute as _setRoute,
  setLanguagePreference as _setLanguagePreference,
  updateSettings as _updateSettings,
  setResults as _setResults,
  resetResults as _resetResults,
  subscribeToState,
  subscribeToRoute,
  subscribeToSettings
} from './state-new.js';
import { storage } from './utils/storage.js';
import { DEFAULTS } from './utils/constants.js';

// Load persisted state on initialization
const persistedSettings = storage.loadSettings();
const persistedLanguage = storage.loadLanguage(DEFAULTS.LANGUAGE);

const defaultState = {
  route: DEFAULTS.ROUTE,
  language: persistedLanguage || DEFAULTS.LANGUAGE,
  settings: persistedSettings || {
    mode: "mental",
    digits: "1",
    combineLevels: false,
    actions: { count: 1, infinite: false },
    examples: { count: 2, infinite: false },
    timeLimit: "none",
    speed: "none",
    toggles: {
      hard: false,
      dictation: false,
      fractions: false,
      mirror: false,
      round: false,
      positive: false,
      negative: false,
      opposite: false
    },
    blocks: {
      simple: {
        digits: ["1", "2", "3", "4"],
        onlyAddition: false,
        onlySubtraction: false
      },
      brothers: {
        digits: [],
        onlyAddition: false,
        onlySubtraction: false
      },
      friends: {
        digits: [],
        onlyAddition: false,
        onlySubtraction: false
      },
      mix: {
        digits: [],
        onlyAddition: false,
        onlySubtraction: false
      }
    },
    transition: "none",
    inline: false
  },
  results: {
    success: 0,
    total: 0,
    wrongExamples: [] // Массив неправильно решенных примеров
  }
};

// Initialize state if not already set
if (persistedSettings) {
  setState({ settings: persistedSettings }, false);
}
if (persistedLanguage) {
  setState({ language: persistedLanguage }, false);
}

// Backward-compatible proxy for direct state access
export const state = new Proxy(defaultState, {
  get(target, prop) {
    const currentState = getState();
    return currentState[prop] !== undefined ? currentState[prop] : target[prop];
  },
  set(target, prop, value) {
    // Update through proper setState
    setState({ [prop]: value }, prop === 'settings' || prop === 'language');
    target[prop] = value;
    return true;
  }
});

export function setRoute(route) {
  _setRoute(route);
}

export function setLanguagePreference(language) {
  _setLanguagePreference(language);
}

export function updateSettings(partial) {
  _updateSettings(partial);
}

export function setResults(results) {
  _setResults(results);
}

export function resetResults() {
  _resetResults();
}

// Export new functionality for modern usage
export {
  getState,
  setState,
  subscribeToState,
  subscribeToRoute,
  subscribeToSettings
};
