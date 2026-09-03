window.CerneApp = window.CerneApp || {};

window.CerneApp.EvidenceCard = {
  render(evidences, onViewDetailsClick, listaResponsaveis = []) {
    const container = document.createElement('div');

    const listaFinalResponsaveis = Array.isArray(listaResponsaveis) && listaResponsaveis.length > 0
      ? listaResponsaveis
      : [...new Set((evidences || []).map(e => e.responsavel).filter(Boolean))];

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Helper para sanitizar o HTML permitindo tags simples de negrito no resumo
    function renderSafeSummary(summaryText) {
      if (!summaryText || summaryText.trim() === '') {
        return 'Sem resumo disponível.';
      }

      let safe = escapeHtml(summaryText);

      return safe
        .replace(/&lt;b&gt;/g, '<b>')
        .replace(/&lt;\/b&gt;/g, '</b>')
        .replace(/&lt;strong&gt;/g, '<strong>')
        .replace(/&lt;\/strong&gt;/g, '</strong>');
    }

function getAvatarStyle(responsavelName, customColor) {
      // Se a evidência veio do banco trazendo a cor do responsável
      if (customColor) {
        return `background-color: ${customColor} !important; color: #ffffff !important; font-weight: 600;`;
      }

      // Paleta fallback apenas para evidências antigas sem cor vinculada
      const palette = ['#0066cc', '#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0284c7'];
      if (!responsavelName) {
        return `background-color: var(--primary); color: #ffffff; font-weight: 600;`;
      }

      let hash = 0;
      for (let i = 0; i < responsavelName.length; i++) {
        hash = responsavelName.charCodeAt(i) + ((hash << 5) - hash);
      }

      const index = Math.abs(hash) % palette.length;
      return `background-color: ${palette[index]} !important; color: #ffffff !important; font-weight: 600;`;
    }

    function formatResponsavelName(nomeCompleto, lista = []) {
      if (!nomeCompleto) return 'Equipe CEI';

      const partes = nomeCompleto.trim().split(/\s+/);
      const primeiroNome = partes[0];

      if (partes.length === 1) return primeiroNome;

      const nomeLower = nomeCompleto.trim().toLowerCase();

      const temDuplicado = lista.some(outroNome => {
        if (!outroNome) return false;
        const outroTrim = outroNome.trim();
        const outroLower = outroTrim.toLowerCase();

        if (
          outroLower === nomeLower ||
          outroLower.startsWith(nomeLower) ||
          nomeLower.startsWith(outroLower)
        ) {
          return false;
        }

        const outroPrimeiro = outroTrim.split(/\s+/)[0];
        return outroPrimeiro.toLowerCase() === primeiroNome.toLowerCase();
      });

      if (temDuplicado) {
        const ultimoSobrenome = partes[partes.length - 1];
        return `${primeiroNome} ${ultimoSobrenome}`;
      }

      return primeiroNome;
    }

    const getTypeConfig = (tipo) => {
      switch (tipo) {
        case 'pdf':
          return { icon: 'file-text', klass: 'file-icon-pdf', label: 'PDF' };
        case 'imagem':
          return { icon: 'image', klass: 'file-icon-imagem', label: 'Imagem' };
        case 'planilha':
          return { icon: 'file-spreadsheet', klass: 'file-icon-planilha', label: 'Planilha' };
        case 'video':
          return { icon: 'video', klass: 'file-icon-video', label: 'Vídeo' };
        case 'link':
          return { icon: 'link', klass: 'file-icon-link', label: 'Link' };
        default:
          return { icon: 'file', klass: 'file-icon-documento', label: 'Documento' };
      }
    };

    const truncateWords = (str, max) => {
      if (!str || str.trim() === '' || str.trim().toLowerCase() === 'sem evento') return '';
      const words = str.trim().split(/\s+/);
      return words.length > max ? words.slice(0, max).join(' ') + '...' : str;
    };

    if (!Array.isArray(evidences) || evidences.length === 0) {
      container.className = 'table-container';
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-illustration">
            <div class="empty-state-illustration-glow"></div>
            <div class="empty-state-illustration-frame">
              <i data-lucide="file-text" class="empty-state-illustration-icon doc-icon"></i>
              <i data-lucide="search" class="empty-state-illustration-icon search-icon"></i>
            </div>
          </div>
          <h3>Nenhuma evidência encontrada</h3>
          <p>Tente ajustar os termos de pesquisa ou cadastrar uma nova evidência.</p>
          <button type="button" class="empty-state-action-btn">
            <i data-lucide="plus" class="empty-state-action-icon"></i>
            Cadastrar nova evidência
          </button>
          <span class="empty-state-tip">Pressione C para cadastrar nova evidência.</span>
        </div>
      `;
      return container;
    }

    container.className = 'evidence-grid';

    let cardsHTML = '';

    evidences.forEach(evidence => {
      const hasLink = !!evidence.link;
      const hasFile = evidence.tipo !== 'link' && evidence.nome;

      let iconHtml = '';
      let displayType = evidence.tipo || 'Documento';

      if (hasFile && hasLink) {
        const config = getTypeConfig(evidence.tipo);
        displayType = `${config.label} + Link`;
        iconHtml = `
          <div style="display: inline-flex; align-items: center; gap: 4px; margin-top: 2px;">
            <i data-lucide="${config.icon}" class="file-icon ${config.klass}"></i>
            <i data-lucide="link" class="file-icon file-icon-link" style="width: 14px; height: 14px;" title="Contém link vinculado"></i>
          </div>
        `;
      } else if (hasFile) {
        const config = getTypeConfig(evidence.tipo);
        displayType = config.label;
        iconHtml = `<i data-lucide="${config.icon}" class="file-icon ${config.klass}" style="margin-top: 2px;"></i>`;
      } else if (hasLink) {
        displayType = 'Link';
        iconHtml = `<i data-lucide="link" class="file-icon file-icon-link" style="margin-top: 2px;"></i>`;
      } else {
        const config = getTypeConfig(evidence.tipo);
        displayType = config.label;
        iconHtml = `<i data-lucide="${config.icon}" class="file-icon ${config.klass}" style="margin-top: 2px;"></i>`;
      }

      const categoriesList = Array.isArray(evidence.categorias) && evidence.categorias.length > 0
        ? evidence.categorias
        : (evidence.categoria ? [evidence.categoria] : []);

      const categoriesHTML = categoriesList.length > 0
        ? categoriesList.map(cat => {
            const dynamicStyle = window.getCategoryStyle ? window.getCategoryStyle(cat) : '';
            return `<span class="badge badge-dynamic" style="${dynamicStyle}">${escapeHtml(cat)}</span>`;
          }).join(' ')
        : '<span style="color: var(--text-tertiary); font-style: italic; font-size: 0.8rem;">—</span>';

      const tagsHTML = (evidence.tags || []).map(tag => `<span class="tag" style="${window.CerneConfig.tagsStyle}">${escapeHtml(tag)}</span>`).join('');

      const eventoFormatted = truncateWords(evidence.evento, 5);
      const eventoHTML = eventoFormatted 
        ? escapeHtml(eventoFormatted)
        : '<span style="color: var(--text-tertiary); font-style: italic;">—</span>';

      const tituloText = evidence.titulo || evidence.nome || 'Sem título';
      
      const nomeFormatado = formatResponsavelName(evidence.responsavel, listaFinalResponsaveis);
      const avatarStyle = getAvatarStyle(evidence.responsavel, evidence.responsavelColor);
      const initialLetter = evidence.responsavel ? evidence.responsavel.charAt(0).toUpperCase() : 'U';

      cardsHTML += `
        <div class="evidence-card" data-id="${escapeHtml(evidence.id)}">
          <div class="card-header">
            <div style="display: flex; align-items: flex-start; gap: 0.65rem; min-width: 0;">
              ${iconHtml}
              <span class="card-title" title="${escapeHtml(tituloText)}">${escapeHtml(tituloText)}</span>
            </div>
            <span class="file-type-badge">${escapeHtml(displayType)}</span>
          </div>

          <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-top: 0.2rem;">
            ${categoriesHTML}
          </div>

          <div class="card-body">
            <strong style="display:block; margin-bottom: 4px; color: var(--text-primary); font-size: 0.8rem;">
              Evento: ${eventoHTML}
            </strong>
            <div style="color: var(--text-secondary); font-size: 0.85rem;">
              ${renderSafeSummary(evidence.resumo)}
            </div>
          </div>

          ${tagsHTML ? `<div class="tags-list" style="margin-top: 0.25rem;">${tagsHTML}</div>` : ''}

          <div class="card-footer">
            <div class="card-author">
              <div class="avatar-initial" style="${avatarStyle}">${escapeHtml(initialLetter)}</div>
              <span>${escapeHtml(nomeFormatado)}</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-tertiary);">${escapeHtml(evidence.data || '')}</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = cardsHTML;

    container.querySelectorAll('.evidence-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (typeof onViewDetailsClick === 'function') {
          onViewDetailsClick(id);
        }
      });
    });

    return container;
  }
};