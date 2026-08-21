// ==========================================================================
// COMPONENTE: ABA / PÁGINA DE CALENDÁRIO DE EVIDÊNCIAS CERNE (CEI/UFRGS)
// ==========================================================================

(function () {
  function render(evidences = [], onCloseCallback) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    // ESTILOS DE SEGURANÇA: Centraliza a modal na tela sobre o overlay escuro
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

    let currentDate = new Date();
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    // Mapeia evidências por data no formato DD/MM/YYYY
    function getEvidencesByDateMap() {
      const map = {};
      evidences.forEach(ev => {
        if (!ev.data) return;
        const cleanData = String(ev.data).trim();
        if (!map[cleanData]) map[cleanData] = [];
        map[cleanData].push(ev);
      });
      return map;
    }

    // Gera lista de anos (de 2016 até o ano atual + 5)
    const currentYear = new Date().getFullYear();
    const startYear = 2016;
    const endYear = currentYear + 5;
    let yearOptionsHTML = '';
    for (let y = startYear; y <= endYear; y++) {
      yearOptionsHTML += `<option value="${y}">${y}</option>`;
    }

    // Estrutura HTML da Modal
    backdrop.innerHTML = `
      <div class="modal-content" style="max-width: 700px; width: 90%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; background-color: var(--bg-primary, #ffffff); border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
        
        <!-- Cabeçalho -->
        <div class="modal-header" style="flex-shrink: 0; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background-color: var(--bg-tertiary); padding: 0.5rem; border-radius: 8px; color: var(--success); display: flex;">
              <i data-lucide="calendar" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <h2 class="modal-title" style="font-size: 1.1rem; margin: 0; font-weight: 600;">Calendário de Evidências</h2>
              <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">Acompanhamento temporal das entregas do CEI/UFRGS</p>
            </div>
          </div>
          <button class="modal-close" id="cal-close-btn" style="background: none; border: none; cursor: pointer; color: var(--text-secondary);">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <!-- Corpo da Modal -->
        <div class="modal-body" style="padding: 1.5rem; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1.25rem;">
          
          <!-- Controles do Mês e Seletores Rápidos de Mês/Ano -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary, #f9fafb); padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color);">
            <button id="cal-prev-month" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.3rem;">
              <i data-lucide="chevron-left" style="width: 16px; height: 16px;"></i> Anterior
            </button>

            <!-- Dropdowns interativos para Mês e Ano -->
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <select id="cal-month-select" class="form-select" style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary); padding: 0.35rem 0.6rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-primary, #ffffff); cursor: pointer;">
                ${monthNames.map((m, idx) => `<option value="${idx}">${m}</option>`).join('')}
              </select>

              <select id="cal-year-select" class="form-select" style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary); padding: 0.35rem 0.6rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-primary, #ffffff); cursor: pointer;">
                ${yearOptionsHTML}
              </select>
            </div>

            <button id="cal-next-month" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; display: flex; align-items: center; gap: 0.3rem;">
              Próximo <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
            </button>
          </div>

          <!-- Grid dos Dias do Mês -->
          <div id="cal-grid-container" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.4rem; text-align: center;">
            <!-- Renderizado dinamicamente via JS -->
          </div>

          <!-- Painel de Detalhes do Dia Selecionado -->
          <div id="cal-selected-day-details" style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 0.5rem;">
            <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: var(--text-secondary); font-weight: 600;" id="cal-selected-date-label">
              Clique em um dia para ver as evidências
            </h4>
            <div id="cal-evidence-list" style="display: flex; flex-direction: column; gap: 0.5rem;">
              <!-- Evidências do dia aparecem aqui -->
            </div>
          </div>

        </div>

        <!-- Rodapé -->
        <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; flex-shrink: 0;">
          <button class="btn btn-secondary" id="cal-close-bottom-btn" style="padding: 0.5rem 1.5rem;">Fechar</button>
        </div>

      </div>
    `;

    const monthSelect = backdrop.querySelector('#cal-month-select');
    const yearSelect = backdrop.querySelector('#cal-year-select');

    // Função Principal de Renderização dos Dias
    function renderCalendar() {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const evidencesMap = getEvidencesByDateMap();

      // Sincroniza os dropdowns com a data atual do estado
      monthSelect.value = month;
      yearSelect.value = year;

      const grid = backdrop.querySelector('#cal-grid-container');
      grid.innerHTML = '';

      // Cabeçalho dos dias da semana
      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      weekDays.forEach(day => {
        const headerCell = document.createElement('div');
        headerCell.style.cssText = 'font-weight: 600; font-size: 0.75rem; color: var(--text-secondary); padding: 0.4rem; text-transform: uppercase;';
        headerCell.textContent = day;
        grid.appendChild(headerCell);
      });

      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Células vazias antes do 1º dia
      for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement('div'));
      }

      // Preenche os dias do mês
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
        const dayEvidences = evidencesMap[dateStr] || [];

        const dayCell = document.createElement('div');
        dayCell.style.cssText = `
          padding: 0.6rem 0.2rem;
          border-radius: 6px;
          border: 1px solid ${dayEvidences.length > 0 ? 'var(--primary, #0066cc)' : 'var(--border-color)'};
          background-color: ${dayEvidences.length > 0 ? 'rgba(0, 102, 204, 0.08)' : 'var(--bg-primary, #ffffff)'};
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          align-items: center;
        `;

        dayCell.innerHTML = `
          <span style="font-weight: ${dayEvidences.length > 0 ? '700' : '400'}; font-size: 0.85rem; color: ${dayEvidences.length > 0 ? 'var(--primary, #0066cc)' : 'var(--text-primary)'};">${day}</span>
          ${dayEvidences.length > 0 ? `<span style="font-size: 0.65rem; font-weight: 600; background: var(--primary, #0066cc); color: white; padding: 1px 5px; border-radius: 10px; margin-top: 2px;">${dayEvidences.length}</span>` : ''}
        `;

        dayCell.addEventListener('click', () => {
          grid.querySelectorAll('div').forEach(c => c.style.outline = 'none');
          dayCell.style.outline = '2px solid var(--primary, #0066cc)';
          showDayEvidences(dateStr, dayEvidences);
        });

        grid.appendChild(dayCell);
      }

      if (window.lucide) lucide.createIcons();
    }

    // Exibe lista de evidências do dia selecionado
    function showDayEvidences(dateStr, list) {
      const label = backdrop.querySelector('#cal-selected-date-label');
      const container = backdrop.querySelector('#cal-evidence-list');

      label.textContent = `Evidências cadastradas em ${dateStr} (${list.length}):`;
      container.innerHTML = '';

      if (list.length === 0) {
        container.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-secondary); font-style: italic; margin: 0;">Nenhuma evidência registrada nesta data.</p>`;
        return;
      }

      list.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.style.cssText = 'padding: 0.75rem; background: var(--bg-secondary, #f9fafb); border: 1px solid var(--border-color); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;';
        itemCard.innerHTML = `
          <div>
            <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">${item.titulo || item.nome}</strong>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">${item.evento} • ${item.responsavel}</span>
          </div>
          <span class="badge" style="font-size: 0.7rem; padding: 0.2rem 0.5rem; background: rgba(0, 102, 204, 0.1); color: var(--primary, #0066cc); border-radius: 4px;">${item.categoria || 'Geral'}</span>
        `;
        container.appendChild(itemCard);
      });
    }

    // Eventos dos botões "Anterior" e "Próximo"
    backdrop.querySelector('#cal-prev-month').addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });

    backdrop.querySelector('#cal-next-month').addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });

    // Eventos de troca direta nos Dropdowns de Mês e Ano
    monthSelect.addEventListener('change', (e) => {
      currentDate.setMonth(parseInt(e.target.value, 10));
      renderCalendar();
    });

    yearSelect.addEventListener('change', (e) => {
      currentDate.setFullYear(parseInt(e.target.value, 10));
      renderCalendar();
    });

    // Fechamento
    function closeModal() {
      backdrop.remove();
      if (typeof onCloseCallback === 'function') onCloseCallback();
    }

    backdrop.querySelector('#cal-close-btn').addEventListener('click', closeModal);
    backdrop.querySelector('#cal-close-bottom-btn').addEventListener('click', closeModal);
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

    // Renderização inicial
    setTimeout(() => renderCalendar(), 0);

    return backdrop;
  }

  // Registra no namespace global
  window.CerneApp = window.CerneApp || {};
  window.CerneApp.CalendarioPage = { render };
})();