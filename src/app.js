// ==========================================================================
// CENTRAL APPLICATION DRIVER - SISTEMA DE GESTÃO DE EVIDÊNCIAS CERNE
// ==========================================================================

(function () {
  // 1. Initial State with filters support
  const state = {
    evidences: [],
    searchQuery: '',
    viewMode: 'table', // default view mode: 'table' or 'grid'
    filters: {
      tipo: 'todos',
      categoria: 'todos',
      responsavel: 'todos',
      tag: 'todos'
    },
    dateFilters: {
      dateFrom: null,
      dateTo: null
    },
    appSettings: {
      categories: [],
      tags: []
    }
  };

  // Cache DOM references
  let appContainer = null;
  let mainContent = null;
  let listContainer = null;
  let searchBarElement = null;

  // 2. Initialization Function
  async function init() {
    appContainer = document.getElementById('app');

    await loadSettings();

    // Render Header
    const headerNode = window.CerneApp.Header.render(openUploadModal, openSettings);
    appContainer.appendChild(headerNode);

    // Create Main Content Wrapper
    mainContent = document.createElement('main');
    mainContent.className = 'main-content';

    // Render SearchBar (Rendered once so input focus is never lost)
    searchBarElement = window.CerneApp.SearchBar.render(
      state.searchQuery,
      state.viewMode,
      state.appSettings.categories,
      state.appSettings.tags,
      handleSearchChange,
      handleFilterChange,
      handleViewModeChange,
      handleDateFilterChange
    );
    mainContent.appendChild(searchBarElement);

    // Create list container for dynamic tables/grids
    listContainer = document.createElement('div');
    listContainer.id = 'evidence-list-container';
    listContainer.style.width = '100%';
    mainContent.appendChild(listContainer);

    appContainer.appendChild(mainContent);

    // Load evidences from backend and render list
    await loadEvidences();

    // Trigger initial icon replacement
    lucide.createIcons();
  }

  async function loadEvidences() {
    try {
      const evidences = await window.CerneApp.Api.fetchEvidences();
      state.evidences = evidences;
      populateFilterOptions();
      renderList();
    } catch (error) {
      console.error('Erro ao carregar evidências:', error);
      state.evidences = [];
      populateFilterOptions();
      renderList();
    }
  }

  async function loadSettings() {
    try {
      const settings = await window.CerneApp.Api.fetchSettings();
      state.appSettings = {
        categories: Array.isArray(settings.categories) ? settings.categories : [],
        tags: Array.isArray(settings.tags) ? settings.tags : []
      };
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      state.appSettings = {
        categories: ['Capacitação', 'Planejamento', 'Gestão', 'Assessoria', 'Sustentabilidade', 'Qualificação'],
        tags: ['CERNE', 'Gestão', 'Capacitação', 'Assessoria', 'Sustentabilidade', 'Qualificação']
      };
    }
  }

  // Populate dynamic dropdown options from current evidence database
  function populateFilterOptions() {
    const responsibles = [...new Set(state.evidences.map(e => e.responsavel))].sort();
    const categories = Array.isArray(state.appSettings.categories) ? state.appSettings.categories : [];
    const tags = Array.isArray(state.appSettings.tags) ? state.appSettings.tags : [];

    // Populate Categoria
    const categorySelect = searchBarElement.querySelector('#filter-categoria');
    const prevCategory = categorySelect.value;
    categorySelect.innerHTML = '<option value="todos">Todas as categorias</option>';
    categories.forEach(category => {
      const opt = document.createElement('option');
      opt.value = category;
      opt.textContent = category;
      if (category === prevCategory) opt.selected = true;
      categorySelect.appendChild(opt);
    });

    // Populate Responsável
    const respSelect = searchBarElement.querySelector('#filter-responsavel');
    const prevResp = respSelect.value;
    respSelect.innerHTML = '<option value="todos">Todos os responsáveis</option>';
    responsibles.forEach(resp => {
      const opt = document.createElement('option');
      opt.value = resp;
      opt.textContent = resp;
      if (resp === prevResp) opt.selected = true;
      respSelect.appendChild(opt);
    });

    // Populate Tag
    const tagSelect = searchBarElement.querySelector('#filter-tag');
    const prevTag = tagSelect.value;
    tagSelect.innerHTML = '<option value="todos">Todas as tags</option>';
    tags.forEach(tag => {
      const opt = document.createElement('option');
      opt.value = tag;
      opt.textContent = tag;
      if (tag === prevTag) opt.selected = true;
      tagSelect.appendChild(opt);
    });
  }

  // Helper to normalize strings for accent-insensitive search
  function normalizeString(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  // 3. Render list component dynamically based on search filters and viewMode
  function renderList() {
    // A. Filter evidences based on searchQuery and advanced filters
    const query = normalizeString(state.searchQuery);
    
    const filteredEvidences = state.evidences.filter(item => {
      // 1. Text Search Filter (cumulative match)
      if (query) {
        const nome = normalizeString(item.nome);
        const evento = normalizeString(item.evento);
        const categoria = normalizeString(item.categoria);
        const responsavel = normalizeString(item.responsavel);
        const resumo = normalizeString(item.resumo);
        const tags = (item.tags || []).map(t => normalizeString(t));

        const matchesQuery = (
          nome.includes(query) ||
          evento.includes(query) ||
          categoria.includes(query) ||
          responsavel.includes(query) ||
          resumo.includes(query) ||
          tags.some(tag => tag.includes(query))
        );
        
        if (!matchesQuery) return false;
      }

      // 2. Select Dropdowns Filters
      if (state.filters.tipo !== 'todos' && item.tipo !== state.filters.tipo) {
        return false;
      }
      if (state.filters.categoria !== 'todos' && item.categoria !== state.filters.categoria) {
        return false;
      }
      if (state.filters.responsavel !== 'todos' && item.responsavel !== state.filters.responsavel) {
        return false;
      }
      if (state.filters.tag !== 'todos' && !(item.tags || []).includes(state.filters.tag)) {
        return false;
      }

      // 3. Date Filter (intelligent date parsing)
      if (state.dateFilters.dateFrom || state.dateFilters.dateTo) {
        const itemDate = parseDate(item.data); // Convert DD/MM/YYYY to Date object
        
        if (state.dateFilters.dateFrom && itemDate < new Date(state.dateFilters.dateFrom)) {
          return false;
        }
        if (state.dateFilters.dateTo && itemDate > new Date(state.dateFilters.dateTo)) {
          return false;
        }
      }

      return true;
    });

    // Helper to parse DD/MM/YYYY date format
    function parseDate(dateStr) {
      if (!dateStr) return new Date(0);
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return new Date(0);
    }

    // B. Clear previous list elements
    listContainer.innerHTML = '';

    // C. Render corresponding component
    let renderedComponent = null;
    if (state.viewMode === 'table') {
      renderedComponent = window.CerneApp.EvidenceTable.render(
        filteredEvidences,
        openEvidenceDetails
      );
    } else {
      renderedComponent = window.CerneApp.EvidenceCard.render(
        filteredEvidences,
        openEvidenceDetails
      );
    }

    listContainer.appendChild(renderedComponent);

    // D. Re-compile Lucide Icons for the newly injected HTML components
    lucide.createIcons();
  }

  // 4. Action Handlers
  function handleSearchChange(newQuery) {
    state.searchQuery = newQuery;
    renderList();
  }

  function handleFilterChange(filterId, value) {
    state.filters[filterId] = value;
    renderList();
  }

  function handleDateFilterChange(filterType, dateFrom, dateTo) {
    state.dateFilters.dateFrom = dateFrom;
    state.dateFilters.dateTo = dateTo;
    renderList();
  }

  function handleViewModeChange(newMode) {
    if (state.viewMode === newMode) return;
    
    state.viewMode = newMode;

    // Toggle active state classes on buttons directly to avoid redrawing search input
    const toggleTableBtn = searchBarElement.querySelector('#toggle-table');
    const toggleGridBtn = searchBarElement.querySelector('#toggle-grid');

    if (newMode === 'table') {
      toggleTableBtn.classList.add('active');
      toggleGridBtn.classList.remove('active');
    } else {
      toggleTableBtn.classList.remove('active');
      toggleGridBtn.classList.add('active');
    }

    renderList();
  }

  function openUploadModal() {
    const modalNode = window.CerneApp.UploadModal.render(
      // onClose callback
      () => {
        // Nothing special to clean up
      },
      // onAddEvidence callback
      (newEvidence) => {
        state.evidences.unshift(newEvidence);
        populateFilterOptions();
        renderList();
      }
    );
    document.body.appendChild(modalNode);
    lucide.createIcons();
  }

  function openSettings() {
    const settingsNode = window.CerneApp.SettingsPage.render(
      state.appSettings,
      async (updatedSettings) => {
        const savedSettings = await window.CerneApp.Api.updateSettings(updatedSettings);
        state.appSettings = {
          categories: Array.isArray(savedSettings.categories) ? savedSettings.categories : [],
          tags: Array.isArray(savedSettings.tags) ? savedSettings.tags : []
        };

        const newSearchBar = window.CerneApp.SearchBar.render(
          state.searchQuery,
          state.viewMode,
          state.appSettings.categories,
          state.appSettings.tags,
          handleSearchChange,
          handleFilterChange,
          handleViewModeChange
        );

        mainContent.replaceChild(newSearchBar, searchBarElement);
        searchBarElement = newSearchBar;
        populateFilterOptions();
        renderList();

        return savedSettings;
      }
    );

    document.body.appendChild(settingsNode);
    lucide.createIcons();
  }

  function openEvidenceDetails(evidenceId) {
    const evidence = state.evidences.find(item => item.id === evidenceId);
    if (!evidence) return;

    const detailsNode = window.CerneApp.EvidenceDetails.render(
      evidence,
      () => {
        // Closed callback
      },
      (updatedEvidence) => {
        state.evidences = state.evidences.map(item => item.id === updatedEvidence.id ? updatedEvidence : item);
        populateFilterOptions();
        renderList();
      }
    );
    document.body.appendChild(detailsNode);
    lucide.createIcons();
  }

  // 5. Boot the Application when HTML DOM is fully ready
  document.addEventListener('DOMContentLoaded', init);
})();
