// ==========================================================================
// COMPONENTE: GESTÃO DEDICADA DE TAGS / ETIQUETAS (CEI/UFRGS)
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
    let tags = [];

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 560px; width: 92%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: rgba(0, 102, 204, 0.08); padding: 0.55rem; border-radius: 8px; color: var(--primary, #0066cc); display: flex;">
              <i data-lucide="tag" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.05rem; margin: 0; font-weight: 600; color: var(--text-primary);">Gestão de Tags</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Etiquetas para classificação rápida salvas no banco</p>
            </div>
          </div>
          <button class="modal-close" id="tag-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary); padding: 0.25rem; border-radius: 6px; display: flex;">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo da Modal -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Input -->
          <div style="display: flex; gap: 0.5rem;">
            <input type="text" id="tag-add-input" class="form-input" placeholder="Nova tag (ex: Auditoria)..." style="flex: 1; padding: 0.6rem 0.85rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.875rem;" />
            <button class="btn btn-primary" id="tag-add-btn" style="padding: 0.6rem 1.1rem; font-size: 0.85rem; font-weight: 500; display: flex; align-items: center; gap: 0.4rem; white-space: nowrap; border-radius: 8px;">
              <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Adicionar
            </button>
          </div>

          <!-- Nuvem de Tags -->
          <div id="tag-cloud-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 1.25rem; background-color: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color); border-radius: 8px; min-height: 120px; align-content: flex-start;">
            <div style="text-align: center; width: 100%; padding: 1.5rem; color: var(--text-secondary); font-size: 0.875rem;">
              Carregando tags do banco...
            </div>
          </div>

        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.5rem; flex-shrink: 0; background-color: var(--bg-secondary, #fafafa);">
          <button class="btn btn-secondary" id="tag-cancel-btn" style="padding: 0.5rem 1.25rem; border-radius: 8px;">Cancelar</button>
          <button class="btn btn-primary" id="tag-save-btn" style="padding: 0.5rem 1.5rem; border-radius: 8px;">Salvar Alterações</button>
        </div>

      </div>
    `;

    const cloudContainer = backdrop.querySelector('#tag-cloud-container');
    const input = backdrop.querySelector('#tag-add-input');

    function renderTags() {
      cloudContainer.innerHTML = '';

      if (tags.length === 0) {
        cloudContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary); margin: auto;">Nenhuma tag cadastrada.</p>`;
        return;
      }

      tags.forEach((tag, index) => {
  const badge = document.createElement('span');
  // 💡 ESTILO ATUALIZADO: Fundo roxo suave com borda e texto roxo/violeta
  badge.style.cssText = `
    display: inline-flex; 
    align-items: center; 
    gap: 0.4rem; 
    padding: 0.35rem 0.75rem; 
    background-color: #f3e8ff; 
    color: #6b21a8; 
    font-size: 0.825rem; 
    border-radius: 20px; 
    font-weight: 500;
    border: 1px solid #e9d5ff;
  `;

  badge.innerHTML = `
    <span># ${tag}</span>
    <button 
      class="tag-del-btn" 
      data-index="${index}" 
      style="
        background: none; 
        border: none; 
        padding: 0; 
        cursor: pointer; 
        display: flex; 
        align-items: center; 
        color: #6b21a8; 
        opacity: 0.7;
      " 
      title="Remover tag"
    >
      <i data-lucide="x" style="width: 14px; height: 14px;"></i>
    </button>
  `;

  badge.querySelector('.tag-del-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    tags.splice(index, 1);
    renderTags();
  });

  cloudContainer.appendChild(badge);
});

      if (window.lucide) lucide.createIcons();
    }

    // Carga de Dados Assíncrona
    (async function loadData() {
      try {
        if (window.CerneApp?.Api?.fetchSettings) {
          settingsData = (await window.CerneApp.Api.fetchSettings()) || {};
          tags = Array.isArray(settingsData.tags) ? [...settingsData.tags] : [];
        }
      } catch (err) {
        console.error('[TagsPage] Erro ao buscar tags:', err);
      } finally {
        renderTags();
      }
    })();

    function addTag() {
      const val = input.value.trim();
      if (val && !tags.includes(val)) {
        tags.push(val);
        input.value = '';
        renderTags();
      }
    }

    backdrop.querySelector('#tag-add-btn').addEventListener('click', addTag);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    });

async function saveToDatabase() {
  const saveBtn = backdrop.querySelector('#tag-save-btn');
  const cancelBtn = backdrop.querySelector('#tag-cancel-btn');
  
  const filtered = tags.map(t => t.trim()).filter(Boolean);
  
  try {
    // 1. Bloqueia os botões e mostra "Salvando..."
    saveBtn.disabled = true;
    cancelBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';

    if (window.CerneApp?.Api?.updateSettings) {
      const updatedSettings = await window.CerneApp.Api.updateSettings({ ...settingsData, tags: filtered });
      
      if (window.CerneApp?.state) {
        window.CerneApp.state.appSettings = updatedSettings || { ...settingsData, tags: filtered };
      }
    }

    // 2. Fecha o modal e dispara o aviso flutuante no canto superior direito
    closeModal();
    showSuccessToast('Tags atualizadas com sucesso!');

  } catch (err) {
    console.error('Erro ao salvar:', err);
    alert('Erro ao salvar alterações no banco de dados.');
    
    // Restaura o botão se der erro
    saveBtn.disabled = false;
    cancelBtn.disabled = false;
    saveBtn.textContent = 'Salvar Alterações';
  }

if (window.CerneApp?.Api?.updateSettings) {
  const updatedSettings = await window.CerneApp.Api.updateSettings({ ...settingsData, tags: filtered });
  
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

    backdrop.querySelector('#tag-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#tag-cancel-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#tag-save-btn').addEventListener('click', saveToDatabase);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

    return backdrop;
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.TagsPage = { render };
})();