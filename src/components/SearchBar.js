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
    `;

    container.appendChild(searchRow);
    container.appendChild(filtersRow);

    // Date filters row
    const dateFiltersRow = document.createElement('div');
    dateFiltersRow.className = 'date-filters-row';
    dateFiltersRow.innerHTML = `
      <div class="date-filter-group">
        <div class="date-filter-container">
          <span class="filter-label">De</span>
          <input type="text" class="date-picker" id="filter-date-from" placeholder="Selecione a data inicial">
        </div>
        <div class="date-filter-container">
          <span class="filter-label">Até</span>
          <input type="text" class="date-picker" id="filter-date-to" placeholder="Selecione a data final">
        </div>
        <button id="clear-date-filter" class="clear-date-btn" title="Limpar filtro de datas">
          <i data-lucide="x" style="width: 18px; height: 18px;"></i>
        </button>
      </div>
    `;

    container.appendChild(dateFiltersRow);

    // Event listeners for search and view mode
    const input = searchRow.querySelector('#search-input');
    input.addEventListener('input', (e) => onSearchChange(e.target.value));

    searchRow.querySelector('#toggle-table').addEventListener('click', () => onViewModeChange('table'));
    searchRow.querySelector('#toggle-grid').addEventListener('click', () => onViewModeChange('grid'));

    // Filter selectors change listeners (excluding date filter)
    filtersRow.querySelectorAll('.filter-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const filterId = e.target.id.replace('filter-', '');
        onFilterChange(filterId, e.target.value);
      });
    });

    // Initialize Flatpickr date pickers
    const dateFromInput = dateFiltersRow.querySelector('#filter-date-from');
    const dateToInput = dateFiltersRow.querySelector('#filter-date-to');
    const clearBtn = dateFiltersRow.querySelector('#clear-date-filter');

    // Initialize from date picker
    const flatpickrFromInstance = flatpickr(dateFromInput, {
      mode: 'single',
      dateFormat: 'd/m/Y',
      locale: 'pt',
      allowInput: true,
      onChange: (selectedDates) => {
        if (typeof onDateFilterChange === 'function') {
          const dateFrom = selectedDates.length > 0 ? selectedDates[0].toISOString().split('T')[0] : null;
          const dateTo = flatpickrToInstance.selectedDates.length > 0 ? flatpickrToInstance.selectedDates[0].toISOString().split('T')[0] : null;
          onDateFilterChange('dateFrom', dateFrom, dateTo);
        }
      }
    });

    // Initialize to date picker
    const flatpickrToInstance = flatpickr(dateToInput, {
      mode: 'single',
      dateFormat: 'd/m/Y',
      locale: 'pt',
      allowInput: true,
      onChange: (selectedDates) => {
        if (typeof onDateFilterChange === 'function') {
          const dateFrom = flatpickrFromInstance.selectedDates.length > 0 ? flatpickrFromInstance.selectedDates[0].toISOString().split('T')[0] : null;
          const dateTo = selectedDates.length > 0 ? selectedDates[0].toISOString().split('T')[0] : null;
          onDateFilterChange('dateTo', dateFrom, dateTo);
        }
      }
    });

    // Clear date filter button
    clearBtn.addEventListener('click', () => {
      flatpickrFromInstance.clear();
      flatpickrToInstance.clear();
      if (typeof onDateFilterChange === 'function') {
        onDateFilterChange('clear', null, null);
      }
    });

    return container;
  }
};
