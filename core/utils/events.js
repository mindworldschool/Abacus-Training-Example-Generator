/**
 * Event emitter for application-wide events
 * Replaces global window.* communication with type-safe events
 */

import { EVENTS } from './constants.js';

class EventBus {
  constructor() {
    this.target = new EventTarget();
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Event name from EVENTS constants
   * @param {Function} handler - Event handler function
   * @returns {Function} Unsubscribe function
   */
  on(eventName, handler) {
    const wrappedHandler = (event) => handler(event.detail);

    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Map());
    }

    this.listeners.get(eventName).set(handler, wrappedHandler);
    this.target.addEventListener(eventName, wrappedHandler);

    // Return unsubscribe function
    return () => this.off(eventName, handler);
  }

  /**
   * Subscribe to an event (one-time only)
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler function
   * @returns {Function} Unsubscribe function
   */
  once(eventName, handler) {
    const unsubscribe = this.on(eventName, (data) => {
      handler(data);
      unsubscribe();
    });
    return unsubscribe;
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler function
   */
  off(eventName, handler) {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) return;

    const wrappedHandler = eventListeners.get(handler);
    if (wrappedHandler) {
      this.target.removeEventListener(eventName, wrappedHandler);
      eventListeners.delete(handler);

      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} eventName - Event name
   * @param {any} data - Event data
   */
  emit(eventName, data = null) {
    const event = new CustomEvent(eventName, { detail: data });
    this.target.dispatchEvent(event);
  }

  /**
   * Remove all listeners for a specific event or all events
   * @param {string} [eventName] - Event name (optional)
   */
  clear(eventName = null) {
    if (eventName) {
      const eventListeners = this.listeners.get(eventName);
      if (eventListeners) {
        eventListeners.forEach((wrappedHandler) => {
          this.target.removeEventListener(eventName, wrappedHandler);
        });
        this.listeners.delete(eventName);
      }
    } else {
      this.listeners.forEach((handlers, name) => {
        handlers.forEach((wrappedHandler) => {
          this.target.removeEventListener(name, wrappedHandler);
        });
      });
      this.listeners.clear();
    }
  }

  /**
   * Get count of listeners for an event
   * @param {string} eventName - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(eventName) {
    return this.listeners.get(eventName)?.size || 0;
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Convenience exports
export const { on, once, off, emit, clear } = eventBus;

// Re-export EVENTS for convenience
export { EVENTS };

export default eventBus;
