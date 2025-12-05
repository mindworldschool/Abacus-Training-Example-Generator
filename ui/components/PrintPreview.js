/**
 * Toast notification component
 * Replaces alert() with non-blocking user-friendly notifications
 */

const TOAST_DURATION = 3000;
const TOAST_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

class ToastManager {
  constructor() {
    this.container = null;
    this.activeToasts = new Set();
    this.init();
  }

  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.container);
  }

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {Object} options - Configuration options
   * @param {string} options.type - Toast type: 'info', 'success', 'warning', 'error'
   * @param {number} options.duration - Duration in ms (0 = no auto-dismiss)
   * @param {Function} options.onClose - Callback when toast is closed
   */
  show(message, options = {}) {
    const {
      type = TOAST_TYPES.INFO,
      duration = TOAST_DURATION,
      onClose = null
    } = options;

    const toast = this.createToast(message, type);
    this.container.appendChild(toast);
    this.activeToasts.add(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast--show');
    });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast, onClose);
      }, duration);
    }

    return toast;
  }

  createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');

    const icon = document.createElement('span');
    icon.className = 'toast__icon';
    icon.textContent = this.getIcon(type);

    const messageEl = document.createElement('span');
    messageEl.className = 'toast__message';
    messageEl.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast__close';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    toast.append(icon, messageEl, closeBtn);
    return toast;
  }

  getIcon(type) {
    const icons = {
      [TOAST_TYPES.INFO]: 'ℹ',
      [TOAST_TYPES.SUCCESS]: '✓',
      [TOAST_TYPES.WARNING]: '⚠',
      [TOAST_TYPES.ERROR]: '✗'
    };
    return icons[type] || icons[TOAST_TYPES.INFO];
  }

  dismiss(toast, onClose = null) {
    if (!this.activeToasts.has(toast)) return;

    toast.classList.remove('toast--show');
    toast.classList.add('toast--hide');

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.activeToasts.delete(toast);
      if (typeof onClose === 'function') {
        onClose();
      }
    }, 300);
  }

  dismissAll() {
    this.activeToasts.forEach(toast => this.dismiss(toast));
  }
}

// Singleton instance
const toastManager = new ToastManager();

// Convenience methods
export const toast = {
  info: (message, options = {}) => toastManager.show(message, { ...options, type: TOAST_TYPES.INFO }),
  success: (message, options = {}) => toastManager.show(message, { ...options, type: TOAST_TYPES.SUCCESS }),
  warning: (message, options = {}) => toastManager.show(message, { ...options, type: TOAST_TYPES.WARNING }),
  error: (message, options = {}) => toastManager.show(message, { ...options, type: TOAST_TYPES.ERROR }),
  dismissAll: () => toastManager.dismissAll()
};

export default toast;
