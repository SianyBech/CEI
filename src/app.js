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

    // Carrega as preferências personalizadas do usuário
  try {
  const profile = await window.CerneApp.Api.fetchUserProfile();
  if (profile) {
    // Mescla a cor e os dados do banco no objeto de sessão global se necessário
    window.CerneApp.Auth.currentUserProfile = profile; 
  }
} catch (e) {
  console.warn('Erro ao carregar perfil:', e);
}
  
    isAuthenticatedUser = true;
    await loadSettings();

    // 1. Cria o container pai com a ID correta para podermos atualizar o Header depois
    const headerContainer = document.createElement('div');
    headerContainer.id = 'header-container';

    // Render Header
    const headerNode = window.CerneApp.Header.render(openUploadModal, openSettings, handleLogout);
    headerContainer.appendChild(headerNode);

    // 3. Adiciona o container no app
    appContainer.appendChild(headerContainer);

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
            <i data-lucide="settings"></i>
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

    const rightSidebar = document.createElement('aside');
    rightSidebar.className = 'right-sidebar';
    rightSidebar.id = 'right-sidebar-stats';
    bodyWrapper.appendChild(rightSidebar);

    appContainer.appendChild(bodyWrapper);

    setupSidebarEvents();
    await loadEvidences();

    lucide.createIcons();
  }

  function renderAppShell() {
    appContainer.innerHTML = '';
    
    // Ajustado: usa o container pai do Header
    const headerContainer = document.createElement('div');
    headerContainer.id = 'header-container';
    const headerNode = window.CerneApp.Header.render(openUploadModal, openSettings, handleLogout);
    headerContainer.appendChild(headerNode);
    appContainer.appendChild(headerContainer);

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
            <i data-lucide="settings" style="color: var(--success);"></i>
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
    
    const rightSidebar = document.createElement('aside');
    rightSidebar.className = 'right-sidebar';
    rightSidebar.id = 'right-sidebar-stats';
    
    bodyWrapper.appendChild(rightSidebar);
    appContainer.appendChild(bodyWrapper);

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

// No app.js, crie ou ajuste a função que carrega as evidências para cruzar com os usuários:
async function loadEvidences() {
    try {
      const [evidences, users] = await Promise.all([
        window.CerneApp.Api.fetchEvidences(),
        window.CerneApp.Api.fetchAllUsers().catch(() => [])
      ]);

      // Cria um mapa de cores por nome de usuário
      const userColorMap = {};
      users.forEach(u => {
        if (u.nome && u.cor) {
          userColorMap[u.nome.trim().toLowerCase()] = u.cor;
        }
      });

      // Injeta a cor correspondente em cada evidência com base no responsável
      state.evidences = evidences.map(e => ({
        ...e,
        responsavelColor: userColorMap[(e.responsavel || '').trim().toLowerCase()] || null
      }));

      populateFilterOptions();
      renderList();
      updateDashboardCounters();
    } catch (error) {
      console.error('Erro ao carregar evidências:', error);
      state.evidences = [];
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

  function populateFilterOptions() {
    const responsibles = [...new Set(state.evidences.map(e => e.responsavel))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const categoriesRaw = Array.isArray(state.appSettings.categories) ? state.appSettings.categories : [];
    const categories = [...categoriesRaw]
      .filter(c => c && c.trim() !== '')
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const tagsRaw = Array.isArray(state.appSettings.tags) ? state.appSettings.tags : [];
    const tags = [...tagsRaw]
      .filter(t => t && t.trim() !== '')
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    const categorySelect = searchBarElement.querySelector('#filter-categoria');
    if (categorySelect) {
      const prevCategory = categorySelect.value;
      categorySelect.innerHTML = '<option value="todos">Todas as categorias</option>';
      categories.forEach(category => {
        const opt = document.createElement('option');
        opt.value = category;
        opt.textContent = category;
        if (category === prevCategory) opt.selected = true;
        categorySelect.appendChild(opt);
      });
    }

    const respSelect = searchBarElement.querySelector('#filter-responsavel');
    if (respSelect) {
      const prevResp = respSelect.value;
      respSelect.innerHTML = '<option value="todos">Todos os responsáveis</option>';
      responsibles.forEach(resp => {
        const opt = document.createElement('option');
        opt.value = resp;
        opt.textContent = resp;
        if (resp === prevResp) opt.selected = true;
        respSelect.appendChild(opt);
      });
    }

    const tagSelect = searchBarElement.querySelector('#filter-tag');
    if (tagSelect) {
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
  }

  function normalizeString(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function renderList() {
    const query = normalizeString(state.searchQuery);
    
    const filteredEvidences = state.evidences.filter(item => {
      if (query) {
        const nome = normalizeString(item.nome);
        const evento = normalizeString(item.evento);
        const responsavel = normalizeString(item.responsavel);
        const resumo = normalizeString(item.resumo);
        
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

      if (state.filters.tipo !== 'todos' && item.tipo !== state.filters.tipo) {
        return false;
      }
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

      if (state.dateFilters.dayFrom || state.dateFilters.monthFrom || state.dateFilters.yearFrom ||
          state.dateFilters.dayTo || state.dateFilters.monthTo || state.dateFilters.yearTo) {
        
        const itemDate = parseDate(item.data);
        let isInRange = true;

        if (state.dateFilters.yearFrom || state.dateFilters.monthFrom || state.dateFilters.dayFrom) {
          const yearFrom = state.dateFilters.yearFrom || '1900';
          const monthFrom = state.dateFilters.monthFrom || '1';
          const dayFrom = state.dateFilters.dayFrom || '1';
          
          const fromDate = new Date(parseInt(yearFrom), parseInt(monthFrom) - 1, parseInt(dayFrom));
          if (itemDate < fromDate) isInRange = false;
        }

        if (state.dateFilters.yearTo || state.dateFilters.monthTo || state.dateFilters.yearTo) {
          const yearTo = state.dateFilters.yearTo || '9999';
          const monthTo = state.dateFilters.monthTo || '12';
          
          let dayTo = state.dateFilters.dayTo;
          if (!dayTo && monthTo) {
            const lastDay = new Date(parseInt(yearTo), parseInt(monthTo), 0).getDate();
            dayTo = String(lastDay);
          } else if (!dayTo) {
            dayTo = '31';
          }
          
          const toDate = new Date(parseInt(yearTo), parseInt(monthTo) - 1, parseInt(dayTo));
          if (itemDate > toDate) isInRange = false;
        }

        if (!isInRange) return false;
      }

      return true;
    });

    function parseDate(dateStr) {
      if (!dateStr) return new Date(0);
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
      }
      return new Date(0);
    }

    listContainer.innerHTML = '';

    let renderedComponent = null;
    if (state.viewMode === 'table') {
      renderedComponent = window.CerneApp.EvidenceTable.render(
        filteredEvidences,
        openEvidenceDetails,
        state.itemsPerPage
      );
    } else {
      renderedComponent = window.CerneApp.EvidenceCard.render(
        filteredEvidences,
        openEvidenceDetails
      );
    }

    listContainer.appendChild(renderedComponent);
    renderRightSidebarStats();
    lucide.createIcons();
  }

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

  function handleClearFilters() {
    state.searchQuery = '';
    state.filters = { tipo: 'todos', categoria: 'todos', responsavel: 'todos', tag: 'todos' };
    state.dateFilters = { dayFrom: '', monthFrom: '', yearFrom: '', dayTo: '', monthTo: '', yearTo: '' };
    renderList();
  }

  let isSidebarEventsSetup = false;

  function setupSidebarEvents() {
    if (isSidebarEventsSetup) return;
    isSidebarEventsSetup = true;

    document.addEventListener('click', (event) => {
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

      const navItem = event.target.closest('.sidebar-item[data-nav]');
      if (navItem) {
        const navTarget = navItem.getAttribute('data-nav');
        handleSidebarNavigation(navTarget);

        document.querySelectorAll('.sidebar-item[data-nav]').forEach(i => i.classList.remove('active'));
        navItem.classList.add('active');
        return;
      }

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

  function restoreSidebarActive(targetNav = 'evidences') {
    const defaultItem = document.querySelector(`.sidebar-item[data-nav="${targetNav}"]`);
    if (defaultItem) {
      document.querySelectorAll('.sidebar-item[data-nav]').forEach(i => i.classList.remove('active'));
      defaultItem.classList.add('active');
    }
  }

  // Única declaração de openSettings (limpa e assíncrona)
  async function openSettings() {
    if (window.CerneApp && window.CerneApp.SettingsPage) {
      const settingsNode = await window.CerneApp.SettingsPage.render(
        () => restoreSidebarActive('evidences'),
        async (updatedUser) => {
          if (updatedUser?.configuracoes) {
            state.viewMode = updatedUser.configuracoes.defaultView || 'table';
            state.itemsPerPage = updatedUser.configuracoes.itemsPerPage || 10;
            
            if (window.CerneApp.EvidenceTable) {
              window.CerneApp.EvidenceTable.resetPage();
            }
          }

          if (updatedUser?.nome && updatedUser?.cor) {
          state.evidences = state.evidences.map(e => {
            if (e.responsavel && e.responsavel.trim().toLowerCase() === updatedUser.nome.trim().toLowerCase()) {
              return { ...e, responsavelColor: updatedUser.cor };
            }
            return e;
          });
        }

        // No callback de sucesso do openSettings (dentro do app.js):
        const updatedUser = await window.CerneApp.Api.updateUserProfile(payload);
        
        // ---> ADICIONE ESTA LINHA PARA ATUALIZAR O CACHE GLOBAL <---
        window.CerneApp.Auth = window.CerneApp.Auth || {};
        window.CerneApp.Auth.currentUserProfile = updatedUser;

          const headerContainer = document.querySelector('#header-container');
          if (headerContainer && window.CerneApp.Header) {
            headerContainer.innerHTML = '';
            headerContainer.appendChild(
              window.CerneApp.Header.render(openUploadModal, openSettings, handleLogout, updatedUser)
            );
          }

          renderList();
        }
      );

      document.body.appendChild(settingsNode);
      if (window.lucide) lucide.createIcons();
    }
  }

  async function handleSidebarNavigation(target) {
  switch (target) {
    case 'evidences':
      state.filters = { tipo: 'todos', categoria: 'todos', responsavel: 'todos', tag: 'todos' };
      state.dateFilters = { dayFrom: '', monthFrom: '', yearFrom: '', dayTo: '', monthTo: '', yearTo: '' };
      renderList();
      break;

    case 'categories':
      if (window.CerneApp && window.CerneApp.CategoriesPage) {
        const categoriesNode = window.CerneApp.CategoriesPage.render(() => restoreSidebarActive('evidences'));
        document.body.appendChild(categoriesNode);
        if (window.lucide) lucide.createIcons();
      }
      break;

    case 'tags':
      if (window.CerneApp && window.CerneApp.TagsPage) {
        const tagsNode = window.CerneApp.TagsPage.render(() => restoreSidebarActive('evidences'));
        document.body.appendChild(tagsNode);
        if (window.lucide) lucide.createIcons();
      }
      break;

    case 'responsaveis':
      try {
        const userProfile = await window.CerneApp.Api.fetchUserProfile();
        const isAdmin = userProfile?.role === 'admin';

        if (window.CerneApp && window.CerneApp.ResponsaveisPage) {
          const responsaveisNode = await window.CerneApp.ResponsaveisPage.render(
            isAdmin,
            () => restoreSidebarActive('evidences')
          );
          document.body.appendChild(responsaveisNode);
          if (window.lucide) lucide.createIcons();
        }
      } catch (err) {
        console.error('[NAV] Erro ao abrir Responsáveis:', err);
      }
      break;

    case 'calendario':
      if (window.CerneApp && window.CerneApp.CalendarioPage) {
        const calendarioNode = await window.CerneApp.CalendarioPage.render(
          state.evidences,
          () => restoreSidebarActive('evidences')
        );
        document.body.appendChild(calendarioNode);
        if (window.lucide) lucide.createIcons();
      }
      break;

    case 'relatorios':
      if (window.CerneApp && window.CerneApp.RelatoriosPage) {
        const relatoriosNode = await window.CerneApp.RelatoriosPage.render(
          state.evidences,
          () => restoreSidebarActive('evidences')
        );
        document.body.appendChild(relatoriosNode);
        if (window.lucide) lucide.createIcons();
      }
      break;

    case 'settings':
      await openSettings();
      break;
  }
}

  function renderRightSidebarStats() {
    const rightSidebar = document.getElementById('right-sidebar-stats');
    if (!rightSidebar) return;

    const evidences = state.evidences || [];
    const totalEvidences = evidences.length;

    const totalCategories = new Set(evidences.map(e => e.categoria).filter(Boolean)).size;
    const totalResponsaveis = new Set(evidences.map(e => e.responsavel).filter(Boolean)).size;
    
    const allTags = evidences.flatMap(e => Array.isArray(e.tags) ? e.tags : []);
    const totalTags = new Set(allTags).size;

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

    rightSidebar.innerHTML = `
      <div class="right-sidebar-cards">
        <div class="dashboard-card vertical-card">
          <div class="dashboard-card-icon"><i data-lucide="folder"></i></div>
          <div class="dashboard-card-content">
            <div class="dashboard-card-counter">${totalEvidences}</div>
            <div class="dashboard-card-title">Evidências</div>
            <div class="dashboard-card-subtitle">Registradas no sistema</div>
          </div>
        </div>

        <div class="dashboard-card vertical-card">
          <div class="dashboard-card-icon"><i data-lucide="grid"></i></div>
          <div class="dashboard-card-content">
            <div class="dashboard-card-counter">${totalCategories}</div>
            <div class="dashboard-card-title">Categorias</div>
            <div class="dashboard-card-subtitle">Categorias ativas</div>
          </div>
        </div>

        <div class="dashboard-card vertical-card">
          <div class="dashboard-card-icon"><i data-lucide="users"></i></div>
          <div class="dashboard-card-content">
            <div class="dashboard-card-counter">${totalResponsaveis}</div>
            <div class="dashboard-card-title">Responsáveis</div>
            <div class="dashboard-card-subtitle">Membros com envios</div>
          </div>
        </div>

        <div class="dashboard-card vertical-card">
          <div class="dashboard-card-icon"><i data-lucide="tag"></i></div>
          <div class="dashboard-card-content">
            <div class="dashboard-card-counter">${totalTags}</div>
            <div class="dashboard-card-title">Tags</div>
            <div class="dashboard-card-subtitle">Rotulagens criadas</div>
          </div>
        </div>

        <div class="dashboard-card vertical-card">
          <div class="dashboard-card-icon"><i data-lucide="sparkles"></i></div>
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

  function createMockEvidence() {
    return {
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
  }

  function createMockEvidence2() {
    return {
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
  }

  function openUploadModal() {
    if (!isAuthenticatedUser) {
      showLoginView();
      return;
    }
    const modalNode = window.CerneApp.UploadModal.render(
      () => {},
      (newEvidence) => {
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

  function updateDashboardCounters() {
    const evidences = state.evidences || [];

    const total = evidences.length;
    const categoriasUnicas = new Set(evidences.map(e => e.categoria).filter(Boolean)).size;
    const tagsUnicas = new Set(evidences.flatMap(e => Array.isArray(e.tags) ? e.tags : [])).size;
    const responsaveisUnicos = new Set(evidences.map(e => e.responsavel).filter(Boolean)).size;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const novasNoMes = evidences.filter(e => {
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
        state.evidences = state.evidences.map(item => {
          if (item.id === updatedEvidence.id) {
            return {
              ...item,
              ...updatedEvidence,
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