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

    // 1. Processamento das Categorias
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

    // 2. Mapeamento de Formatos de Arquivo
    const tiposCount = { pdf: 0, imagem: 0, planilha: 0, video: 0, link: 0, documento: 0, outros: 0 };
    evidences.forEach(e => {
      const tipo = (e.tipo || '').toLowerCase();
      if (tiposCount[tipo] !== undefined) {
        tiposCount[tipo]++;
      } else {
        tiposCount['outros']++;
      }
    });

    // 3. Processamento das Tags mais utilizadas
    const tagsCount = {};
    evidences.forEach(e => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach(t => {
          if (t && t.trim()) {
            tagsCount[t] = (tagsCount[t] || 0) + 1;
          }
        });
      }
    });

    const totalResponsaveis = new Set(evidences.map(e => e.responsavel).filter(Boolean)).size;
    const chartColors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

    // Helper genérico para gerar Gráfico de Rosca (Donut SVG Interativo)
    function generateInteractiveDonutSvg(dataEntries, totalSum, chartId) {
      if (totalSum === 0 || dataEntries.length === 0) {
        return `
          <div style="position: relative; width: 130px; height: 130px; margin: 0 auto;">
            <svg viewBox="0 0 42 42" style="width: 100%; height: 100%;">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--border-color, #e5e7eb)" stroke-width="5"></circle>
            </svg>
            <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--text-tertiary);">Sem dados</div>
          </div>
        `;
      }

      let accumulatedPercent = 0;
      let segmentsHtml = '';

      dataEntries.forEach(([label, count], index) => {
        const percent = (count / totalSum) * 100;
        const color = chartColors[index % chartColors.length];
        const strokeDasharray = `${percent} ${100 - percent}`;
        const strokeDashoffset = 100 - accumulatedPercent + 25;
        const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);

        segmentsHtml += `
          <circle
            class="donut-segment"
            cx="21" cy="21" r="15.915494309189533"
            fill="transparent"
            stroke="${color}"
            stroke-width="5"
            stroke-dasharray="${strokeDasharray}"
            stroke-dashoffset="${strokeDashoffset}"
            data-label="${formattedLabel}"
            data-count="${count}"
            data-percent="${Math.round(percent)}"
            style="cursor: pointer; transition: stroke-width 0.2s ease, transform 0.2s ease; transform-origin: center;"
          ></circle>
        `;
        accumulatedPercent += percent;
      });

      return `
        <div style="position: relative; width: 130px; height: 130px; margin: 0 auto 0.75rem auto;">
          <svg viewBox="0 0 42 42" style="width: 100%; height: 100%; transform: rotate(-90deg); overflow: visible;">
            ${segmentsHtml}
          </svg>
          <div id="${chartId}-tooltip" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; text-align: center; padding: 4px;">
            <span class="donut-total-num" style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); line-height: 1;">${totalSum}</span>
            <span class="donut-total-label" style="font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; margin-top: 2px;">Total</span>
          </div>
        </div>
      `;
    }

    // Prepara dados dos 2 gráficos de rosca
    const entriesTipos = Object.entries(tiposCount).filter(([_, c]) => c > 0);
    const totalTipos = entriesTipos.reduce((acc, [_, c]) => acc + c, 0);
    const donutFormatosSvg = generateInteractiveDonutSvg(entriesTipos, totalTipos, 'donut-formatos');

    const entriesTags = Object.entries(tagsCount).sort((a, b) => b[1] - a[1]).slice(0, 6); // Top 6 tags
    const totalTags = entriesTags.reduce((acc, [_, c]) => acc + c, 0);
    const donutTagsSvg = generateInteractiveDonutSvg(entriesTags, totalTags, 'donut-tags');

    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 920px; width: 94%; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 16px; box-shadow: var(--shadow-lg);">
        
        <!-- Header -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="background-color: var(--success-bg, #dcfce7); padding: 0.6rem; border-radius: 10px; color: var(--success, #16a34a); display: flex;">
              <i data-lucide="bar-chart-3" style="width: 22px; height: 22px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.2rem; margin: 0; font-weight: 700;">Relatórios & Métricas Executive</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Painel analítico do acervo de evidências do CEI/UFRGS</p>
            </div>
          </div>
          <button class="modal-close" id="rel-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-tertiary);">
            <i data-lucide="x" style="width: 22px; height: 22px;"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Top Cards -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
            <div style="padding: 1rem 1.25rem; background: linear-gradient(135deg, rgba(22, 163, 74, 0.05) 0%, rgba(22, 163, 74, 0.12) 100%); border: 1px solid var(--success-border, #a7f3d0); border-radius: 12px;">
              <span style="font-size: 0.72rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">Total de Evidências</span>
              <div style="font-size: 1.8rem; font-weight: 800; color: var(--success, #16a34a); margin-top: 0.15rem;">${totalEvidencias}</div>
            </div>

            <div style="padding: 1rem 1.25rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px;">
              <span style="font-size: 0.72rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">Categorias CERNE Ativas</span>
              <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-top: 0.15rem;">${Object.keys(categoriasCount).length}</div>
            </div>

            <div style="padding: 1rem 1.25rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px;">
              <span style="font-size: 0.72rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">Membros Colaboradores</span>
              <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-top: 0.15rem;">${totalResponsaveis}</div>
            </div>
          </div>

          <!-- Dual Column Layout (Gráficos) -->
          <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 1.25rem; align-items: stretch;">
            
            <!-- Coluna Esquerda: Gráfico de Barras (Categorias) -->
            <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; background-color: var(--bg-primary); display: flex; flex-direction: column;">
              <h3 style="font-size: 0.95rem; font-weight: 700; margin: 0 0 1rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                <i data-lucide="layers" style="width: 18px; height: 18px; color: var(--success);"></i>
                Distribuição por Categoria CERNE
              </h3>

              <div style="display: flex; flex-direction: column; gap: 0.85rem; flex: 1; justify-content: center;">
                ${Object.keys(categoriasCount).length === 0 ? '<p style="font-size: 0.85rem; color: var(--text-tertiary); font-style: italic;">Nenhuma categoria registrada.</p>' : ''}
                
                ${Object.entries(categoriasCount).map(([cat, qtd], index) => {
                  const percentual = totalEvidencias > 0 ? Math.round((qtd / totalEvidencias) * 100) : 0;
                  const color = chartColors[index % chartColors.length];
                  return `
                    <div>
                      <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.3rem;">
                        <span style="font-weight: 600; color: var(--text-primary);">${cat}</span>
                        <span style="color: var(--text-secondary); font-weight: 500;">${qtd} <small style="color: var(--text-tertiary);">(${percentual}%)</small></span>
                      </div>
                      <div style="width: 100%; background-color: var(--bg-tertiary); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${percentual}%; background-color: ${color}; height: 100%; border-radius: 4px;"></div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Coluna Direita: Dois Gráficos de Rosca Empilhados -->
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              
              <!-- Rosca 1: Formatos de Arquivos -->
              <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; background-color: var(--bg-primary);">
                <h3 style="font-size: 0.88rem; font-weight: 700; margin: 0 0 0.75rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                  <i data-lucide="pie-chart" style="width: 16px; height: 16px; color: var(--success);"></i>
                  Formatos de Mídia
                </h3>
                <div style="display: flex; align-items: center; gap: 1rem;">
                  ${donutFormatosSvg}
                  <div style="display: flex; flex-direction: column; gap: 0.3rem; flex: 1;">
                    ${entriesTipos.map(([tipo, count], idx) => {
                      const color = chartColors[idx % chartColors.length];
                      return `
                        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem;">
                          <span style="display: flex; align-items: center; gap: 0.35rem; color: var(--text-secondary);">
                            <span style="width: 7px; height: 7px; border-radius: 50%; background-color: ${color}; inline-block;"></span>
                            ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                          </span>
                          <strong style="color: var(--text-primary);">${count}</strong>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>

              <!-- Rosca 2: Top Tags Utilizadas -->
              <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem 1.25rem; background-color: var(--bg-primary);">
                <h3 style="font-size: 0.88rem; font-weight: 700; margin: 0 0 0.75rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                  <i data-lucide="tag" style="width: 16px; height: 16px; color: var(--success);"></i>
                  Principais Tags
                </h3>
                <div style="display: flex; align-items: center; gap: 1rem;">
                  ${donutTagsSvg}
                  <div style="display: flex; flex-direction: column; gap: 0.3rem; flex: 1;">
                    ${entriesTags.length === 0 ? '<span style="font-size: 0.75rem; color: var(--text-tertiary);">Nenhuma tag registrada.</span>' : ''}
                    ${entriesTags.map(([tag, count], idx) => {
                      const color = chartColors[idx % chartColors.length];
                      return `
                        <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem;">
                          <span style="display: flex; align-items: center; gap: 0.35rem; color: var(--text-secondary); max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${tag}">
                            <span style="width: 7px; height: 7px; border-radius: 50%; background-color: ${color}; inline-block;"></span>
                            ${tag}
                          </span>
                          <strong style="color: var(--text-primary);">${count}</strong>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              </div>

            </div>

          </div>

          <!-- Cards Detalhados de Formato por Mídia -->
          <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem; background-color: var(--bg-primary);">
            <h3 style="font-size: 0.9rem; font-weight: 700; margin: 0 0 0.85rem 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="file-check" style="width: 17px; height: 17px; color: var(--success);"></i>
              Detalhamento Técnico de Formatos
            </h3>

            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.65rem;">
              <div style="padding: 0.65rem 0.4rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="file-text" class="file-icon-pdf" style="width: 15px; height: 15px; margin-bottom: 2px;"></i>
                <div style="font-size: 0.68rem; color: var(--text-secondary); font-weight: 600;">PDFs</div>
                <strong style="font-size: 1rem; color: var(--text-primary);">${tiposCount.pdf}</strong>
              </div>

              <div style="padding: 0.65rem 0.4rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="image" class="file-icon-imagem" style="width: 15px; height: 15px; margin-bottom: 2px;"></i>
                <div style="font-size: 0.68rem; color: var(--text-secondary); font-weight: 600;">Imagens</div>
                <strong style="font-size: 1rem; color: var(--text-primary);">${tiposCount.imagem}</strong>
              </div>

              <div style="padding: 0.65rem 0.4rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="file-spreadsheet" class="file-icon-planilha" style="width: 15px; height: 15px; margin-bottom: 2px;"></i>
                <div style="font-size: 0.68rem; color: var(--text-secondary); font-weight: 600;">Planilhas</div>
                <strong style="font-size: 1rem; color: var(--text-primary);">${tiposCount.planilha}</strong>
              </div>

              <div style="padding: 0.65rem 0.4rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="video" class="file-icon-video" style="width: 15px; height: 15px; margin-bottom: 2px;"></i>
                <div style="font-size: 0.68rem; color: var(--text-secondary); font-weight: 600;">Vídeos</div>
                <strong style="font-size: 1rem; color: var(--text-primary);">${tiposCount.video}</strong>
              </div>

              <div style="padding: 0.65rem 0.4rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="link" class="file-icon-link" style="width: 15px; height: 15px; margin-bottom: 2px;"></i>
                <div style="font-size: 0.68rem; color: var(--text-secondary); font-weight: 600;">Links</div>
                <strong style="font-size: 1rem; color: var(--text-primary);">${tiposCount.link}</strong>
              </div>

              <div style="padding: 0.65rem 0.4rem; border: 1px solid var(--border-color); border-radius: 8px; text-align: center; background-color: var(--bg-secondary);">
                <i data-lucide="file" class="file-icon-documento" style="width: 15px; height: 15px; margin-bottom: 2px;"></i>
                <div style="font-size: 0.68rem; color: var(--text-secondary); font-weight: 600;">Outros</div>
                <strong style="font-size: 1rem; color: var(--text-primary);">${tiposCount.documento + tiposCount.outros}</strong>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
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

    // Anexa listeners de hover dinâmico nos gráficos de rosca
    backdrop.querySelectorAll('.donut-segment').forEach(segment => {
      segment.addEventListener('mouseenter', (e) => {
        const target = e.target;
        const container = target.closest('div');
        const tooltip = container.querySelector('[id$="-tooltip"]');
        if (!tooltip) return;

        target.style.strokeWidth = '6.5';
        target.style.transform = 'scale(1.04)';

        const label = target.getAttribute('data-label');
        const count = target.getAttribute('data-count');
        const percent = target.getAttribute('data-percent');

        tooltip.innerHTML = `
          <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-primary); line-height: 1; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${label}</span>
          <span style="font-size: 0.72rem; color: var(--success, #16a34a); font-weight: 700; margin-top: 2px;">${count} (${percent}%)</span>
        `;
      });

      segment.addEventListener('mouseleave', (e) => {
        const target = e.target;
        const container = target.closest('div');
        const tooltip = container.querySelector('[id$="-tooltip"]');
        if (!tooltip) return;

        target.style.strokeWidth = '5';
        target.style.transform = 'scale(1)';

        const totalNum = container.querySelector('svg').parentElement.dataset.totalSum || '';

        // Restaura valor padrão
        const isFormatos = tooltip.id.includes('formatos');
        const defaultTotal = isFormatos ? totalTipos : totalTags;

        tooltip.innerHTML = `
          <span class="donut-total-num" style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); line-height: 1;">${defaultTotal}</span>
          <span class="donut-total-label" style="font-size: 0.65rem; color: var(--text-tertiary); text-transform: uppercase; margin-top: 2px;">Total</span>
        `;
      });
    });

    // Inicialização dos Ícones Lucide
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      setTimeout(() => window.lucide.createIcons(), 10);
    }

    return backdrop;
  }

  window.CerneApp = window.CerneApp || {};
  window.CerneApp.RelatoriosPage = { render: render };
})();