// ==========================================================================
// COMPONENTE: GESTÃO DE CATEGORIAS CERNE (CEI/UFRGS)
// ==========================================================================
function showSuccessToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    background-color: #10b981 !important;
    color: #ffffff !important;
    padding: 0.75rem 1.25rem !important;
    border-radius: 8px !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
    z-index: 999999 !important;
    display: flex !important;
    align-items: center !important;
    gap: 0.5rem !important;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
    transform: translateY(-10px);
  `;
  
  toast.innerHTML = `<i data-lucide="check-circle" style="width: 18px; height: 18px;"></i> ${message}`;
  document.body.appendChild(toast);
  if (window.lucide) lucide.createIcons({ node: toast });

  // Animação de entrada
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Remove após 3 segundos com animação de saída
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

(function () {
  function render(onCloseCallback) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background-color: rgba(15, 23, 42, 0.55) !important;
      backdrop-filter: blur(4px) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 99999 !important;
    `;

    let settingsData = {};
    let categories = [];
    let isLoading = true;

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 560px; width: 92%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: rgba(0, 102, 204, 0.08); padding: 0.55rem; border-radius: 8px; color: var(--primary, #0066cc); display: flex;">
              <i data-lucide="folder-kanban" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.05rem; margin: 0; font-weight: 600; color: var(--text-primary);">Gestão de Categorias</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Categorias do modelo CERNE cadastradas no CEI</p>
            </div>
          </div>
          <button class="modal-close" id="cat-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 0.25rem; border-radius: 6px; display: flex;">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo da Modal -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Add Form -->
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="cat-add-input" class="form-input" placeholder="Nova categoria (ex: Processo de Seleção)..." style="flex: 1; padding: 0.6rem 0.85rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.875rem;" />
            <button class="btn btn-primary" id="cat-add-btn" style="padding: 0.6rem 1.1rem; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; gap: 0.4rem; white-space: nowrap; border-radius: 8px;">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Adicionar
            </button>
          </div>

          <!-- Items List Container -->
          <div id="cat-items-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="text-align: center; padding: 2rem; color: var(--text-secondary); font-size: 0.875rem;">
              <i data-lucide="loader-2" class="spin" style="width: 22px; height: 22px; margin-bottom: 0.5rem;"></i>
              <p style="margin: 0;">Carregando categorias do banco...</p>
            </div>
          </div>

        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.5rem; flex-shrink: 0; background-color: var(--bg-secondary, #fafafa);">
          <button class="btn btn-secondary" id="cat-cancel-btn" style="padding: 0.5rem 1.25rem; border-radius: 8px;">Cancelar</button>
          <button class="btn btn-primary" id="cat-save-btn" style="padding: 0.5rem 1.5rem; border-radius: 8px;">Salvar Alterações</button>
        </div>

      </div>
    `;

    const listContainer = backdrop.querySelector('#cat-items-list');

function renderList() {
      listContainer.innerHTML = '';

      if (categories.length === 0) {
        listContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary); text-align: center; margin: 1.5rem 0;">Nenhuma categoria salva.</p>`;
        return;
      }

      categories.forEach((cat, index) => {
        // Busca a cor e estilo dinâmicos da categoria cadastrados no sistema
        const dynamicStyle = window.getCategoryStyle ? window.getCategoryStyle(cat) : '';

        const itemRow = document.createElement('div');
        itemRow.style.cssText = `
          display: flex; 
          align-items: center; 
          gap: 0.75rem; 
          padding: 0.45rem 0.5rem 0.45rem 0.85rem; 
          border-radius: 8px;
          transition: all 0.15s ease;
          ${dynamicStyle} /* Aplica a cor de fundo e do texto da categoria */
        `;

        itemRow.innerHTML = `
          <input 
            type="text" 
            class="cat-item-input" 
            value="${cat}" 
            data-index="${index}" 
            style="
              flex: 1; 
              background: transparent; 
              border: none; 
              outline: none; 
              font-size: 0.875rem; 
              font-weight: 600; 
              color: inherit; /* Herda a cor do texto definida pelo getCategoryStyle */
              padding: 0.2rem 0;
            " 
          />
          <button 
            class="cat-delete-btn" 
            data-index="${index}" 
            style="
              background-color: rgba(255, 255, 255, 0.8); 
              border: 1px solid rgba(0, 0, 0, 0.08); 
              border-radius: 6px; 
              width: 30px; 
              height: 30px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: #ef4444; 
              cursor: pointer; 
              transition: all 0.15s ease;
            " 
            title="Excluir categoria"
          >
            <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
          </button>
        `;

        itemRow.querySelector('.cat-item-input').addEventListener('input', (e) => {
          categories[index] = e.target.value;
          
          // Opcional: Re-aplica a cor dinamicamente se a pessoa mudar o nome digitando
          if (window.getCategoryStyle) {
            itemRow.style.cssText = `
              display: flex; align-items: center; gap: 0.75rem; 
              padding: 0.45rem 0.5rem 0.45rem 0.85rem; border-radius: 8px;
              ${window.getCategoryStyle(e.target.value)}
            `;
          }
        });

        itemRow.querySelector('.cat-delete-btn').addEventListener('click', () => {
          categories.splice(index, 1);
          renderList();
        });

        listContainer.appendChild(itemRow);
      });

      if (window.lucide) lucide.createIcons();
    }

    // Carregamento de dados em segundo plano (Assíncrono sem travar a modal)
    (async function loadData() {
      try {
        if (window.CerneApp?.Api?.fetchSettings) {
          settingsData = (await window.CerneApp.Api.fetchSettings()) || {};
          categories = Array.isArray(settingsData.categories) ? [...settingsData.categories] : [];
        }
      } catch (err) {
        console.error('[CategoriesPage] Erro ao buscar categorias:', err);
      } finally {
        isLoading = false;
        renderList();
      }
    })();

    // Eventos
    backdrop.querySelector('#cat-add-btn').addEventListener('click', () => {
      const input = backdrop.querySelector('#cat-add-input');
      const val = input.value.trim();
      if (val) {
        categories.push(val);
        input.value = '';
        renderList();
      }
    });

