// ==========================================================================
// CENTRAL APPLICATION DRIVER - SISTEMA DE GESTÃO DE EVIDÊNCIAS CERNE
// ==========================================================================

(function () {
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
      dayFrom: '',
      monthFrom: '',
      yearFrom: '',
      dayTo: '',
      monthTo: '',
      yearTo: ''
    },
    appSettings: {
      categories: [],
      tags: []
    },
    showSidebarCard: localStorage.getItem('cerne:sidebar-card-closed') !== 'true'
  };

  // Cache DOM references
  let appContainer = null;
  let mainContent = null;
  let listContainer = null;
  let searchBarElement = null;
  let authView = null;
  let isAuthenticatedUser = false;

// 2. Initialization Function
  async function init() {
    appContainer = document.getElementById('app');
    appContainer.innerHTML = '';

    window.addEventListener('cerne:auth:required', () => {
      showLoginView();
    });

    const session = await window.CerneApp.Auth.getSession();
    if (!session?.user) {
      showLoginView();
      return;
    }
  
    isAuthenticatedUser = true;
    await loadSettings();

    // Render Header
    const headerNode = window.CerneApp.Header.render(openUploadModal, openSettings, handleLogout);
    appContainer.appendChild(headerNode);

    const bodyWrapper = document.createElement('div');
    bodyWrapper.className = 'app-shell-body';

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="sidebar-logo">
          <i data-lucide="layers" style="width: 20px; height: 20px;"></i>
        </div>
        <div>
          <span class="sidebar-brand-name">CERNE</span>
          <span class="sidebar-brand-text">Gestão de Evidências</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-group">
          <div class="sidebar-item active" data-nav="evidences">
            <i data-lucide="folder"></i>
            <span>Evidências</span>
          </div>
          <div class="sidebar-item" data-nav="categories">
            <i data-lucide="grid"></i>
            <span>Categorias</span>
          </div>
          <div class="sidebar-item" data-nav="tags">
            <i data-lucide="tag"></i>
            <span>Tags</span>
          </div>
          <div class="sidebar-item" data-nav="responsaveis">
            <i data-lucide="users"></i>
            <span>Responsáveis</span>
          </div>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-item" data-nav="calendario">
            <i data-lucide="calendar"></i>
            <span>Calendário</span>
          </div>
          <div class="sidebar-item" data-nav="relatorios">
            <i data-lucide="bar-chart-3"></i>
            <span>Relatórios</span>
          </div>
          <div class="sidebar-item" data-nav="settings">
            <i data-lucide="settings-2"></i>
            <span>Configurações</span>
          </div>
        </div>
      </nav>

      <div class="sidebar-card">
        <div class="sidebar-card-header">
          <div>
            <p class="sidebar-card-title">Organize. Encontre.</p>
            <p class="sidebar-card-description">Centralize suas evidências.</p>
          </div>
          <button type="button" class="sidebar-card-close" aria-label="Fechar card" id="sidebar-card-close-btn">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
    `;

    bodyWrapper.appendChild(sidebar);

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
      handleDateFilterChange,
      handleClearFilters
    );
    mainContent.appendChild(searchBarElement);

    listContainer = document.createElement('div');
    listContainer.id = 'evidence-list-container';
    listContainer.style.width = '100%';
    mainContent.appendChild(listContainer);

    bodyWrapper.appendChild(mainContent);

    // 3. Painel Lateral Direito (Sidebar Direita)
    const rightSidebar = document.createElement('aside');
    rightSidebar.className = 'right-sidebar';
    rightSidebar.id = 'right-sidebar-stats';
    bodyWrapper.appendChild(rightSidebar);

    // 4. Injeta a estrutura completa no DOM
    appContainer.appendChild(bodyWrapper);

    // 5. Configura eventos e carrega as evidências
    setupSidebarEvents();
    await loadEvidences();

    // 6. Atualiza ícones Lucide
    lucide.createIcons();
  }

  function renderAppShell() {
    appContainer.innerHTML = '';
    const headerNode = window.CerneApp.Header.render(openUploadModal, openSettings, handleLogout);
    appContainer.appendChild(headerNode);

    const bodyWrapper = document.createElement('div');
    bodyWrapper.className = 'app-shell-body';

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = `
      <div class="sidebar-brand">
        <div class="sidebar-logo">
          <i data-lucide="layers" style="width: 20px; height: 20px; color: var(--success);"></i>
        </div>
        <div>
          <span class="sidebar-brand-name">CERNE</span>
          <span class="sidebar-brand-text">Gestão de Evidências</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-group">
          <div class="sidebar-item active" data-nav="evidences">
            <i data-lucide="folder" style="color: var(--success);"></i>
            <span>Evidências</span>
          </div>
          <div class="sidebar-item" data-nav="categories">
            <i data-lucide="grid" style="color: var(--success);"></i>
            <span>Categorias</span>
          </div>
          <div class="sidebar-item" data-nav="tags">
            <i data-lucide="tag" style="color: var(--success);"></i>
            <span>Tags</span>
          </div>
          <div class="sidebar-item" data-nav="responsaveis">
            <i data-lucide="users" style="color: var(--success);"></i>
            <span>Responsáveis</span>
          </div>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-item" data-nav="calendario">
            <i data-lucide="calendar" style="color: var(--success);"></i>
            <span>Calendário</span>
          </div>
          <div class="sidebar-item" data-nav="relatorios">
            <i data-lucide="bar-chart-3" style="color: var(--success);"></i>
            <span>Relatórios</span>
          </div>
          <div class="sidebar-item" data-nav="settings" id="sidebar-settings-item">
            <i data-lucide="settings-2" style="color: var(--success);"></i>
            <span>Configurações</span>
          </div>
        </div>
      </nav>

      ${state.showSidebarCard ? `
      <div class="sidebar-card" id="sidebar-info-card">
        <div class="sidebar-card-header">
          <div>
            <p class="sidebar-card-title">Organize. Encontre.</p>
            <p class="sidebar-card-description">Centralize suas evidências.</p>
          </div>
          <button type="button" class="sidebar-card-close" aria-label="Fechar card" id="sidebar-card-close-btn">
            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </div>
      ` : ''}
    `;

    bodyWrapper.appendChild(sidebar);
    setupSidebarEvents();

    mainContent = document.createElement('main');
    mainContent.className = 'main-content';

    searchBarElement = window.CerneApp.SearchBar.render(
      state.searchQuery,
      state.viewMode,
      state.appSettings.categories,
      state.appSettings.tags,
      handleSearchChange,
      handleFilterChange,
      handleViewModeChange,
      handleDateFilterChange,
      handleClearFilters
    );
    mainContent.appendChild(searchBarElement);

    listContainer = document.createElement('div');
    listContainer.id = 'evidence-list-container';
    listContainer.style.width = '100%';
    mainContent.appendChild(listContainer);

    bodyWrapper.appendChild(mainContent);
    
    // =========================================================================
    // NOVO: Painel Lateral Direito
    // =========================================================================
    const rightSidebar = document.createElement('aside');
    rightSidebar.className = 'right-sidebar';
    rightSidebar.id = 'right-sidebar-stats';
    
    bodyWrapper.appendChild(rightSidebar);

    // Adiciona o bodyWrapper no container do app
    appContainer.appendChild(bodyWrapper);

    // Renderiza as métricas
    renderRightSidebarStats();
  }

  function showLoginView() {
    isAuthenticatedUser = false;
    appContainer.innerHTML = '';
    authView = window.CerneApp.LoginPage.render(handleLogin, handleForgotPassword);
    appContainer.appendChild(authView);
    lucide.createIcons();
  }

  async function handleLogin(email, password) {
    const result = await window.CerneApp.Auth.login(email, password);
    if (result?.user) {
      isAuthenticatedUser = true;
      await loadSettings();
      renderAppShell();
      await loadEvidences();
      lucide.createIcons();
    }
  }

  async function handleForgotPassword(email) {
    await window.CerneApp.Auth.forgotPassword(email);
  }

  async function handleLogout() {
    await window.CerneApp.Auth.logout();
    showLoginView();
  }

  async function loadEvidences() {
    try {
      const evidences = await window.CerneApp.Api.fetchEvidences();
      state.evidences = evidences;
      
      // Add mock evidence if no evidences exist (for demo purposes)
      if (state.evidences.length === 0) {
        state.evidences.push(createMockEvidence());
      }
      
      populateFilterOptions();
      renderList();
      updateDashboardCounters();
    } catch (error) {
      console.error('Erro ao carregar evidências:', error);
      state.evidences = [];
      
      // Add mock evidence on error (for demo purposes)
      state.evidences.push(createMockEvidence2());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence2());
      state.evidences.push(createMockEvidence2());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence()); //10
      state.evidences.push(createMockEvidence2());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence2());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence());
      state.evidences.push(createMockEvidence2()); //20

      
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
      const responsavel = normalizeString(item.responsavel);
      const resumo = normalizeString(item.resumo);
      
      // Trata categorias (array ou string)
      const itemCats = Array.isArray(item.categorias) && item.categorias.length > 0
        ? item.categorias
        : (item.categoria ? [item.categoria] : []);
      const categoriasStr = itemCats.map(c => normalizeString(c));

      const tags = (item.tags || []).map(t => normalizeString(t));

      const matchesQuery = (
        nome.includes(query) ||
        evento.includes(query) ||
        categoriasStr.some(cat => cat.includes(query)) ||
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
      // 2. Select Dropdowns Filters
          if (state.filters.categoria !== 'todos') {
            const itemCats = Array.isArray(item.categorias) && item.categorias.length > 0 
              ? item.categorias 
              : [item.categoria];
              
            if (!itemCats.includes(state.filters.categoria)) {
              return false;
            }
          }
      if (state.filters.responsavel !== 'todos' && item.responsavel !== state.filters.responsavel) {
        return false;
      }
      if (state.filters.tag !== 'todos' && !(item.tags || []).includes(state.filters.tag)) {
        return false;
      }

      // 3. Date Filter (intelligent date parsing)
      if (state.dateFilters.dayFrom || state.dateFilters.monthFrom || state.dateFilters.yearFrom ||
          state.dateFilters.dayTo || state.dateFilters.monthTo || state.dateFilters.yearTo) {
        
        const itemDate = parseDate(item.data); // Convert DD/MM/YYYY to Date object
        let isInRange = true;

        // Calculate "De" (from) date
        if (state.dateFilters.yearFrom || state.dateFilters.monthFrom || state.dateFilters.dayFrom) {
          let fromDate;
          const yearFrom = state.dateFilters.yearFrom || '1900';
          const monthFrom = state.dateFilters.monthFrom || '1';
          const dayFrom = state.dateFilters.dayFrom || '1';
          
          fromDate = new Date(parseInt(yearFrom), parseInt(monthFrom) - 1, parseInt(dayFrom));
          if (itemDate < fromDate) isInRange = false;
        }

        // Calculate "Até" (to) date
        if (state.dateFilters.yearTo || state.dateFilters.monthTo || state.dateFilters.dayTo) {
          let toDate;
          const yearTo = state.dateFilters.yearTo || '9999';
          const monthTo = state.dateFilters.monthTo || '12';
          
          // If only month/year specified, get last day of that month
          let dayTo = state.dateFilters.dayTo;
          if (!dayTo && monthTo) {
            const lastDay = new Date(parseInt(yearTo), parseInt(monthTo), 0).getDate();
            dayTo = String(lastDay);
          } else if (!dayTo) {
            dayTo = '31';
          }
          
          toDate = new Date(parseInt(yearTo), parseInt(monthTo) - 1, parseInt(dayTo));
          if (itemDate > toDate) isInRange = false;
        }

        if (!isInRange) return false;
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

    // Atualiza os dados do painel lateral direito
    renderRightSidebarStats();

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

  function handleDateFilterChange(filterObj) {
    state.dateFilters = {
      dayFrom: filterObj.dayFrom || '',
      monthFrom: filterObj.monthFrom || '',
      yearFrom: filterObj.yearFrom || '',
      dayTo: filterObj.dayTo || '',
      monthTo: filterObj.monthTo || '',
      yearTo: filterObj.yearTo || ''
    };
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


  // Adicione a função de limpeza no app.js:
function handleClearFilters() {
  state.searchQuery = '';
  state.filters = {
    tipo: 'todos',
    categoria: 'todos',
    responsavel: 'todos',
    tag: 'todos'
  };
  state.dateFilters = {
    dayFrom: '',
    monthFrom: '',
    yearFrom: '',
    dayTo: '',
    monthTo: '',
    yearTo: ''
  };

  renderList();
}

function setupSidebarEvents() {
  // Delegação de eventos: escuta o clique no nível do documento
  document.addEventListener('click', (event) => {
    // 1. Verifica se o clique foi em um botão de fechar o card da sidebar
    const closeBtn = event.target.closest('#sidebar-card-close-btn');
    if (closeBtn) {
      localStorage.setItem('cerne:sidebar-card-closed', 'true');
      state.showSidebarCard = false;
      const card = document.getElementById('sidebar-info-card');
      if (card) {
        card.style.animation = 'fadeOut 0.3s ease-in-out';
        setTimeout(() => card.remove(), 300);
      }
      return;
    }

    // 2. Verifica se o clique foi em algum item do menu lateral (.sidebar-item[data-nav])
    const navItem = event.target.closest('.sidebar-item[data-nav]');
    if (navItem) {
      const navTarget = navItem.getAttribute('data-nav');
      handleSidebarNavigation(navTarget);

      // Atualiza a classe 'active' do menu visualmente
      document.querySelectorAll('.sidebar-item[data-nav]').forEach(i => i.classList.remove('active'));
      navItem.classList.add('active');
      return;
    }

    // 3. Verifica se o clique foi no botão de configurações do Header
    const headerSettingsBtn = event.target.closest('#btn-settings');
    if (headerSettingsBtn) {
      const settingsItem = document.querySelector('.sidebar-item[data-nav="settings"]');
      if (settingsItem) {
        document.querySelectorAll('.sidebar-item[data-nav]').forEach(i => i.classList.remove('active'));
        settingsItem.classList.add('active');
      }
      openSettings();
      return;
    }
  });
}

  // Handle sidebar navigation
  function handleSidebarNavigation(target) {
    switch (target) {
      case 'evidences':
        // Reset filters and show all evidences
        state.filters = { tipo: 'todos', categoria: 'todos', responsavel: 'todos', tag: 'todos' };
        state.dateFilters = { dayFrom: '', monthFrom: '', yearFrom: '', dayTo: '', monthTo: '', yearTo: '' };
        renderList();
        break;
   //   case 'categories':
   //     alert('Seção de Categorias em desenvolvimento');
   //     break;
   //   case 'tags':
   //     alert('Seção de Tags em desenvolvimento');
   //     break;

   case 'categories':
      openSettings('categories'); // Abre focado APENAS em Categorias
      break;

    case 'tags':
      openSettings('tags'); // Abre focado APENAS em Tags
      break;

    case 'settings':
      openSettings('all'); // Abre a tela completa de configurações
      break;

      case 'responsaveis':
        const responsaveisUnicos = [...new Set(state.evidences.map(e => e.responsavel).filter(Boolean))];
        const responsaveisNode = window.CerneApp.ResponsaveisPage.render(
          responsaveisUnicos,
          () => {
            const defaultItem = document.querySelector('.sidebar-item[data-nav="evidences"]');
            if (defaultItem) {
              document.querySelectorAll('.sidebar-item[data-nav]').forEach(i => i.classList.remove('active'));
              defaultItem.classList.add('active');
            }
          }
        );
        document.body.appendChild(responsaveisNode);
        lucide.createIcons();
        break;

     case 'calendario':
        const calendarioNode = window.CerneApp.CalendarioPage.render(
          state.evidences, // Passa as evidências atuais do estado global
          () => restoreSidebarActive('evidences')
        );
        document.body.appendChild(calendarioNode);
        lucide.createIcons();
        break;
        
      case 'relatorios':
        alert('Seção de Relatórios em desenvolvimento');
        break;
      case 'settings':
        openSettings();
        break;
    }
  }

  // Função responsável por calcular e renderizar os cards laterais à direita
  function renderRightSidebarStats() {
    const rightSidebar = document.getElementById('right-sidebar-stats');
    if (!rightSidebar) return; // Trava de segurança contra erros de inicialização

    const evidences = state.evidences || [];
    const totalEvidences = evidences.length;

    // Métricas calculadas dinamicamente
    const totalCategories = new Set(evidences.map(e => e.categoria).filter(Boolean)).size;
    const totalResponsaveis = new Set(evidences.map(e => e.responsavel).filter(Boolean)).size;
    
    const allTags = evidences.flatMap(e => Array.isArray(e.tags) ? e.tags : []);
    const totalTags = new Set(allTags).size;

    // Cálculo de evidências adicionadas no mês atual
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const newThisMonth = evidences.filter(e => {
      if (e.criadoEm) {
        const date = new Date(e.criadoEm);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      }
      if (e.data && typeof e.data === 'string') {
        const parts = e.data.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          return month === currentMonth && year === currentYear;
        }
      }
      return false;
    }).length;

    rightSidebar.innerHTML = /*
      <div class="right-sidebar-header">
        <i data-lucide="bar-chart-2" style="width: 18px; height: 18px; color: var(--success);"></i>
        <span>Resumo Geral</span>
      </div>  */
`
      <div class="right-sidebar-cards">
        <!-- Card 1: Evidências -->
        <div class="dashboard-card vertical-card">
          <div class="dashboard-card-icon">
            <i data-lucide="folder"></i>
          </div>
          <div class="dashboard-card-content">
            <div class="dashboard-card-counter">${totalEvidences}</div>
            <div class="dashboard-card-title">Evidências</div>
            <div class="dashboard-card-subtitle">Registradas no sistema</div>
          </div>
        </div>

        <!-- Card 2: Categorias -->
        <div class="dashboard-card vertical-card">
          <div class="dashboard-card-icon">
            <i data-lucide="grid"></i>
          </div>
          <div class="dashboard-card-content">
            <div class="dashboard-card-counter">${totalCategories}</div>
            <div class="dashboard-card-title">Categorias</div>
            <div class="dashboard-card-subtitle">Categorias ativas</div>
          </div>
        </div>

        <!-- Card 3: Responsáveis -->
        <div class="dashboard-card vertical-card">
          <div class="dashboard-card-icon">
            <i data-lucide="users"></i>
          </div>
          <div class="dashboard-card-content">
            <div class="dashboard-card-counter">${totalResponsaveis}</div>
            <div class="dashboard-card-title">Responsáveis</div>
            <div class="dashboard-card-subtitle">Membros com envios</div>
          </div>
        </div>

        <!-- Card 4: Tags -->
        <div class="dashboard-card vertical-card">
          <div class="dashboard-card-icon">
            <i data-lucide="tag"></i>
          </div>
          <div class="dashboard-card-content">
            <div class="dashboard-card-counter">${totalTags}</div>
            <div class="dashboard-card-title">Tags</div>
            <div class="dashboard-card-subtitle">Rotulagens criadas</div>
          </div>
        </div>

        <!-- Card 5: Novas do Mês -->
        <div class="dashboard-card vertical-card">
          <div class="dashboard-card-icon">
            <i data-lucide="sparkles"></i>
          </div>
          <div class="dashboard-card-content">
            <div class="dashboard-card-counter">${newThisMonth}</div>
            <div class="dashboard-card-title">Novas do Mês</div>
            <div class="dashboard-card-subtitle">Cadastradas este mês</div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // Create mock evidence for demo purposes
  function createMockEvidence() {
    const mockEvidence = {
      id: 'mock-' + Date.now(),
      nome: 'Documento de Demonstração CERNE',
      tipo: 'documento',
      data: new Date().toLocaleDateString('pt-BR'),
      evento: 'Reunião de Alinhamento Estratégico',
      categoria: 'Planejamento',
      responsavel: 'Usuário Demo',
      tags: ['CERNE', 'Demo', 'Teste'],
      resumo: 'Este é um documento de demonstração do sistema CERNE para visualização da interface com dados.',
      textoExtraido: 'CONTEÚDO EXTRAÍDO:\n\nEste documento apresenta os processos-chave do CERNE e demonstra como as evidências são organizadas, categorizadas e disponibilizadas no sistema de gestão.'
    };
    return mockEvidence;
  }

    function createMockEvidence2() {
    const mockEvidence = {
      nome: 'Comprovante de Pitch no Demo Day UFRGS',
      tipo: 'apresentacao',
      data: '15/08/2026',
      evento: 'Demo Day CEI 2026',
      categoria: 'Mercado',
      responsavel: 'Startup Alpha',
      tags: ['Pitch', 'Investimento', 'DemoDay'],
      resumo: 'Apresentação de pitch de vendas e modelo de negócios realizada para banca de investidores anjo.',
      textoExtraido: 'CONTEÚDO EXTRAÍDO:\n\nPitch Deck v3. Estrutura: Problema, Solução, TAM/SAM/SOM, Tração de Mercado e Necessidade de Aporte ($200k).'
    };
    return mockEvidence;
  }

  function openUploadModal() {
    if (!isAuthenticatedUser) {
      showLoginView();
      return;
    }
    const modalNode = window.CerneApp.UploadModal.render(
      // onClose callback
      () => {
        // Nothing special to clean up
      },
      // onAddEvidence callback
      (newEvidence) => {
        // Remove mock evidence if it's the first entry
        if (state.evidences.length === 1 && state.evidences[0].id.startsWith('mock-')) {
          state.evidences = [];
        }
        state.evidences.unshift(newEvidence);
        populateFilterOptions();
        renderList();
        updateDashboardCounters();
      },
      state.appSettings.categories,
      state.appSettings.tags
    );
    document.body.appendChild(modalNode);
    lucide.createIcons();
  }

  function openSettings(activeTab = 'all') {
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
    },
    activeTab // <-- Passamos qual aba/seção queremos exibir!
  );

  document.body.appendChild(settingsNode);
  lucide.createIcons();
}

