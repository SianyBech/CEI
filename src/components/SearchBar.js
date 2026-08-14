window.CerneApp.SearchBar = {
  render(currentQuery, currentViewMode, categories, tags, onSearchChange, onFilterChange, onViewModeChange, onDateFilterChange, onClearFilters) {
    const escapeHtml = (str) => String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0.75rem';
    container.style.width = '100%';

    const categoriesOptions = Array.isArray(categories)
      ? categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')
      : '';

    const tagsOptions = Array.isArray(tags)
      ? tags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join('')
      : '';

   // Search input, Date Range Picker and layout toggler row (Primeira linha alinhada)
    const searchRow = document.createElement('div');
    searchRow.className = 'search-filter-row';
    searchRow.innerHTML = `
      <div class="search-bar-container">
        <div class="search-input-wrapper">
          <i data-lucide="search" class="search-icon" style="width: 18px; height: 18px;"></i>
          <input type="text" class="search-input" id="search-input" placeholder="Pesquisar por evento, categoria, tags, responsável ou nome de arquivo..." value="${escapeHtml(currentQuery)}">
        </div>
      </div>

      <!-- NOVO LOCAL: Período da Evidência colocado ao lado da barra de pesquisa -->
      <div class="header-date-filter-wrapper">
        <div class="custom-date-range-container">

        <span class="date-separator">Período</span>

          <!-- Campo De -->
          <div class="date-input-field" id="date-from-trigger">
            <i data-lucide="calendar"></i>
            <span id="date-from-text" class="placeholder">De</span>
          </div>

          <span class="date-separator">Até</span>

          <!-- Campo Até -->
          <div class="date-input-field" id="date-to-trigger">
            <i data-lucide="calendar"></i>
            <span id="date-to-text" class="placeholder">Até</span>
          </div>

          <!-- Popover Unificado do Calendário -->
          <div class="calendar-popover" id="calendar-popover">
            <div class="calendar-header">
              <button type="button" class="calendar-nav-btn" id="cal-prev-btn">&lt;</button>
              <div class="calendar-title-selectors">
                <button type="button" class="calendar-select-btn" id="cal-month-selector">
                  <span id="cal-month-label">Mês</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                </button>
                <button type="button" class="calendar-select-btn" id="cal-year-selector">
                  <span id="cal-year-label">Ano</span>
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                </button>
              </div>
              <button type="button" class="calendar-nav-btn" id="cal-next-btn">&gt;</button>
            </div>

            <!-- Conteúdo Dinâmico do Calendário (Dias / Meses / Anos) -->
            <div id="calendar-body"></div>

            <div class="calendar-footer">
              <button type="button" class="calendar-clear-btn" id="cal-clear-btn">Limpar datas</button>
              <button type="button" class="btn btn-primary" id="cal-apply-btn" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">OK</button>
            </div>
          </div>
        </div>
      </div>

      <div class="view-toggle-group">
        <button class="view-toggle-btn ${currentViewMode === 'table' ? 'active' : ''}" id="toggle-table" title="Visualizar Tabela">
          <i data-lucide="list" style="width: 18px; height: 18px;"></i>
        </button>
        <button class="view-toggle-btn ${currentViewMode === 'grid' ? 'active' : ''}" id="toggle-grid" title="Visualizar Cards">
          <i data-lucide="grid" style="width: 18px; height: 18px;"></i>
        </button>
      </div>
    `;

    // 2. Advanced filters row
    const filtersRow = document.createElement('div');
    filtersRow.className = 'filters-panel';
    filtersRow.innerHTML = `
      <div class="filters-panel-header">
        <div class="filters-panel-title">
          <i data-lucide="filter" class="filters-panel-icon"></i>
          <span>Filtros</span>
        </div>
        <button type="button" id="clear-date-filters" class="filters-panel-clear-btn">Limpar filtros
        <i data-lucide="filter-x" style="width: 14px; height: 14px;"></i>
        </button>
      </div>

      <div class="filters-panel-grid">
        <div class="filter-group">
          <span class="filter-label">Tipo</span>
          <select class="filter-select" id="filter-tipo">
            <option value="todos">Todos os tipos</option>
            <option value="pdf">PDF</option>
            <option value="imagem">Imagem</option>
            <option value="documento">Documento</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Categoria CERNE</span>
          <select class="filter-select" id="filter-categoria">
            <option value="todos">Todas as categorias</option>
            ${categoriesOptions}
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Responsável</span>
          <select class="filter-select" id="filter-responsavel">
            <option value="todos">Todos os responsáveis</option>
          </select>
        </div>

        <div class="filter-group">
          <span class="filter-label">Tag</span>
          <select class="filter-select" id="filter-tag">
            <option value="todos">Todas as tags</option>
            ${tagsOptions}
          </select>
        </div>

    `;

    container.appendChild(searchRow);
    container.appendChild(filtersRow);

  /*  // 3. Dashboard Cards (Com aspas corrigidas no counter-novas-mes)
    const cardsRow = document.createElement('div');
    cardsRow.className = 'dashboard-cards';
    cardsRow.innerHTML = `
      <div class="dashboard-card">
        <div class="dashboard-card-icon" style="color: var(--success);">
          <i data-lucide="file-text"></i>
        </div>
        <div>
          <div class="dashboard-card-counter" id="counter-total">0</div>
          <div class="dashboard-card-title">Evidências</div>
          <div class="dashboard-card-subtitle">Total cadastradas</div>
        </div>
      </div>
      <div class="dashboard-card">
        <div class="dashboard-card-icon" style="color: var(--success);">
          <i data-lucide="folder"></i>
        </div>
        <div>
          <div class="dashboard-card-counter" id="counter-categorias">0</div>
          <div class="dashboard-card-title">Categorias</div>
          <div class="dashboard-card-subtitle">Organizadas</div>
        </div>
      </div>
      <div class="dashboard-card">
        <div class="dashboard-card-icon" style="color: var(--success);">
          <i data-lucide="users"></i>
        </div>
        <div>
          <div class="dashboard-card-counter" id="counter-responsaveis">0</div>
          <div class="dashboard-card-title">Responsáveis</div>
          <div class="dashboard-card-subtitle">Ativos</div>
        </div>
      </div>
      <div class="dashboard-card">
        <div class="dashboard-card-icon" style="color: var(--success);">
          <i data-lucide="tag"></i>
        </div>
        <div>
          <div class="dashboard-card-counter" id="counter-tags">0</div>
          <div class="dashboard-card-title">Tags</div>
          <div class="dashboard-card-subtitle">Em uso</div>
        </div>
      </div>
      <div class="dashboard-card">
        <div class="dashboard-card-icon" style="color: var(--success);">
          <i data-lucide="calendar"></i>
        </div>
        <div>
          <div class="dashboard-card-counter" id="counter-novas-mes">0</div>
          <div class="dashboard-card-title">Este mês</div>
          <div class="dashboard-card-subtitle">Adicionadas</div>
        </div> 
      </div> 
    `; 

    container.appendChild(cardsRow); */

    // 4. Event listeners do Search Input e Toggles de Visualização
    const input = searchRow.querySelector('#search-input');
    input.addEventListener('input', (e) => onSearchChange(e.target.value));

    searchRow.querySelector('#toggle-table').addEventListener('click', () => onViewModeChange('table'));
    searchRow.querySelector('#toggle-grid').addEventListener('click', () => onViewModeChange('grid'));

    // Listeners dos selects simples (Tipo, Categoria, Responsável, Tag)
    filtersRow.querySelectorAll('.filter-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const filterId = e.target.id.replace('filter-', '');
        onFilterChange(filterId, e.target.value);
      });
    });

    // 5. Estado e Manipulação do Calendário estilo Cia Aérea
    let activeInputTarget = 'from'; // 'from' ou 'to'
    let selectedFromDate = null;
    let selectedToDate = null;

    const today = new Date();
    let viewMonth = today.getMonth();
    let viewYear = today.getFullYear();
    let pickerMode = 'days'; // 'days', 'months', 'years'

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