async function saveToDatabase() {
  const saveBtn = backdrop.querySelector('#cat-save-btn');
  const cancelBtn = backdrop.querySelector('#cat-cancel-btn'); 
  
  const filtered = categories.map(c => c.trim()).filter(Boolean);
  
  try {
    // 1. Bloqueia os botões e mostra "Salvando..."
    saveBtn.disabled = true;
    cancelBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    if (window.CerneApp?.Api?.updateSettings) {
      const updatedSettings = await window.CerneApp.Api.updateSettings({ ...settingsData, categories: filtered });
      
      if (window.CerneApp?.state) {
        window.CerneApp.state.appSettings = updatedSettings || { ...settingsData, categories: filtered };
      }
    }

    // 2. Fecha o modal e dispara o aviso flutuante no canto superior direito
    closeModal();
    showSuccessToast('Categorias atualizadas com sucesso!');

  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert('Erro ao salvar alterações no banco de dados.');
    
    // Restaura o botão se der erro
    saveBtn.disabled = false;
    cancelBtn.disabled = false;
    saveBtn.textContent = 'Salvar Alterações';
  }

  // Dentro de saveToDatabase() em CategoriesPage.js e TagsPage.js:
if (window.CerneApp?.Api?.updateSettings) {
  const updatedSettings = await window.CerneApp.Api.updateSettings({ ...settingsData, categories: filtered }); // ou tags: filtered
  
  // Atualiza o estado global se houver referência
  if (window.CerneApp?.state) {
    window.CerneApp.state.appSettings = updatedSettings;
  }

  // Se a função global de popular filtros existir no escopo da aplicação, atualiza na hora
  if (typeof populateFilterOptions === 'function') {
    populateFilterOptions();
  }
}

}

    function closeModal() {
      backdrop.remove();
      if (typeof onCloseCallback === 'function') onCloseCallback();
    }

    backdrop.querySelector('#cat-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#cat-cancel-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#cat-save-btn').addEventListener('click', saveToDatabase);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

    setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 0);

    return backdrop;
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.CategoriesPage = { render };
})();