function updateDashboardCounters() {
  const evidences = state.evidences || [];

  // 1. Total de Evidências
  const total = evidences.length;

  // 2. Categorias Únicas
  const categoriasUnicas = new Set(
    evidences.map(e => e.categoria).filter(Boolean)
  ).size;

  // 3. Tags Únicas (achata a lista de arrays de tags)
  const tagsUnicas = new Set(
    evidences.flatMap(e => Array.isArray(e.tags) ? e.tags : [])
  ).size;

  // 4. Responsáveis Únicos
  const responsaveisUnicos = new Set(
    evidences.map(e => e.responsavel).filter(Boolean)
  ).size;

  // 5. Novas Adicionadas no Mês Atual
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed (0 = Jan)
  const currentYear = now.getFullYear();

  const novasNoMes = evidences.filter(e => {
    // Tenta validar pela coluna de criação ou do formato de data em string "DD/MM/YYYY"
    if (e.criadoEm) {
      const date = new Date(e.criadoEm);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }
    
    if (e.data && typeof e.data === 'string') {
      const parts = e.data.split('/');
      if (parts.length === 3) {
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return month === currentMonth && year === currentYear;
      }
    }
    
    return false;
  }).length;

  // Atualizar elementos no DOM
  const elTotal = document.getElementById('counter-total');
  const elCategorias = document.getElementById('counter-categorias');
  const elTags = document.getElementById('counter-tags');
  const elResponsaveis = document.getElementById('counter-responsaveis');
  const elNovasMes = document.getElementById('counter-novas-mes');

  if (elTotal) elTotal.textContent = total;
  if (elCategorias) elCategorias.textContent = categoriasUnicas;
  if (elTags) elTags.textContent = tagsUnicas;
  if (elResponsaveis) elResponsaveis.textContent = responsaveisUnicos;
  if (elNovasMes) elNovasMes.textContent = novasNoMes;
}

function openEvidenceDetails(evidenceId) {
  const evidence = state.evidences.find(item => item.id === evidenceId);
  if (!evidence) return;

  const detailsNode = window.CerneApp.EvidenceDetails.render(
    evidence,
    () => {},
    (updatedEvidence) => {
      // Callback de salvar edição
      state.evidences = state.evidences.map(item => {
        if (item.id === updatedEvidence.id) {
          return {
            ...item,
            ...updatedEvidence,
            // Garante que a lista de categorias seja mantida no estado global
            categorias: Array.isArray(updatedEvidence.categorias) && updatedEvidence.categorias.length > 0
              ? updatedEvidence.categorias
              : (updatedEvidence.categoria ? [updatedEvidence.categoria] : [])
          };
        }
        return item;
      });

      populateFilterOptions();
      renderList();
      updateDashboardCounters();
    },
    state.appSettings.categories,
    state.appSettings.tags,
    (deletedId) => {
      state.evidences = state.evidences.filter(item => item.id !== deletedId);
      populateFilterOptions();
      renderList();
      updateDashboardCounters();
    }
  );
  document.body.appendChild(detailsNode);
  lucide.createIcons();
}
  document.addEventListener('DOMContentLoaded', init);
  
  })();
