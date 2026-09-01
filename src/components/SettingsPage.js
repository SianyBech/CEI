// ==========================================================================
// COMPONENTE: PÁGINA DE CONFIGURAÇÕES DA CONTA E SISTEMA CEI/UFRGS
// ==========================================================================

(function () {
  async function render(onCloseCallback, onSaveCallback) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    backdrop.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background-color: rgba(0, 0, 0, 0.5) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 99999 !important;
    `;

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 620px; width: 92%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--primary, #0066cc); display: flex;">
              <i data-lucide="settings" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Configurações do Usuário</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Gerencie suas informações pessoais e preferências de exibição</p>
            </div>
          </div>
          <button class="modal-close" id="set-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo da Modal -->
        <div class="modal-body" id="settings-modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem;">
          <p style="text-align: center; color: var(--text-secondary);">Carregando dados da conta...</p>
        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 0.5rem; flex-shrink: 0;">
          <button class="btn btn-secondary" id="set-close-bottom-btn" style="padding: 0.5rem 1.25rem;">Cancelar</button>
          <button class="btn btn-primary" id="set-save-btn" style="padding: 0.5rem 1.5rem;" disabled>Salvar Alterações</button>
        </div>

      </div>
    `;

    function closeModal() {
      backdrop.remove();
      if (typeof onCloseCallback === 'function') onCloseCallback();
    }

    backdrop.querySelector('#set-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#set-close-bottom-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

// 1. Busca dados do perfil com fallback inteligente do localStorage
    let userProfile = null;
    let localData = {};
    
    try {
      localData = JSON.parse(localStorage.getItem('cerne:userProfile') || '{}');
    } catch (e) {
      localData = {};
    }

    try {
      userProfile = await window.CerneApp.Api.fetchUserProfile();
    } catch (err) {
      console.warn('Falha ao carregar perfil via API, usando fallback local:', err);
      userProfile = localData;
    }

    // Garante que se o perfil da API vier sem cor, usamos a do localStorage ou a padrão
    const userName = userProfile?.nome || localData.nome || 'Gestor CEI';
    const userEmail = userProfile?.email || localData.email || '';
    const userRole = userProfile?.cargo || localData.cargo || 'Analista CEI';
    const userSelectedColor = userProfile?.cor || localData.cor || '#0066cc'; // <--- Lê a cor do localData se a API não trouxer
    
    const userConfigs = userProfile?.configuracoes || localData.configuracoes || {};
    const defaultView = userConfigs.defaultView || 'table';
    const itemsPerPage = userConfigs.itemsPerPage || 10;

    // Paleta de cores para o avatar
    const userColorPalette = ['#0066cc', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    // Renderiza as bolinhas da paleta usando userSelectedColor
    const colorOptionsHtml = userColorPalette.map(color => `
      <button 
        type="button" 
        class="color-picker-dot ${userSelectedColor === color ? 'selected' : ''}" 
        data-color="${color}" 
        style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid ${userSelectedColor === color ? 'var(--text-primary)' : 'transparent'}; cursor: pointer; transition: transform 0.15s ease;"
      ></button>
    `).join('');

    // Preenche a modal com as seções organizadas
    const modalBody = backdrop.querySelector('#settings-modal-body');
    modalBody.innerHTML = `
      <!-- Seção 1: Perfil da Conta -->
      <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; background-color: var(--bg-secondary, #f9fafb);">
        <h3 style="font-size: 0.9rem; font-weight: 600; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
          <i data-lucide="user" style="width: 16px; height: 16px; color: var(--primary, #0066cc);"></i>
          Perfil da Conta
        </h3>

        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">Nome de Usuário</label>
            <input type="text" id="set-user-name" class="form-input" value="${userName}" placeholder="Seu nome completo" style="width: 100%; padding: 0.45rem 0.65rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-primary);" />
          </div>

          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 0.25rem;">E-mail Institucional</label>
            <input type="email" id="set-user-email" class="form-input" value="${userEmail}" disabled placeholder="seu.email@ufrgs.br" style="width: 100%; padding: 0.45rem 0.65rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-tertiary); color: var(--text-secondary); cursor: not-allowed;" />
          </div>

          <div>
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 0.25rem;">Cargo / Função na Incubadora</label>
            <input type="text" id="set-user-role" class="form-input" value="${userRole}" disabled style="width: 100%; padding: 0.45rem 0.65rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-tertiary); color: var(--text-secondary); cursor: not-allowed;" />
            <small style="font-size: 0.72rem; color: var(--text-tertiary); margin-top: 2px; display: block;">Gerenciado pela administração do CEI.</small>
          </div>

          <!-- Seletor de Cor de Destaque -->
          <div style="margin-top: 0.5rem;">
            <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-primary); display: block; margin-bottom: 0.4rem;">Cor de Identificação (Avatar)</label>
            <div id="set-color-picker" style="display: flex; gap: 0.6rem; align-items: center;">
              ${colorOptionsHtml}
            </div>
          </div>
        </div>
      </div>

      <!-- Seção 2: Preferências do Sistema -->
      <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; background-color: var(--bg-secondary, #f9fafb);">
        <h3 style="font-size: 0.9rem; font-weight: 600; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
          <i data-lucide="sliders" style="width: 16px; height: 16px; color: var(--primary, #0066cc);"></i>
          Preferências do Sistema
        </h3>

        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">Modo de Visualização Padrão</strong>
              <span style="font-size: 0.75rem; color: var(--text-secondary);">Como a lista é carregada ao abrir o app</span>
            </div>
            <select id="set-view-select" class="form-select" style="padding: 0.4rem 0.6rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color);">
              <option value="table" ${defaultView === 'table' ? 'selected' : ''}>Tabela Detalhada</option>
              <option value="grid" ${defaultView === 'grid' ? 'selected' : ''}>Grid de Cards</option>
            </select>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
            <div>
              <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">Itens por Página</strong>
              <span style="font-size: 0.75rem; color: var(--text-secondary);">Quantidade personalizada por página</span>
            </div>
            <input 
              type="number" 
              id="set-per-page-input" 
              class="form-input" 
              value="${itemsPerPage}" 
              min="1" 
              max="500" 
              style="width: 80px; padding: 0.4rem 0.6rem; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); text-align: center;" 
            />
          </div>
        </div>
      </div>
    `;

    // Lógica para alternar a seleção de cores ao clicar nas bolinhas
    let currentColorSelected = userSelectedColor;
    modalBody.querySelectorAll('.color-picker-dot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        modalBody.querySelectorAll('.color-picker-dot').forEach(b => {
          b.style.borderColor = 'transparent';
          b.classList.remove('selected');
        });
        btn.style.borderColor = 'var(--text-primary)';
        btn.classList.add('selected');
        currentColorSelected = btn.getAttribute('data-color');
      });
    });

    const saveBtn = backdrop.querySelector('#set-save-btn');
    saveBtn.removeAttribute('disabled');

    // 2. Ação de Salvar Atualizada
    saveBtn.addEventListener('click', async () => {
      const rawPerPage = parseInt(backdrop.querySelector('#set-per-page-input').value, 10);
      const perPage = (!isNaN(rawPerPage) && rawPerPage > 0) ? rawPerPage : 10;

      const payload = {
        nome: backdrop.querySelector('#set-user-name').value.trim(),
        cargo: backdrop.querySelector('#set-user-role').value.trim(),
        cor: currentColorSelected, // <--- Cor selecionada pelas bolinhas
        configuracoes: {
          defaultView: backdrop.querySelector('#set-view-select').value,
          itemsPerPage: perPage
        }
      };

      try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Salvando...';

        let updatedUser = null;
        try {
          updatedUser = await window.CerneApp.Api.updateUserProfile(payload);
        } catch (apiErr) {
          console.warn('API não respondeu, salvando localmente:', apiErr);
        }

        // Se a API não retornar a cor salva, garantimos que o objeto final tenha a cor escolhida
        const finalUserProfile = {
          ...localData,
          ...(updatedUser || {}),
          ...payload // Garante que 'cor', 'nome' e 'configuracoes' persistam no localStorage
        };
        
        // Persiste o perfil completo com a cor atualizada
        localStorage.setItem('cerne:userProfile', JSON.stringify(finalUserProfile));
        localStorage.setItem('cerne:settings', JSON.stringify(finalUserProfile.configuracoes));

        if (typeof onSaveCallback === 'function') {
          onSaveCallback(finalUserProfile);
        }

        closeModal();
      } catch (error) {
        alert(`Erro ao salvar configurações: ${error.message}`);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar Alterações';
      }
    });
    if (window.lucide) lucide.createIcons();

    return backdrop;
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.SettingsPage = { render };
})();