const popover = searchRow.querySelector('#calendar-popover');
    const dateFromTrigger = searchRow.querySelector('#date-from-trigger');
    const dateToTrigger = searchRow.querySelector('#date-to-trigger');
    const dateFromText = searchRow.querySelector('#date-from-text');
    const dateToText = searchRow.querySelector('#date-to-text');
    const calendarBody = searchRow.querySelector('#calendar-body');
    const monthLabel = searchRow.querySelector('#cal-month-label');
    const yearLabel = searchRow.querySelector('#cal-year-label');

    function formatDateBR(dateObj) {
      if (!dateObj) return '';
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}/${month}/${year}`;
    }

    function updateTriggerTexts() {
      if (selectedFromDate) {
        dateFromText.textContent = formatDateBR(selectedFromDate);
        dateFromText.classList.remove('placeholder');
      } else {
        dateFromText.textContent = 'De';
        dateFromText.classList.add('placeholder');
      }

      if (selectedToDate) {
        dateToText.textContent = formatDateBR(selectedToDate);
        dateToText.classList.remove('placeholder');
      } else {
        dateToText.textContent = 'Até';
        dateToText.classList.add('placeholder');
      }
    }

    function notifyDateFilterChange() {
      updateTriggerTexts();

      if (typeof onDateFilterChange === 'function') {
        onDateFilterChange({
          dayFrom: selectedFromDate ? String(selectedFromDate.getDate()).padStart(2, '0') : '',
          monthFrom: selectedFromDate ? String(selectedFromDate.getMonth() + 1) : '',
          yearFrom: selectedFromDate ? String(selectedFromDate.getFullYear()) : '',
          dayTo: selectedToDate ? String(selectedToDate.getDate()).padStart(2, '0') : '',
          monthTo: selectedToDate ? String(selectedToDate.getMonth() + 1) : '',
          yearTo: selectedToDate ? String(selectedToDate.getFullYear()) : ''
        });
      }
    }

    function renderCalendar() {
      monthLabel.textContent = monthNames[viewMonth];
      yearLabel.textContent = viewYear;
      calendarBody.innerHTML = '';

      if (pickerMode === 'months') {
        const monthGrid = document.createElement('div');
        monthGrid.className = 'calendar-picker-view';
        monthNames.forEach((name, idx) => {
          const item = document.createElement('div');
          item.className = `calendar-picker-item ${idx === viewMonth ? 'active' : ''}`;
          item.textContent = name.substring(0, 3);
          item.addEventListener('click', () => {
            viewMonth = idx;
            pickerMode = 'days';
            renderCalendar();
          });
          monthGrid.appendChild(item);
        });
        calendarBody.appendChild(monthGrid);
        return;
      }

      if (pickerMode === 'years') {
        const yearGrid = document.createElement('div');
        yearGrid.className = 'calendar-picker-view';
        const startYear = viewYear - 10;
        for (let y = startYear; y <= startYear + 19; y++) {
          const item = document.createElement('div');
          item.className = `calendar-picker-item ${y === viewYear ? 'active' : ''}`;
          item.textContent = y;
          item.addEventListener('click', () => {
            viewYear = y;
            pickerMode = 'days';
            renderCalendar();
          });
          yearGrid.appendChild(item);
        }
        calendarBody.appendChild(yearGrid);
        return;
      }

      // Grade de Dias
      const grid = document.createElement('div');
      grid.className = 'calendar-grid';

      ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(dayName => {
        const dh = document.createElement('div');
        dh.className = 'calendar-day-header';
        dh.textContent = dayName;
        grid.appendChild(dh);
      });

      const firstDayIdx = new Date(viewYear, viewMonth, 1).getDay();
      const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

      for (let i = 0; i < firstDayIdx; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day empty';
        grid.appendChild(emptyCell);
      }

      for (let day = 1; day <= totalDays; day++) {
        const dayBtn = document.createElement('button');
        dayBtn.type = 'button';
        dayBtn.className = 'calendar-day';
        dayBtn.textContent = day;

        const currentDayDate = new Date(viewYear, viewMonth, day);

        const isFrom = selectedFromDate && currentDayDate.getTime() === selectedFromDate.getTime();
        const isTo = selectedToDate && currentDayDate.getTime() === selectedToDate.getTime();
        const isInRange = selectedFromDate && selectedToDate && currentDayDate > selectedFromDate && currentDayDate < selectedToDate;

        if (isFrom || isTo) dayBtn.classList.add('selected');
        if (isInRange) dayBtn.classList.add('in-range');

        dayBtn.addEventListener('click', () => {
          if (activeInputTarget === 'from') {
            selectedFromDate = currentDayDate;
            if (selectedToDate && selectedToDate < selectedFromDate) {
              selectedToDate = null;
            }
            activeInputTarget = 'to';
            dateFromTrigger.classList.remove('active');
            dateToTrigger.classList.add('active');
          } else {
            if (selectedFromDate && currentDayDate < selectedFromDate) {
              selectedFromDate = currentDayDate;
              selectedToDate = null;
            } else {
              selectedToDate = currentDayDate;
            }
          }

          renderCalendar();
          notifyDateFilterChange();
        });

        grid.appendChild(dayBtn);
      }

      calendarBody.appendChild(grid);
      if (window.lucide) lucide.createIcons();
    }

    function openPopover(targetField) {
      activeInputTarget = targetField;
      dateFromTrigger.classList.toggle('active', targetField === 'from');
      dateToTrigger.classList.toggle('active', targetField === 'to');

      const focusDate = (targetField === 'from' ? selectedFromDate : selectedToDate) || selectedFromDate || new Date();
      viewMonth = focusDate.getMonth();
      viewYear = focusDate.getFullYear();
      pickerMode = 'days';

      popover.classList.add('open');
      renderCalendar();
    }

    function closePopover() {
      popover.classList.remove('open');
      dateFromTrigger.classList.remove('active');
      dateToTrigger.classList.remove('active');
    }

    dateFromTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openPopover('from');
    });

    dateToTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      openPopover('to');
    });

    searchRow.querySelector('#cal-month-selector').addEventListener('click', (e) => {
      e.stopPropagation();
      pickerMode = pickerMode === 'months' ? 'days' : 'months';
      renderCalendar();
    });

    searchRow.querySelector('#cal-year-selector').addEventListener('click', (e) => {
      e.stopPropagation();
      pickerMode = pickerMode === 'years' ? 'days' : 'years';
      renderCalendar();
    });

    searchRow.querySelector('#cal-prev-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (viewMonth === 0) {
        viewMonth = 11;
        viewYear--;
      } else {
        viewMonth--;
      }
      renderCalendar();
    });

    searchRow.querySelector('#cal-next-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (viewMonth === 11) {
        viewMonth = 0;
        viewYear++;
      } else {
        viewMonth++;
      }
      renderCalendar();
    });

    const resetCalendarDates = () => {
      selectedFromDate = null;
      selectedToDate = null;
      notifyDateFilterChange();
      renderCalendar();
    };

    searchRow.querySelector('#cal-clear-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      resetCalendarDates();
    });

    searchRow.querySelector('#cal-apply-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      closePopover();
    });

    // 6. Listener global do botão "Limpar Filtros" principal
    const clearFiltersBtn = filtersRow.querySelector('.filters-panel-clear-btn');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        const searchInput = searchRow.querySelector('#search-input');
        if (searchInput) searchInput.value = '';

        filtersRow.querySelectorAll('.filter-select').forEach(select => {
          select.value = 'todos';
        });

        resetCalendarDates();
        closePopover();

        if (typeof onClearFilters === 'function') {
          onClearFilters();
        }
      });
    }

    // Fechar popover ao clicar fora
    document.addEventListener('click', (e) => {
      if (!popover.contains(e.target) && !dateFromTrigger.contains(e.target) && !dateToTrigger.contains(e.target)) {
        closePopover();
      }
    });

    popover.addEventListener('click', (e) => e.stopPropagation());

    return container;
  }
};