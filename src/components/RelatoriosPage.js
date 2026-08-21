// ==========================================================================
// COMPONENTE: ABA / PÁGINA DE RELATÓRIOS E INDICADORES CEI/UFRGS
// ==========================================================================

(function () {
  function render(evidences = [], onCloseCallback) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    
    // Garantia de posicionamento e z-index
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

    // CÁLCULO DAS ESTATÍSTICAS
    const totalEvidencias = evidences.length;

    // Contagem por Categoria
    const categoriasCount = {};
    evidences.forEach(e => {
      const cats = Array.isArray(e.categorias) && e.categorias.length > 0 
        ? e.categorias 
        : [e.categoria || 'Geral'];
      cats.forEach(c => {
        categoriasCount[c] = (categoriasCount[c] || 0) + 1;
      });
    });

    // Contagem por Tipo
    const tiposCount = { pdf: 0, imagem: 0, documento: 0, outros: 0 };
    evidences.forEach(e => {
      const tipo = (e.tipo || '').toLowerCase();
      if (tiposCount[tipo] !== undefined) {
        tiposCount[tipo]++;
      } else {
        tiposCount['outros']++;
      }
    });

    // Responsáveis Únicos
    const totalResponsaveis = new Set(evidences.map(e => e.responsavel).filter(Boolean)).size;

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 750px; width: 92%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--success); display: flex;">
              <i data-lucide="bar-chart-3" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Relatórios e Indicadores</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Visão executiva do acervo de evidências do CEI/UFRGS</p>
            </div>
          </div>
          <button class="modal-close" id="rel-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo do Relatório -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Cards de Resumo Superior -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            <div style="padding: 1rem; background-color: var(--bg-secondary, #f9fafb); border: 1px solid var(--border-color); border-radius: 8px; text-align: center;">
              <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Total de Evidências</span>
              <div style="font-size: 1.6rem; font-weight: 700; color: var(--primary, #0066cc); margin-top: 0.25rem;">${totalEvidencias}</div>
            </div>

            <div style="padding: 1rem; background-color: var(--bg-secondary, #f9fafb); border: 1px solid var(--border-color); border-radius: 8px; text-align: center;">
              <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Categorias Ativas</span>
              <div style="font-size: 1.6rem; font-weight: 700; color: var(--primary, #0066cc); margin-top: 0.25rem;">${Object.keys(categoriasCount).length}</div>
            </div>

            <div style="padding: 1rem; background-color: var(--bg-secondary, #f9fafb); border: 1px solid var(--border-color); border-radius: 8px; text-align: center;">
              <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Membros Ativos</span>
              <div style="font-size: 1.6rem; font-weight: 700; color: var(--primary, #0066cc); margin-top: 0.25rem;">${totalResponsaveis}</div>
            </div>
          </div>

          <!-- Seção 1: Distribuição por Categoria CERNE -->
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; background-color: #ffffff;">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="grid" style="width: 16px; height: 16px; color: var(--primary, #0066cc);"></i>
              Distribuição por Categoria CERNE
            </h3>

            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${Object.keys(categoriasCount).length === 0 ? '<p style="font-size: 0.85rem; color: var(--text-secondary);">Nenhuma categoria cadastrada.</p>' : ''}
              
              ${Object.entries(categoriasCount).map(([cat, qtd]) => {
                const percentual = totalEvidencias > 0 ? Math.round((qtd / totalEvidencias) * 100) : 0;
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.3rem;">
                      <span style="font-weight: 500; color: var(--text-primary);">${cat}</span>
                      <span style="color: var(--text-secondary);">${qtd} (${percentual}%)</span>
                    </div>
                    <div style="width: 100%; background-color: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${percentual}%; background-color: var(--primary, #0066cc); height: 100%; border-radius: 4px;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Seção 2: Distribuição por Tipo de Arquivo -->
          <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 1.25rem; background-color: #ffffff;">
            <h3 style="font-size: 0.9rem; font-weight: 600; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="file-text" style="width: 16px; height: 16px; color: var(--primary, #0066cc);"></i>
              Formatos de Arquivos no Acervo
            </h3>

            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
              <div style="padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 0.85rem; color: var(--text-secondary);">PDFs</span>
                <strong style="font-size: 1rem; color: var(--text-primary);">${tiposCount.pdf}</strong>
              </div>
              <div style="padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 0.85rem; color: var(--text-secondary);">Imagens</span>
                <strong style="font-size: 1rem; color: var(--text-primary);">${tiposCount.imagem}</strong>
              </div>
              <div style="padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 0.85rem; color: var(--text-secondary);">Documentos</span>
                <strong style="font-size: 1rem; color: var(--text-primary);">${tiposCount.documento + tiposCount.outros}</strong>
              </div>
            </div>
          </div>

        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; flex-shrink: 0;">
          <button class="btn btn-secondary" id="rel-close-bottom-btn" style="padding: 0.5rem 1.5rem;">Fechar</button>
        </div>

      </div>
    `;

    function closeModal() {
      backdrop.remove();
      if (typeof onCloseCallback === 'function') onCloseCallback();
    }

    backdrop.querySelector('#rel-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#rel-close-bottom-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    return backdrop;
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.RelatoriosPage = { render };
})();

// No final de RelatoriosPage.js
window.CerneApp = window.CerneApp || {};
window.CerneApp.RelatoriosPage = { render };