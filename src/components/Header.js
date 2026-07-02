window.CerneApp.Header = {
  render(onNewEvidenceClick) {
    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
      <div class="header-brand">
        <div class="header-logo">
          <i data-lucide="brain-circuit" style="width: 20px; height: 20px;"></i>
        </div>
        <div class="header-title-container">
          <h1 class="header-title">Gestão de Evidências CERNE</h1>
          <span class="header-subtitle">Incubadora de Empresas CEI — Inteligência Artificial</span>
        </div>
      </div>
      <button class="btn btn-primary" id="btn-nova-evidencia">
        <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
        Nova Evidência
      </button>
    `;
    
    // Add event listener to the "Nova Evidência" button
    header.querySelector('#btn-nova-evidencia').addEventListener('click', onNewEvidenceClick);
    
    return header;
  }
};
