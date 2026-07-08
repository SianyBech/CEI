window.CerneApp.SearchBar = {
  render(currentQuery, currentViewMode, categories, tags, onSearchChange, onFilterChange, onViewModeChange, onDateFilterChange) {
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

    // Search input and layout toggler row
    const searchRow = document.createElement('div');
    searchRow.className = 'search-filter-row';
    searchRow.innerHTML = `
      <div class="search-bar-container">
        <div class="search-input-wrapper">
          <i data-lucide="search" class="search-icon" style="width: 18px; height: 18px;"></i>
          <input type="text" class="search-input" id="search-input" placeholder="Pesquisar por evento, categoria, tags, responsável ou nome de arquivo..." value="${currentQuery}">
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

    // Advanced filters row
    const filtersRow = document.createElement('div');
    filtersRow.className = 'filters-row';
    filtersRow.innerHTML = `
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

      <!-- Date filters group -->
      <div class="date-filter-group">
        <span class="date-filter-label">De</span>
        <div class="date-selector-group">
          <select class="date-select" id="filter-day-from" data-type="day">
            <option value="">Dia</option>
          </select>
          <select class="date-select" id="filter-month-from" data-type="month">
            <option value="">Mês</option>
            <option value="1">Janeiro</option>
            <option value="2">Fevereiro</option>
            <option value="3">Março</option>
            <option value="4">Abril</option>
            <option value="5">Maio</option>
            <option value="6">Junho</option>
            <option value="7">Julho</option>
            <option value="8">Agosto</option>
            <option value="9">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>
          <select class="date-select" id="filter-year-from" data-type="year">
            <option value="">Ano</option>
          </select>
        </div>
      </div>

      <div class="date-filter-group">
        <span class="date-filter-label">Até</span>
        <div class="date-selector-group">
          <select class="date-select" id="filter-day-to" data-type="day">
            <option value="">Dia</option>
          </select>
          <select class="date-select" id="filter-month-to" data-type="month">
            <option value="">Mês</option>
            <option value="1">Janeiro</option>
            <option value="2">Fevereiro</option>
            <option value="3">Março</option>
            <option value="4">Abril</option>
            <option value="5">Maio</option>
            <option value="6">Junho</option>
            <option value="7">Julho</option>
            <option value="8">Agosto</option>
            <option value="9">Setembro</option>
            <option value="10">Outubro</option>
            <option value="11">Novembro</option>
            <option value="12">Dezembro</option>
          </select>
          <select class="date-select" id="filter-year-to" data-type="year">
            <option value="">Ano</option>
          </select>
        </div>
      </div>

      <button id="clear-date-filters" class="clear-date-btn" title="Limpar filtros de data">
        <i data-lucide="x" style="width: 18px; height: 18px;"></i>
      </button>
    `;

    container.appendChild(searchRow);
    container.appendChild(filtersRow);

    // Populate year options (1900 to current year)
    function populateYears() {
      const currentYear = new Date().getFullYear();
      const yearSelects = filtersRow.querySelectorAll('select[data-type="year"]');
      
      yearSelects.forEach(select => {
        for (let year = currentYear; year >= 1900; year--) {
          const option = document.createElement('option');
          option.value = year;
          option.textContent = year;
          select.appendChild(option);
        }
      });
    }

    // Populate days based on selected month and year
    function updateDaysInMonth() {
      const daySelectsFrom = filtersRow.querySelector('#filter-day-from');
      const daySelectsTo = filtersRow.querySelector('#filter-day-to');
      const monthFromVal = filtersRow.querySelector('#filter-month-from').value;
      const yearFromVal = filtersRow.querySelector('#filter-year-from').value;
      const monthToVal = filtersRow.querySelector('#filter-month-to').value;
      const yearToVal = filtersRow.querySelector('#filter-year-to').value;

      // Calculate days for "De"
      let daysInMonthFrom = 31;
      if (monthFromVal && yearFromVal) {
        daysInMonthFrom = new Date(parseInt(yearFromVal), parseInt(monthFromVal), 0).getDate();
      }

      // Calculate days for "Até"
      let daysInMonthTo = 31;
      if (monthToVal && yearToVal) {
        daysInMonthTo = new Date(parseInt(yearToVal), parseInt(monthToVal), 0).getDate();
      }

      // Update "De" days
      const currentDayFrom = daySelectsFrom.value;
      daySelectsFrom.innerHTML = '<option value="">Dia</option>';
      for (let i = 1; i <= daysInMonthFrom; i++) {
        const option = document.createElement('option');
        option.value = String(i).padStart(2, '0');
        option.textContent = String(i).padStart(2, '0');
        if (option.value === currentDayFrom) option.selected = true;
        daySelectsFrom.appendChild(option);
      }

      // Update "Até" days
      const currentDayTo = daySelectsTo.value;
      daySelectsTo.innerHTML = '<option value="">Dia</option>';
      for (let i = 1; i <= daysInMonthTo; i++) {
        const option = document.createElement('option');
        option.value = String(i).padStart(2, '0');
        option.textContent = String(i).padStart(2, '0');
        if (option.value === currentDayTo) option.selected = true;
        daySelectsTo.appendChild(option);
      }
    }

    populateYears();
    updateDaysInMonth();

    // Event listeners for search and view mode
    const input = searchRow.querySelector('#search-input');
    input.addEventListener('input', (e) => onSearchChange(e.target.value));

    searchRow.querySelector('#toggle-table').addEventListener('click', () => onViewModeChange('table'));
    searchRow.querySelector('#toggle-grid').addEventListener('click', () => onViewModeChange('grid'));

    // Filter selectors change listeners
    filtersRow.querySelectorAll('.filter-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const filterId = e.target.id.replace('filter-', '');
        onFilterChange(filterId, e.target.value);
      });
    });

    // Date filter selectors change listeners
    const allDateSelects = filtersRow.querySelectorAll('.date-select');
    allDateSelects.forEach(select => {
      select.addEventListener('change', (e) => {
        updateDaysInMonth();
        
        if (typeof onDateFilterChange === 'function') {
          const dayFrom = filtersRow.querySelector('#filter-day-from').value;
          const monthFrom = filtersRow.querySelector('#filter-month-from').value;
          const yearFrom = filtersRow.querySelector('#filter-year-from').value;
          const dayTo = filtersRow.querySelector('#filter-day-to').value;
          const monthTo = filtersRow.querySelector('#filter-month-to').value;
          const yearTo = filtersRow.querySelector('#filter-year-to').value;

          onDateFilterChange({
            dayFrom, monthFrom, yearFrom,
            dayTo, monthTo, yearTo
          });
        }
      });
    });

    // Clear date filters button
    filtersRow.querySelector('#clear-date-filters').addEventListener('click', () => {
      allDateSelects.forEach(select => select.value = '');
      updateDaysInMonth();
      
      if (typeof onDateFilterChange === 'function') {
        onDateFilterChange({
          dayFrom: '', monthFrom: '', yearFrom: '',
          dayTo: '', monthTo: '', yearTo: ''
        });
      }
    });

    return container;
  }
};
