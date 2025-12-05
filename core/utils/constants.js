/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values
 */

// UI Constants
export const UI = {
  BIG_DIGIT_SCALE: 1.15,
  PAUSE_AFTER_CHAIN_MS: 600,
  DELAY_BETWEEN_STEPS_MS: 40,
  TRANSITION_DELAY_MS: 500,
  TIMEOUT_DELAY_MS: 800
};

// Timer Constants
export const TIMER = {
  MS_THRESHOLD: 10000, // Numbers >= 10000 are treated as milliseconds
  UPDATE_INTERVAL_MS: 100,
  MIN_PLAYBACK_RATE: 0.5,
  MAX_PLAYBACK_RATE: 2.0
};

// Font Size Calculation
export const FONT_SIZE = {
  BASE_SIZE: 120,
  MIN_SIZE: 35,
  ACTION_PENALTY: 1.8,
  DIGIT_PENALTY: 3
};

// Audio Constants
export const AUDIO = {
  DEFAULT_VOLUME: 1,
  MIN_VOLUME: 0,
  MAX_VOLUME: 1
};

// Storage Keys
export const STORAGE_KEYS = {
  SETTINGS: 'abacus-settings',
  LANGUAGE: 'abacus-language',
  RESULTS_HISTORY: 'abacus-results-history'
};

// Default Values
export const DEFAULTS = {
  LANGUAGE: 'ua',
  ROUTE: 'settings',
  EXAMPLES_COUNT: 10,
  ACTIONS_MIN: 2,
  ACTIONS_MAX: 4
};

// Event Names
export const EVENTS = {
  LANGUAGE_CHANGE: 'language:change',
  ROUTE_CHANGE: 'route:change',
  SETTINGS_UPDATE: 'settings:update',
  TRAINING_FINISH: 'training:finish',
  STATE_CHANGE: 'state:change'
};
