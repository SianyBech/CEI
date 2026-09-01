// ==========================================================================
// COMPONENTE: ABA / PÁGINA DE RELATÓRIOS E INDICADORES CEI/UFRGS
// ==========================================================================

(function () {
  async function render(evidences = [], onCloseCallback) {
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

    const totalEvidencias = evidences.length;

    // 1. Processamento das Categorias (removendo fallback "Geral" para strings vazias)
    const categoriasCount = {};
    evidences.forEach(e => {
      const cats = Array.isArray(e.categorias) && e.categorias.length > 0 
        ? e.categorias 
        : (e.categoria ? [e.categoria] : []);
      cats.forEach(c => {
        if (c && c.trim()) {
          categoriasCount[c] = (categoriasCount[c] || 0) + 1;
        }
      });
    });

    // 2. Mapeamento dos Novos Formatos de Arquivo Expandidos
    const tiposCount = { pdf: 0, imagem: 0, planilha: 0, video: 0, link: 0, documento: 0, outros: 0 };
    evidences.forEach(e => {
      const tipo = (e.tipo || '').toLowerCase();
      if (tiposCount[tipo] !== undefined) {
        tiposCount[tipo]++;
      } else {
        tiposCount['outros']++;
      }
    });

    const totalResponsaveis = new Set(evidences.map(e => e.responsavel).filter(Boolean)).size;

    // Paleta de Cores Executiva para os Gráficos
    const chartColors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

    // 3. Geração do Gráfico de Rosca (Donut Chart em SVG)
    let donutSegmentsSvg = '';
    let accumulatedPercent = 0;
    const entriesTipos = Object.entries(tiposCount).filter(([_, count]) => count > 0);
    const totalTiposValidos = entriesTipos.reduce((acc, [_, count]) => acc + count, 0);

    if (totalTiposValidos > 0) {
      entriesTipos.forEach(([tipo, count], index) => {
        const percent = (count / totalTiposValidos) * 100;
        const color = chartColors[index % chartColors.length];
        
        // Círculo com raio 15.915494309189533 resulta em circunferência exata de 100
        const strokeDasharray = `${percent} ${100 - percent}`;
        const strokeDashoffset = 100 - accumulatedPercent + 25; // Inicia no topo (12 horas)
        
        donutSegmentsSvg += `
          <circle
            cx="21" cy="21" r="15.915494309189533"
            fill="transparent"
            stroke="${color}"
            stroke-width="5"
            stroke-dasharray="${strokeDasharray}"
            stroke-dashoffset="${strokeDashoffset}"
          ></circle>
        `;
        accumulatedPercent += percent;
      });
    } else {
      donutSegmentsSvg = `
        <circle cx="21" cy="21" r="15.915494309189533" fill="transparent" stroke="#e5e7eb" stroke-width="5"></circle>
      `;
    }

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 850px; width: 92%; max-height: 88vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 16px; box-shadow: var(--shadow-lg);">
        
        <!-- Header executivo -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="background-color: var(--success-bg, #dc fce7); padding: 0.6rem; border-radius: 10px; color: var(--success, #16a34a); display: flex;">
              <i data-lucide="bar-chart-3" style="width: 22px; height: 22px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.2rem; margin: 0; font-weight: 700;">Relatórios & Métricas Executive</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Indicadores de desempenho do acervo de evidências do CEI/UFRGS</p>
            </div>
          </div>
          <button class="modal-close" id="rel-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-tertiary);">
            <i data-lucide="x" style="width: 22px; height: 22px;"></i>
          </button>
        </div>

        <!-- Body da Modal com Grid Executivo -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Cards de Métricas Principais -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            <div style="padding: 1.25rem; background: linear-gradient(135deg, rgba(22, 163, 74, 0.05) 0%, rgba(22, 163, 74, 0.12) 100%); border: 1px solid var(--success-border, #a7f3d0); border-radius: 12px; text-align: left;">
              <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Total de Evidências</span>
              <div style="font-size: 2rem; font-weight: 800; color: var(--success, #16a34a); margin-top: 0.25rem;">${totalEvidencias}</div>
            </div>

            <div style="padding: 1.25rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; text-align: left;">
              <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Categorias Ativas</span>
              <div style="font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.25rem;">${Object.keys(categoriasCount).length}</div>
            </div>

            <div style="padding: 1.25rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; text-align: left;">
              <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Membros com Envio</span>
              <div style="font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.25rem;">${totalResponsaveis}</div>
            </div>
          </div>

          <!-- Seção Principal de Gráficos Dual-Column -->
          <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1.25rem;">
            
            <!-- Gráfico em Barras: Distribuição por Categoria CERNE -->
            <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; background-color: var(--bg-primary);">
              <h3 style="font-size: 0.95rem; font-weight: 700; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="layers" style="width: 18px; height: 18px; color: var(--success);"></i>
                Categorias CERNE
              </h3>

              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${Object.keys(categoriasCount).length === 0 ? '<p style="font-size: 0.85rem; color: var(--text-tertiary); italic;">Nenhuma categoria registrada.</p>' : ''}
                
                ${Object.entries(categoriasCount).map(([cat, qtd], index) => {
                  const percentual = totalEvidencias > 0 ? Math.round((qtd / totalEvidencias) * 100) : 0;
                  const color = chartColors[index % chartColors.length];
                  return `
                    <div>
                      <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.35rem;">
                        <span style="font-weight: 600; color: var(--text-primary);">${cat}</span>
                        <span style="color: var(--text-secondary); font-weight: 500;">${qtd} <small style="color: var(--text-tertiary);">(${percentual}%)</small></span>
                      </div>
                      <div style="width: 100%; background-color: var(--bg-tertiary); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${percentual}%; background-color: ${color}; height: 100%; border-radius: 4px; transition: width 0.5s ease;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Gráfico de Rosca (Donut): Formatos e Tipos de Mídia -->
            <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; background-color: var(--bg-primary); display: flex; flex-direction: column;">
              <h3 style="font-size: 0.95rem; font-weight: 700; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="pie-chart" style="width: 18px; height: 18px; color: var(--success);"></i>
                Formatos de Arquivo
              </h3>

              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1;">
                <div style="position: relative; width: 140px; height: 140px; margin-bottom: 1rem;">
                  <svg viewBox="0 0 42 42" style="width: 100%; height: 100%; transform: rotate(-90deg); border-radius: 50%;">
                    ${donutSegmentsSvg}
                  </svg>
                  <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
                    <span style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); line-height: 1;">${totalTiposValidos}</span>
                    <span style="font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; margin-top: 2px;">Arquivos</span>
                  </div>
                </div>

                <!-- Legenda do Gráfico de Rosca -->
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem 0.85rem; justify-content: center; width: 100%;">
                  ${entriesTipos.map(([tipo, count], idx) => {
                    const color = chartColors[idx % chartColors.length];
                    const labelFormatada = tipo.charAt(0).toUpperCase() + tipo.slice(1);
                    return `
                      <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.78rem;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; display: inline-block;"></span>
                        <span style="color: var(--text-secondary);">${labelFormatada}:</span>
                        <strong style="color: var(--text-primary);">${count}</strong>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

            </div>

          </div>

          <!-- Cards Detalhados dos Formatos Atualizados -->
          <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; background-color: var(--bg-primary);">
            <h3 style="font-size: 0.95rem; font-weight: 700; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="file-check" style="width: 18px; height: 18px; color: var(--success);"></i>
              Detalhamento de Acervo por Mídia
            </h3>

            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.65rem;">
              <div style="padding: 0.75rem 0.5rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="file-text" class="file-icon-pdf" style="width: 16px; height: 16px; margin-bottom: 4px;"></i>
                <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600;">PDFs</div>
                <strong style="font-size: 1.1rem; color: var(--text-primary);">${tiposCount.pdf}</strong>
              </div>

              <div style="padding: 0.75rem 0.5rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="image" class="file-icon-imagem" style="width: 16px; height: 16px; margin-bottom: 4px;"></i>
                <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600;">Imagens</div>
                <strong style="font-size: 1.1rem; color: var(--text-primary);">${tiposCount.imagem}</strong>
              </div>

              <div style="padding: 0.75rem 0.5rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="file-spreadsheet" class="file-icon-planilha" style="width: 16px; height: 16px; margin-bottom: 4px;"></i>
                <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600;">Planilhas</div>
                <strong style="font-size: 1.1rem; color: var(--text-primary);">${tiposCount.planilha}</strong>
              </div>

              <div style="padding: 0.75rem 0.5rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="video" class="file-icon-video" style="width: 16px; height: 16px; margin-bottom: 4px;"></i>
                <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600;">Vídeos</div>
                <strong style="font-size: 1.1rem; color: var(--text-primary);">${tiposCount.video}</strong>
              </div>

              <div style="padding: 0.75rem 0.5rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="link" class="file-icon-link" style="width: 16px; height: 16px; margin-bottom: 4px;"></i>
                <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600;">Links</div>
                <strong style="font-size: 1.1rem; color: var(--text-primary);">${tiposCount.link}</strong>
              </div>

              <div style="padding: 0.75rem 0.5rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="file" class="file-icon-documento" style="width: 16px; height: 16px; margin-bottom: 4px;"></i>
                <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 600;">Outros</div>
                <strong style="font-size: 1.1rem; color: var(--text-primary);">${tiposCount.documento + tiposCount.outros}</strong>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer da Modal -->
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

    // Inicialização dos Ícones Lucide dentro da modal
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      setTimeout(() => window.lucide.createIcons(), 10);
    }

    return backdrop;
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.RelatoriosPage = { render: render };
})();