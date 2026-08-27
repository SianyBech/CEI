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

        modalBody.innerHTML = ''; // Limpa o container antes de renderizar
        const listContainer = document.createElement('div');
        listContainer.style.cssText = 'display: flex; flex-direction: column; gap: 0.75rem;';

        users.forEach(u => {
          const roleLabel = u.role === 'admin' 
            ? '<span style="font-size:0.7rem; background:#0066cc15; color:#0066cc; padding: 2px 8px; border-radius:12px; font-weight:600;">Admin</span>' 
            : '';

          const itemRow = document.createElement('div');
          itemRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; background-color: var(--bg-secondary);';

          itemRow.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--primary, #0066cc); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem;">
                ${(u.nome || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
                  ${u.nome} ${roleLabel}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${u.email} • ${u.cargo || 'Analista'}</div>
              </div>
            </div>

${isAdmin ? `
  <div style="display: flex; gap: 0.5rem;">
    <!-- Botão de Editar -->
    <button type="button" class="btn-edit-member" data-id="${u.id}" data-nome="${u.nome}" data-cargo="${u.cargo || ''}" style="background: none; border: none; cursor: pointer; color: var(--primary, #0066cc); padding: 0.4rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s;" title="Editar membro">
      <i data-lucide="edit" style="width: 18px; height: 18px;"></i>
    </button>

    <!-- Botão de Excluir original -->
    <button type="button" class="btn-delete-member" data-id="${u.id}" data-nome="${u.nome}" style="background: none; border: none; cursor: pointer; color: var(--danger, #ff4757); padding: 0.4rem; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s;" title="Excluir membro">
      <i data-lucide="trash-2" style="width: 18px; height: 18px;"></i>
    </button>
  </div>
` : ''}
          `;

          // Handler de exclusão do membro
         if (isAdmin) {
  const deleteBtn = itemRow.querySelector('.btn-delete-member');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      const confirmDelete = confirm(`Tem certeza de que deseja remover o membro "${u.nome}" do sistema?\n\nEsta ação não pode ser desfeita.`);
      if (!confirmDelete) return;

      deleteBtn.disabled = true;
      
      try {
        // Chamada à API
        await window.CerneApp.Api.deleteUserByAdmin(u.id);
        
        // Recarrega a lista diretamente do banco para atualizar a tela sem precisar de F5
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

    // Evento para abrir a submodal de criação de membro (se for Admin)
    if (isAdmin) {
      const addBtn = backdrop.querySelector('#btn-add-new-member');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          openCreateUserSubmodal(async () => {
            await loadMembersList(); // Recarrega a lista após cadastrar
          });
        });
      }
    }

    if (window.lucide) lucide.createIcons();

    return backdrop;
  }

  // Modal secundária para digitar os dados do novo membro
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

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.ResponsaveisPage = { render };
})();