// ext/components/Abacus.js - Интерактивный соробан

/**
 * Abacus - компонент интерактивного абакуса (соробана)
 * Структура: каждая стойка имеет 1 верхнюю бусину (Heaven, 5) и 4 нижние (Earth, 1+1+1+1)
 * Формула значения: S = 5 * U + L, где U = верхняя (0 или 1), L = нижние (0-4)
 */
export class Abacus {
  /**
   * @param {HTMLElement} container - Контейнер для монтирования
   * @param {number} digits - Разрядность (количество стоек = digits + 1)
   */
  constructor(container, digits = 1) {
    this.container = container;
    this.digits = digits;
    this.columns = digits + 1; // ВАЖНО: всегда на 1 больше разрядности!
    
    // Состояние каждой стойки: { upper: 0|1, lower: 0-4 }
    this.state = Array.from({ length: this.columns }, () => ({
      upper: 0, // 0 = внизу (не активна), 1 = вверху (активна)
      lower: 0  // 0-4 бусины снизу активны
    }));
    
    this.render();
  }
  
  /**
   * Рендеринг абакуса
   */
  render() {
    this.container.innerHTML = '';
    this.container.className = 'abacus';
    
    // Создаём стойки
    for (let colIndex = 0; colIndex < this.columns; colIndex++) {
      const column = this.createColumn(colIndex);
      this.container.appendChild(column);
    }
    
    console.log(`🧮 Абакус отрендерен: ${this.columns} стоек (разрядность ${this.digits})`);
  }
  
  /**
   * Создание одной стойки
   * @param {number} colIndex - Индекс стойки
   * @returns {HTMLElement}
   */
  createColumn(colIndex) {
    const col = document.createElement('div');
    col.className = 'abacus__column';
    col.dataset.col = colIndex;
    
    // Верхняя часть (Heaven bead)
    const upperSection = document.createElement('div');
    upperSection.className = 'abacus__upper';
    
    const upperBead = document.createElement('div');
    upperBead.className = 'bead bead--upper';
    upperBead.dataset.col = colIndex;
    upperBead.dataset.type = 'upper';
    upperBead.textContent = '5';
    
    if (this.state[colIndex].upper === 1) {
      upperBead.classList.add('bead--engaged');
    }
    
    upperBead.addEventListener('click', () => this.toggleUpper(colIndex));
    upperSection.appendChild(upperBead);
    
    // Разделитель (bar)
    const bar = document.createElement('div');
    bar.className = 'abacus__bar';
    
    // Нижняя часть (Earth beads)
    const lowerSection = document.createElement('div');
    lowerSection.className = 'abacus__lower';
    
    for (let i = 0; i < 4; i++) {
      const lowerBead = document.createElement('div');
      lowerBead.className = 'bead bead--lower';
      lowerBead.dataset.col = colIndex;
      lowerBead.dataset.index = i;
      lowerBead.textContent = '1';
      
      // Проверяем, активна ли эта бусина
      if (i < this.state[colIndex].lower) {
        lowerBead.classList.add('bead--engaged');
      }
      
      lowerBead.addEventListener('click', () => this.toggleLower(colIndex, i));
      lowerSection.appendChild(lowerBead);
    }
    
    col.append(upperSection, bar, lowerSection);
    return col;
  }
  
  /**
   * Переключение верхней бусины
   * @param {number} colIndex - Индекс стойки
   */
  toggleUpper(colIndex) {
    this.state[colIndex].upper = this.state[colIndex].upper === 0 ? 1 : 0;
    this.updateColumn(colIndex);
    console.log(`🧮 Стойка ${colIndex}: верхняя = ${this.state[colIndex].upper}`);
  }
  
  /**
   * Переключение нижних бусин
   * @param {number} colIndex - Индекс стойки
   * @param {number} beadIndex - Индекс бусины (0-3)
   */
  toggleLower(colIndex, beadIndex) {
    const current = this.state[colIndex].lower;
    
    // Если кликнули на уже активную бусину -> сбрасываем всё до неё
    if (beadIndex < current) {
      this.state[colIndex].lower = beadIndex;
    } else {
      // Если кликнули на неактивную -> активируем до неё включительно
      this.state[colIndex].lower = beadIndex + 1;
    }
    
    this.updateColumn(colIndex);
    console.log(`🧮 Стойка ${colIndex}: нижние = ${this.state[colIndex].lower}`);
  }
  
  /**
   * Обновление визуала одной стойки
   * @param {number} colIndex
   */
  updateColumn(colIndex) {
    const column = this.container.querySelector(`.abacus__column[data-col="${colIndex}"]`);
    if (!column) return;
    
    // Обновляем верхнюю бусину
    const upperBead = column.querySelector('.bead--upper');
    if (this.state[colIndex].upper === 1) {
      upperBead.classList.add('bead--engaged');
    } else {
      upperBead.classList.remove('bead--engaged');
    }
    
    // Обновляем нижние бусины
    const lowerBeads = column.querySelectorAll('.bead--lower');
    lowerBeads.forEach((bead, index) => {
      if (index < this.state[colIndex].lower) {
        bead.classList.add('bead--engaged');
      } else {
        bead.classList.remove('bead--engaged');
      }
    });
  }
  
  /**
   * Получить значение стойки (S = 5*U + L)
   * @param {number} colIndex
   * @returns {number}
   */
  getColumnValue(colIndex) {
    const { upper, lower } = this.state[colIndex];
    return 5 * upper + lower;
  }
  
  /**
   * Получить полное число с абакуса (читаем справа налево)
   * @returns {number}
   */
  getValue() {
    let result = 0;
    for (let i = 0; i < this.columns; i++) {
      const power = this.columns - 1 - i; // позиция разряда
      result += this.getColumnValue(i) * Math.pow(10, power);
    }
    return result;
  }
  
  /**
   * Установить значение на абакусе
   * @param {number} value - Число для отображения
   */
  setValue(value) {
    const digits = String(value).padStart(this.columns, '0').split('');
    
    digits.forEach((digit, index) => {
      const num = parseInt(digit, 10);
      
      // Раскладываем на 5*U + L
      if (num >= 5) {
        this.state[index].upper = 1;
        this.state[index].lower = num - 5;
      } else {
        this.state[index].upper = 0;
        this.state[index].lower = num;
      }
      
      this.updateColumn(index);
    });
    
    console.log(`🧮 Установлено значение: ${value}`);
  }
  
  /**
   * Сброс абакуса (все бусины в исходное положение)
   */
  reset() {
    this.state.forEach((col, index) => {
      col.upper = 0;
      col.lower = 0;
      this.updateColumn(index);
    });
    console.log('🧮 Абакус сброшен');
  }
}
