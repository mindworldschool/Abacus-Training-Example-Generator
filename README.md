# Abacus Mental Trainer 🧮

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Code Style: ESLint](https://img.shields.io/badge/code_style-ESLint-blueviolet)](https://eslint.org/)

Modern web application for training mental arithmetic skills with interactive abacus visualization. Built with vanilla JavaScript, focusing on security, performance, and user experience.

## ✨ Features

- **Multiple Training Modes**
  - Mental arithmetic (устно)
  - Visual abacus mode
  - Configurable difficulty levels

- **Interactive Learning**
  - Real-time visual feedback
  - Animated step-by-step display
  - Sound effects for engagement
  - Progress tracking with statistics

- **Flexible Configuration**
  - Customizable number ranges (1-9 digits)
  - Adjustable action counts
  - Time limits and speed controls
  - Advanced toggles for various techniques

- **Multi-language Support**
  - Ukrainian (ua)
  - Russian (ru)
  - English (en)
  - Spanish (es)

- **Modern Architecture**
  - Immutable state management
  - Event-driven communication
  - LocalStorage persistence
  - No external dependencies

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for development)
- Modern web browser with ES6+ support

### Installation

```bash
# Clone the repository
git clone https://github.com/igcadegi-oss/abacus-Cloude-2.git
cd abacus-Cloude-2

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
abacus-Cloude-2/
├── core/                   # Core functionality
│   ├── i18n.js            # Internationalization
│   ├── state.js           # State management (backward compatible)
│   ├── state-new.js       # New immutable state system
│   └── utils/             # Utility modules
│       ├── constants.js   # Application constants
│       ├── events.js      # Event bus implementation
│       ├── logger.js      # Logging utility
│       └── storage.js     # LocalStorage wrapper
├── ui/                    # UI components
│   ├── components/        # Reusable components
│   │   ├── Toast.js      # Notification system
│   │   └── BigStepOverlay.js
│   ├── game.js           # Training screen
│   ├── settings.js       # Configuration screen
│   ├── confirmation.js   # Settings review
│   ├── results.js        # Results screen
│   └── helper.js         # UI utilities
├── ext/                   # Extended functionality
│   ├── trainer_ext.js    # Trainer initialization
│   ├── trainer_logic.js  # Core training logic
│   ├── components/       # Trainer components
│   └── core/            # Generator and rules
├── js/utils/             # JavaScript utilities
│   ├── timer.js         # Timer functionality
│   └── sound.js         # Audio management
├── i18n/                # Translation files
├── assets/              # Static assets
├── styles.css           # Global styles
├── main.js             # Application entry point
└── index.html          # HTML template
```

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite 5
- **Code Quality**: ESLint
- **Testing**: Vitest
- **State Management**: Custom immutable store
- **Event System**: Custom EventBus

## 🔐 Security Features

- ✅ XSS Prevention (no innerHTML with user data)
- ✅ Type-safe event communication
- ✅ Immutable state management
- ✅ Input validation and sanitization
- ✅ Secure error handling

## 📖 Architecture Highlights

### State Management

```javascript
// New immutable state system
import { getState, setState, subscribeToState } from './core/state-new.js';

// Get current state (frozen copy)
const state = getState();

// Update state with automatic persistence
setState({ settings: newSettings }, true);

// Subscribe to changes
const unsubscribe = subscribeToState(({ current, previous }) => {
  console.log('State changed:', current);
});
```

### Event System

```javascript
// Type-safe event communication
import { eventBus, EVENTS } from './core/utils/events.js';

// Emit event
eventBus.emit(EVENTS.TRAINING_FINISH, { correct: 10, total: 10 });

// Subscribe to event
const unsubscribe = eventBus.on(EVENTS.TRAINING_FINISH, (data) => {
  console.log('Training finished:', data);
});
```

### Logging

```javascript
// Context-aware logging with levels
import { logger } from './core/utils/logger.js';

logger.debug('Context', 'Debug message');  // Development only
logger.info('Context', 'Info message');    // Development only
logger.warn('Context', 'Warning message'); // Always shown
logger.error('Context', 'Error message');  // Always shown
```

### Notifications

```javascript
// Non-blocking toast notifications
import toast from './ui/components/Toast.js';

toast.success('Правильно!');
toast.error('Ошибка');
toast.warning('Предупреждение');
toast.info('Информация');
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in watch mode
npm test -- --watch
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint code with ESLint |
| `npm run lint:fix` | Fix linting errors |
| `npm test` | Run tests |
| `npm run test:ui` | Run tests with UI |

## 🎨 Customization

### Adding New Languages

1. Create translation file in `i18n/`:
```javascript
// i18n/fr.json
{
  "language": "Français",
  "header": {
    "title": "Abacuc Mental",
    "tagline": "Entraîneur d'arithmétique mentale"
  }
  // ... more translations
}
```

2. Add to `i18n/dictionaries.js`:
```javascript
export const LANG_CODES = ['ua', 'ru', 'en', 'es', 'fr'];
```

### Theming

Modify CSS variables in `styles.css`:
```css
:root {
  --color-primary: #ff7c00;
  --color-primary-dark: #e06600;
  --color-background: #fdf8f3;
  --color-text: #333333;
  /* ... more variables */
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Build process or auxiliary tool changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **MindWorld School** - Original concept and design
- **Claude Code** - AI-assisted refactoring and improvements

## 📞 Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/igcadegi-oss/abacus-Cloude-2/issues) page.

---

Made with ❤️ by MindWorld School | Enhanced with [Claude Code](https://claude.com/claude-code)
