window.CerneApp = window.CerneApp || {};

window.CerneApp.Pagination = {
  render({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }) {
    if (totalItems === 0) return document.createElement('div');

    const container = document.createElement('div');
    container.className = 'pagination-container';

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    container.innerHTML = `
      <div class="pagination-info">
        Exibindo <strong>${startItem}-${endItem}</strong> de <strong>${totalItems}</strong> evidências
      </div>
      <div class="pagination-controls">
        <!-- Campo customizado para o usuário digitar a quantidade por página -->
        <label class="pagination-label">
          Por página:
          <input 
            type="number" 
            min="1" 
            max="${totalItems || 100}" 
            value="${itemsPerPage}" 
            class="pagination-input items-per-page-input" 
          />
        </label>

        <button type="button" class="pagination-btn btn-prev" ${currentPage === 1 ? 'disabled' : ''}>
          &lt;
        </button>

        <div class="pagination-page-input">
          Página 
          <input type="number" min="1" max="${totalPages}" value="${currentPage}" class="pagination-input page-num-input" />
          de <strong>${totalPages}</strong>
        </div>

        <button type="button" class="pagination-btn btn-next" ${currentPage >= totalPages ? 'disabled' : ''}>
          &gt;
        </button>
      </div>
    `;

    // Alteração na Quantidade de Itens por Página
    const itemsInput = container.querySelector('.items-per-page-input');
    itemsInput.addEventListener('change', (e) => {
      let val = Number(e.target.value);
      if (val < 1) val = 1; // Garante ao menos 1 item por página
      onItemsPerPageChange(val);
    });

    // Navegação entre Páginas
    const btnPrev = container.querySelector('.btn-prev');
    btnPrev.addEventListener('click', () => {
      if (currentPage > 1) onPageChange(currentPage - 1);
    });

    const btnNext = container.querySelector('.btn-next');
    btnNext.addEventListener('click', () => {
      if (currentPage < totalPages) onPageChange(currentPage + 1);
    });

    const pageInput = container.querySelector('.page-num-input');
    pageInput.addEventListener('change', (e) => {
      let val = Number(e.target.value);
      if (val < 1) val = 1;
      if (val > totalPages) val = totalPages;
      onPageChange(val);
    });

    return container;
  }
};