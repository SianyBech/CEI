// ==========================================================================
// COMPONENTE: PÁGINA / MODAL DE RESPONSÁVEIS E GESTÃO DE MEMBROS
// ==========================================================================

(function () {
  async function render(isAdmin = false, onCloseCallback) {
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
      <div class="modal-content" style="max-width: 680px; width: 92%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--primary, #0066cc); display: flex;">
              <i data-lucide="users" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Responsáveis e Equipe CEI</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Membros cadastrados no sistema de gestão de evidências</p>
            </div>
          </div>
          <button class="modal-close" id="resp-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Botão Novo Membro (Exibido apenas se for Admin) -->
        ${isAdmin ? `
        <div style="padding: 1rem 1.5rem 0.5rem 1.5rem; display: flex; justify-content: flex-end;">
          <button class="btn btn-primary" id="btn-add-new-member" style="font-size: 0.85rem; padding: 0.4rem 0.85rem; display: flex; align-items: center; gap: 0.4rem;">
            <i data-lucide="user-plus" style="width: 16px; height: 16px;"></i>
            Novo Membro
          </button>
        </div>
        ` : ''}

        <!-- Lista de Usuários -->
        <div class="modal-body" id="resp-modal-body" style="padding: 1rem 1.5rem 1.5rem 1.5rem; flex: 1; overflow-y: auto;">
          <p style="text-align: center; color: var(--text-secondary);">Carregando equipe...</p>
        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; flex-shrink: 0;">
          <button class="btn btn-secondary" id="resp-close-bottom-btn" style="padding: 0.5rem 1.25rem;">Fechar</button>
        </div>
      </div>
    `;

    function closeModal() {
      backdrop.remove();
      if (typeof onCloseCallback === 'function') onCloseCallback();
    }

function getUserAvatarStyle(user) {
      // Lê a cor diretamente da coluna do banco enviada pela API
      const dbColor = user?.cor || user?.color;
      
      if (dbColor) {
        return `background-color: ${dbColor} !important; color: #ffffff !important; font-weight: 600;`;
      }

      // Paleta fallback apenas se o registro no banco estiver nulo
      const palette = ['#0066cc', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0284c7'];
      const userName = user?.nome || '';
      
      if (!userName) {
        return `background-color: var(--primary, #0066cc) !important; color: #ffffff !important; font-weight: 600;`;
      }

      let hash = 0;
      for (let i = 0; i < userName.length; i++) {
        hash = userName.charCodeAt(i) + ((hash << 5) - hash);
      }

      const index = Math.abs(hash) % palette.length;
      return `background-color: ${palette[index]} !important; color: #ffffff !important; font-weight: 600;`;
    }

    backdrop.querySelector('#resp-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#resp-close-bottom-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

    // Busca e renderiza a lista de usuários
    async function loadMembersList() {
      const modalBody = backdrop.querySelector('#resp-modal-body');
      try {
        const users = await window.CerneApp.Api.fetchAllUsers();

        if (!users || users.length === 0) {
          modalBody.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Nenhum membro encontrado.</p>';
          return;
        }

        modalBody.innerHTML = '';
        const listContainer = document.createElement('div');
        listContainer.style.cssText = 'display: flex; flex-direction: column; gap: 0.75rem;';

        users.forEach(u => {
          const roleLabel = u.role === 'admin' 
            ? '<span style="font-size:0.7rem; background:#0066cc15; color:#0066cc; padding: 2px 8px; border-radius:12px; font-weight:600;">Admin</span>' 
            : '';

          const avatarStyle = getUserAvatarStyle(u);

          const itemRow = document.createElement('div');
          itemRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background-color: var(--bg-secondary);';

          // Layout ajustado: E-mail em uma linha, Cargo na linha de baixo
          itemRow.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.95rem; flex-shrink: 0; ${avatarStyle}">
                ${(u.nome || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
                  ${u.nome} ${roleLabel}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 1px;">${u.email}</div>
                <div style="font-size: 0.73rem; color: var(--text-tertiary); font-weight: 500; margin-top: 1px;">${u.cargo || 'Analista'}</div>
              </div>
            </div>

            ${isAdmin ? `
            <div style="display: flex; gap: 0.5rem;">
              <button type="button" class="btn-edit-member" data-id="${u.id}" style="background: none; border: none; cursor: pointer; color: var(--primary, #0066cc); padding: 0.4rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s;" title="Editar membro">
                <i data-lucide="edit" style="width: 18px; height: 18px;"></i>
              </button>
              <button type="button" class="btn-delete-member" data-id="${u.id}" style="background: none; border: none; cursor: pointer; color: var(--danger, #ff4757); padding: 0.4rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s;" title="Excluir membro">
                <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
              </button>
            </div>
            ` : ''}
          `;

          if (isAdmin) {
            const editBtn = itemRow.querySelector('.btn-edit-member');
            if (editBtn) {
              editBtn.addEventListener('click', () => {
                openEditUserSubmodal(u, async () => {
                  await loadMembersList();
                });
              });
            }

            const deleteBtn = itemRow.querySelector('.btn-delete-member');
            if (deleteBtn) {
              deleteBtn.addEventListener('click', async () => {
                const confirmDelete = confirm(`Tem certeza de que deseja remover o membro "${u.nome}" do sistema?\n\nEsta ação não pode ser desfeita.`);
                if (!confirmDelete) return;

                deleteBtn.disabled = true;
                
                try {
                  await window.CerneApp.Api.deleteUserByAdmin(u.id);
                  await loadMembersList();
                } catch (err) {
                  alert(`Não foi possível excluir o membro: ${err.message}`);
                  deleteBtn.disabled = false;
                }
              });
            }
          }

          listContainer.appendChild(itemRow);
        });

        modalBody.appendChild(listContainer);
        if (window.lucide) lucide.createIcons();

      } catch (err) {
        modalBody.innerHTML = '<p style="text-align: center; color: var(--danger);">Erro ao carregar lista de membros.</p>';
      }
    }

    await loadMembersList();

    if (isAdmin) {
      const addBtn = backdrop.querySelector('#btn-add-new-member');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          openCreateUserSubmodal(async () => {
            await loadMembersList();
          });
        });
      }
    }

    if (window.lucide) lucide.createIcons();

    return backdrop;
  }

  // ==========================================
  // MODAL DE CADASTRO
  // ==========================================
  function openCreateUserSubmodal(onSuccess) {
    const subBackdrop = document.createElement('div');
    subBackdrop.className = 'modal-backdrop';
    subBackdrop.style.cssText = `
      position: fixed !important; top: 0 !important; left: 0 !important;
      width: 100vw !important; height: 100vh !important;
      background-color: rgba(0, 0, 0, 0.6) !important;
      display: flex !important; align-items: center !important; justify-content: center !important;
      z-index: 100000 !important;
    `;

    subBackdrop.innerHTML = `
      <div class="modal-content" style="max-width: 480px; width: 90%; background-color: var(--bg-primary); border-radius: 12px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);">
        <h3 style="margin-top: 0; font-size: 1.05rem; font-weight: 600;">Cadastrar Novo Membro</h3>
        
        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
          <div>
            <label style="font-size: 0.8rem; font-weight: 600;">Nome Completo</label>
            <input type="text" id="new-user-nome" class="form-input" style="width: 100%; padding: 0.4rem;" placeholder="Ex: Maria Oliveira" />
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600;">E-mail Institucional</label>
            <input type="email" id="new-user-email" class="form-input" style="width: 100%; padding: 0.4rem;" placeholder="maria@ufrgs.br" />
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600;">Cargo / Função</label>
            <input type="text" id="new-user-cargo" class="form-input" style="width: 100%; padding: 0.4rem;" placeholder="Ex: Bolsista CERNE" />
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600;">Senha Temporária</label>
            <input type="password" id="new-user-password" class="form-input" style="width: 100%; padding: 0.4rem;" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label style="font-size: 0.8rem; font-weight: 600;">Nível de Acesso</label>
            <select id="new-user-role" class="form-select" style="width: 100%; padding: 0.4rem;">
              <option value="membro">Membro da Equipe</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;">
          <button class="btn btn-secondary" id="cancel-submodal-btn">Cancelar</button>
          <button class="btn btn-primary" id="save-submodal-btn">Cadastrar</button>
        </div>
      </div>
    `;

    document.body.appendChild(subBackdrop);

    subBackdrop.querySelector('#cancel-submodal-btn').addEventListener('click', () => subBackdrop.remove());
    subBackdrop.querySelector('#save-submodal-btn').addEventListener('click', async () => {
      const nome = subBackdrop.querySelector('#new-user-nome').value.trim();
      const email = subBackdrop.querySelector('#new-user-email').value.trim();
      const cargo = subBackdrop.querySelector('#new-user-cargo').value.trim();
      const password = subBackdrop.querySelector('#new-user-password').value.trim();
      const role = subBackdrop.querySelector('#new-user-role').value;

      if (!nome || !email || !password) {
        alert('Por favor, preencha Nome, E-mail e Senha.');
        return;
      }

      try {
        await window.CerneApp.Api.createNewUser({ nome, email, cargo, password, role });
        alert('Membro cadastrado com sucesso!');
        subBackdrop.remove();
        if (typeof onSuccess === 'function') onSuccess();
      } catch (err) {
        alert(`Erro ao cadastrar: ${err.message}`);
      }
    });
  }

  // ==========================================
  // MODAL DE EDIÇÃO (COM SELETOR DE COR)
  // ==========================================
 // 2. Leitura consistente da cor atual na submodal do Admin
function openEditUserSubmodal(user, onSuccess) {
  let selectedColor = user.cor || user.color || '#0066cc';

  const subBackdrop = document.createElement('div');
  subBackdrop.className = 'modal-backdrop';
  subBackdrop.style.cssText = `
    position: fixed !important; top: 0 !important; left: 0 !important;
    width: 100vw !important; height: 100vh !important;
    background-color: rgba(0, 0, 0, 0.6) !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    z-index: 100000 !important;
  `;

  const userColorPalette = ['#0066cc', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const colorDotsHTML = userColorPalette.map(c => `
      <button 
        type="button" 
        class="admin-color-picker-dot" 
        data-color="${c}" 
        style="
          background-color: ${c}; 
          width: 26px; 
          height: 26px; 
          border-radius: 50%; 
          border: 2px solid ${selectedColor === c ? 'var(--text-primary, #0f172a)' : 'transparent'}; 
          cursor: pointer;
          transition: transform 0.15s ease;
        "
      ></button>
    `).join('');

    subBackdrop.innerHTML = `
      <div class="modal-content" style="max-width: 480px; width: 90%; background-color: var(--bg-primary); border-radius: 12px; padding: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2);">
        <h3 style="margin-top: 0; font-size: 1.05rem; font-weight: 600;">Editar Membro</h3>
        <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1rem;">Você está editando: <strong>${user.email}</strong></p>
        
        <div style="display: flex; flex-direction: column; gap: 0.85rem;">
          <div>
            <label style="font-size: 0.8rem; font-weight: 600;">Nome Completo</label>
            <input type="text" id="edit-user-nome" class="form-input" style="width: 100%; padding: 0.4rem;" value="${user.nome || ''}" />
          </div>

          <div>
            <label style="font-size: 0.8rem; font-weight: 600;">Cargo / Função</label>
            <input type="text" id="edit-user-cargo" class="form-input" style="width: 100%; padding: 0.4rem;" value="${user.cargo || ''}" />
          </div>

          <div>
            <label style="font-size: 0.8rem; font-weight: 600;">Nível de Acesso</label>
            <select id="edit-user-role" class="form-select" style="width: 100%; padding: 0.4rem;">
              <option value="membro" ${user.role !== 'admin' ? 'selected' : ''}>Membro da Equipe</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
            </select>
          </div>

          <!-- Seletor de Cor do Avatar -->
          <div>
            <label style="font-size: 0.8rem; font-weight: 600; display: block; margin-bottom: 0.35rem;">Cor de Identificação (Avatar)</label>
            <div id="admin-color-picker" style="display: flex; gap: 0.5rem; align-items: center;">
              ${colorDotsHTML}
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.5rem;">
          <button class="btn btn-secondary" id="cancel-edit-btn">Cancelar</button>
          <button class="btn btn-primary" id="save-edit-btn">Salvar Alterações</button>
        </div>
      </div>
    `;

    document.body.appendChild(subBackdrop);

    // Event listener para seleção da cor
    subBackdrop.querySelectorAll('.admin-color-picker-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        subBackdrop.querySelectorAll('.admin-color-picker-dot').forEach(d => d.style.borderColor = 'transparent');
        dot.style.borderColor = 'var(--text-primary, #0f172a)';
        selectedColor = dot.getAttribute('data-color');
      });
    });

    subBackdrop.querySelector('#cancel-edit-btn').addEventListener('click', () => subBackdrop.remove());

    subBackdrop.querySelector('#save-edit-btn').addEventListener('click', async () => {
      const nome = subBackdrop.querySelector('#edit-user-nome').value.trim();
      const cargo = subBackdrop.querySelector('#edit-user-cargo').value.trim();
      const role = subBackdrop.querySelector('#edit-user-role').value;

      if (!nome) {
        alert('O nome não pode ficar em branco.');
        return;
      }

      const saveBtn = subBackdrop.querySelector('#save-edit-btn');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Salvando...';

      try {
        await window.CerneApp.Api.updateUserByAdmin(user.id, { 
          nome, 
          cargo, 
          role, 
          cor: selectedColor 
        });
        
        subBackdrop.remove();
        if (typeof onSuccess === 'function') onSuccess();
      } catch (err) {
        alert(`Erro ao atualizar: ${err.message}`);
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar Alterações';
      }
    });
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.ResponsaveisPage = { render };
})();