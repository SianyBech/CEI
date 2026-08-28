window.CerneApp.UploadModal = {
  // Helper to generate mock intelligence metadata based on selected filename
  generateMockAIResult(fileName) {
    const nameLower = fileName.toLowerCase();
    let tipo = 'documento';
    let categoria = 'Gestão';
    let evento = 'Reunião de Alinhamento de Metas';
    let responsavel = 'Gabriela Mendes';
    let tags = ['CERNE', 'Gestão', 'Incubadora'];
    let resumo = 'Documento institucional gerado para registro de atividades da incubadora.';
    let textoExtraido = 'CONTEÚDO EXTRAÍDO VIA OCR:\n\nEste documento contém as informações de registro e conformidade das atividades da incubadora.';

    if (nameLower.endsWith('.pdf')) {
      tipo = 'pdf';
    } else if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) {
      tipo = 'imagem';
    }

    if (nameLower.includes('ata') || nameLower.includes('reuniao') || nameLower.includes('reunião')) {
      categoria = 'Planejamento';
      evento = 'Reunião de Planejamento de Metas';
      resumo = `Ata de reunião referente ao planejamento de metas e alinhamento estratégico, formalizada a partir do arquivo '${fileName}'.`;
      tags = ['Ata', 'Reunião', 'Decisões'];
      textoExtraido = `ATA DE REUNIÃO DE ALINHAMENTO DE METAS E PROCESSOS\nData de Execução: ${new Date().toLocaleDateString('pt-BR')}\nResponsável: ${responsavel}\nPauta: Discussão sobre o cumprimento dos processos-chave CERNE e alocação de recursos operacionais da incubadora.\nDeliberações: As metas de atendimento de startups para o corrente semestre foram revisadas e aprovadas pela gerência. Fica estabelecida a prioridade nas assessorias tecnológicas.`;
    } else if (nameLower.includes('workshop') || nameLower.includes('curso') || nameLower.includes('capacitacao') || nameLower.includes('capacitação') || nameLower.includes('palestra')) {
      categoria = 'Capacitação';
      evento = 'Workshop de Inteligência Artificial Aplicada';
      responsavel = 'Carlos Silva';
      resumo = `Registro do evento de capacitação e formação tecnológica '${fileName}', voltado ao empreendedorismo inovador.`;
      tags = ['Capacitação', 'Treinamento', 'Workshop', 'IA'];
      textoExtraido = `REGISTRO DE CAPACITAÇÃO E EVENTOS DE FORMACÃO\nEvento: Workshop Prático de Inteligência Artificial Aplicada a Negócios.\nFacilitador: ${responsavel}\nParticipantes: Startups residentes, pré-incubadas e equipe executiva da incubadora.\nConteúdo Programático: Introdução a Large Language Models (LLMs), automação de processos, boas práticas de engenharia de prompt e casos de uso de IA na gestão de evidências CERNE.`;
    } else if (nameLower.includes('contrato') || nameLower.includes('termo') || nameLower.includes('acordo') || nameLower.includes('convenio') || nameLower.includes('convênio')) {
      categoria = 'Assessoria';
      evento = 'Programa de Assessoria em Propriedade Intelectual';
      responsavel = 'Marcos Venícius';
      resumo = `Contrato de parceria e assessoria técnica/jurídica '${fileName}' analisado pelo assistente de IA.`;
      tags = ['Acordo', 'Contrato', 'Assessoria', 'Jurídico'];
      textoExtraido = `CONTRATO DE PRESTAÇÃO DE ASSESSORIAS E PARCERIAS\nPartes: Centro de Empreendedorismo e Incubação e startup associada.\nObjeto: Prestação de assessorias especializadas em gestão de tecnologia, modelagem financeira e proteção de propriedade intelectual (patentes e marcas).\nData de validade: Vigente a partir de 2026. Assinaturas confirmadas pelas vias eletrônicas digitais.`;
    } else if (nameLower.includes('financeiro') || nameLower.includes('relatorio') || nameLower.includes('relatório') || nameLower.includes('contas')) {
      categoria = 'Gestão';
      evento = 'Relatório de Prestação de Contas Trimestral';
      resumo = `Relatório gerencial financeiro contendo faturamento, captação de recursos e custos operacionais extraídos do arquivo '${fileName}'.`;
      tags = ['Gestão', 'Relatório', 'Financeiro', 'Auditoria'];
      textoExtraido = `RELATÓRIO FINANCEIRO E ORÇAMENTÁRIO ANUAL\nCompetência: Exercício 2026.\nResumo de Saldo: Apuração de receitas operacionais originadas de taxas de incubação e repasses de editais governamentais (FINEP/CNPq).\nDespesas operacionais: Custos de manutenção do espaço compartilhado (coworking), assessorias externas e serviços gerais em conformidade com as diretrizes do plano de negócios.`;
    } else if (nameLower.includes('certificado') || nameLower.includes('diploma')) {
      categoria = 'Qualificação';
      evento = 'Cerimônia de Qualificação e Certificação';
      responsavel = 'Ana Paula de Souza';
      resumo = `Certificado de conclusão de assessoria técnica de startup, validado para comprovação de qualificação do nível CERNE.`;
      tags = ['Certificado', 'Qualificação', 'Conclusão'];
      textoExtraido = `CERTIFICADO DE CONFORMIDADE E QUALIFICAÇÃO DE EMPRESAS\nO Centro de Empreendedorismo certifica que a startup participante cumpriu com êxito todas as etapas estabelecidas na trilha de desenvolvimento, mentorias e qualificação tecnológica orientada pelas diretrizes CERNE.\nData de emissão: ${new Date().toLocaleDateString('pt-BR')}. Assinado eletronicamente por Ana Paula de Souza.`;
    } else if (nameLower.includes('sustentabilidade') || nameLower.includes('ecologico') || nameLower.includes('esg') || nameLower.includes('ambiental')) {
      categoria = 'Sustentabilidade';
      evento = 'Implantação do Plano de Gestão Ambiental';
      responsavel = 'Carlos Silva';
      resumo = `Plano de práticas ecológicas e sustentabilidade da incubadora extraído do arquivo '${fileName}'.`;
      tags = ['Sustentabilidade', 'Ecológico', 'ESG', 'Diretrizes'];
      textoExtraido = `PLANO DE GESTÃO AMBIENTAL - INCUBADORA SUSTENTÁVEL\nElaborado por: Carlos Silva - Comitê de Sustentabilidade.\nDiretrizes Operacionais: Estabelece as metas de descarte correto de resíduos eletroeletrônicos e a redução de papel e descartáveis de plástico no ambiente de coworking da incubadora.`;
    }

    return {
      id: "ev-" + Date.now(),
      nome: fileName,
      tipo: tipo,
      data: new Date().toLocaleDateString('pt-BR'),
      evento: evento,
      categoria: categoria,
      responsavel: responsavel,
      tags: tags,
      resumo: resumo,
      textoExtraido: textoExtraido
    };
  }, 

  render(onClose, onAddEvidence, categories = [], tagsList = []) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'upload-modal-overlay';

    overlay.innerHTML = `
      <div class="modal-content" id="modal-content-box">
        <div class="modal-header">
          <h2 class="modal-title">Nova Evidência</h2>
          <button class="modal-close" id="modal-close-btn">
            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
          </button>
        </div>

        <div class="modal-body" id="modal-body-container">
          <!-- Step 1: File Selection or Link -->
          <div id="upload-step-select" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="dropzone" id="dropzone-box">
              <i data-lucide="upload-cloud" class="dropzone-icon"></i>
              <div class="dropzone-text">
                <strong>Arraste seu arquivo aqui</strong> ou clique para navegar
              </div>
              <div class="dropzone-subtext">
                Suporta PDF, Imagens (JPG/PNG) ou Documentos (DOCX) até 30MB
              </div>
              <input type="file" id="file-input-element" style="display: none;" accept=".pdf, .png, .jpg, .jpeg, .docx, .pptx">
            </div>

            <div class="file-selected-box" id="file-selected-info-box" style="display: none;">
              <div class="file-selected-info">
                <i data-lucide="file-check" class="file-icon-documento" id="selected-file-icon"></i>
                <span id="selected-file-name" style="word-break: break-all;">Nome_do_Arquivo.pdf</span>
              </div>
              <button class="btn btn-secondary btn-icon-only" id="remove-file-btn" style="border:none; background:transparent;" title="Remover Arquivo">
                <i data-lucide="trash-2" style="width: 16px; height: 16px; color: var(--danger);"></i>
              </button>
            </div>

            <!-- CAMPO DE LINK -->
            <div style="display: flex; align-items: center; text-align: center; gap: 0.75rem; color: var(--text-secondary); font-size: 0.8rem;">
  <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
  <span>OU ENVIE UM LINK DA WEB</span>
  <div style="flex: 1; height: 1px; background: var(--border-color);"></div>
</div>
<div style="display: flex; flex-direction: column; gap: 0.75rem;">
  <input type="url" id="link-input-element" class="form-input" placeholder="https://www.instagram.com/p/..." style="width: 100%;" />
  <textarea id="link-text-override" class="form-textarea" placeholder="Conteúdo / Legenda do Post (Opcional - Recomendado para redes sociais)" style="width: 100%; min-height: 80px;"></textarea>
</div>

            <div>
              <input type="url" id="link-input-element" class="form-input" placeholder="https://exemplo.com/noticia-sobre-o-cei" style="width: 100%; padding: 0.6rem 0.85rem; border-radius: 8px; border: 1px solid var(--border-color);" />
            </div>
          </div>
        </div>

        <div class="modal-footer" id="modal-footer-container">
          <button class="btn btn-secondary" id="modal-cancel-btn">Cancelar</button>
          <button class="btn btn-primary" id="modal-upload-submit-btn" disabled>Iniciar Análise</button>
        </div>
      </div>
    `;

    const fileInput = overlay.querySelector('#file-input-element');
    const dropzone = overlay.querySelector('#dropzone-box');
    const fileInfoBox = overlay.querySelector('#file-selected-info-box');
    const selectedFileName = overlay.querySelector('#selected-file-name');
    const selectedFileIcon = overlay.querySelector('#selected-file-icon');
    const removeFileBtn = overlay.querySelector('#remove-file-btn');
    const submitBtn = overlay.querySelector('#modal-upload-submit-btn');
    const cancelBtn = overlay.querySelector('#modal-cancel-btn');
    const closeBtn = overlay.querySelector('#modal-close-btn');
    const linkInput = overlay.querySelector('#link-input-element');

    let selectedFile = null;

    // Validação do formulário (Arquivo OU Link)
    function checkFormValidity() {
      if (selectedFile || (linkInput && linkInput.value.trim().length > 0)) {
        submitBtn.removeAttribute('disabled');
      } else {
        submitBtn.setAttribute('disabled', 'true');
      }
    }

    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--accent)';
      dropzone.style.backgroundColor = 'var(--accent-light)';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'var(--border-color)';
      dropzone.style.backgroundColor = '#fafafa';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--border-color)';
      dropzone.style.backgroundColor = '#fafafa';
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    linkInput.addEventListener('input', checkFormValidity);

    function handleFileSelect(file) {
      selectedFile = file;
      selectedFileName.textContent = file.name;
      
      const ext = file.name.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg'].includes(ext)) {
        selectedFileIcon.setAttribute('data-lucide', 'image');
        selectedFileIcon.className = 'file-icon file-icon-imagem';
      } else if (ext === 'pdf') {
        selectedFileIcon.setAttribute('data-lucide', 'file-text');
        selectedFileIcon.className = 'file-icon file-icon-pdf';
      } else {
        selectedFileIcon.setAttribute('data-lucide', 'file');
        selectedFileIcon.className = 'file-icon file-icon-documento';
      }
      
      lucide.createIcons({
        attrs: { style: 'width: 16px; height: 16px;' },
        nameAttr: 'data-lucide',
        node: fileInfoBox
      });

      fileInfoBox.style.display = 'flex';
      checkFormValidity();
    }

    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedFile = null;
      fileInput.value = '';
      fileInfoBox.style.display = 'none';
      checkFormValidity();
    });

    const doClose = () => {
      overlay.remove();
      onClose();
    };

    closeBtn.addEventListener('click', doClose);
    cancelBtn.addEventListener('click', doClose);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) doClose();
    });

    // Função de atualização visual dos passos modernos
    function updateUploadStep(stepNumber, progressPercent) {
      const barFill = overlay.querySelector('#upload-progress-bar-fill');
      if (barFill) {
        barFill.style.width = `${progressPercent}%`;
      }

      for (let i = 1; i <= 4; i++) {
        const stepEl = overlay.querySelector(`#step-${i}`);
        if (!stepEl) continue;
        
        const iconEl = stepEl.querySelector('.step-icon');

        if (i < stepNumber) {
          stepEl.style.opacity = '1';
          iconEl.style.backgroundColor = '#d1fae5';
          iconEl.style.color = '#065f46';
          iconEl.innerHTML = '✓';
        } else if (i === stepNumber) {
          stepEl.style.opacity = '1';
          iconEl.style.backgroundColor = '#f3e8ff';
          iconEl.style.color = '#6b21a8';
          iconEl.innerHTML = `<div style="width: 10px; height: 10px; border: 2px solid #6b21a8; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>`;
        } else {
          stepEl.style.opacity = '0.4';
          iconEl.style.backgroundColor = '#e2e8f0';
          iconEl.style.color = '#64748b';
          iconEl.textContent = i;
        }
      }
    }

// Submit / Processing logic limpo com os novos passos
    submitBtn.addEventListener('click', async () => {
      const linkInput = overlay.querySelector('#link-input-element');
      const textOverrideInput = overlay.querySelector('#link-text-override');
      
      const linkValue = linkInput ? linkInput.value.trim() : null;
      const customTextValue = textOverrideInput ? textOverrideInput.value.trim() : null;

      if (!selectedFile && !linkValue) return;

      // Detecção Inteligente de Redes Sociais sem Legenda
      const isSocialLink = linkValue && (linkValue.includes('instagram.com') || linkValue.includes('linkedin.com'));
      
      if (isSocialLink && !customTextValue) {
        const selectArea = overlay.querySelector('#upload-step-select');
        if (selectArea) selectArea.style.display = 'none';
        submitBtn.style.display = 'none';
        cancelBtn.style.display = 'none';
        
        const modalBody = overlay.querySelector('#modal-body-container');
        const warningDiv = document.createElement('div');
        warningDiv.id = 'social-warning-box';
        warningDiv.innerHTML = `
          <div style="background-color: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 1.5rem; text-align: center; display: flex; flex-direction: column; gap: 1rem; margin: 1.5rem;">
            <i data-lucide="alert-circle" style="width: 32px; height: 32px; color: #f59e0b; margin: 0 auto;"></i>
            <h3 style="margin:0; font-size:1.1rem; color: #b45309;">Link de Rede Social Detectado</h3>
            <p style="font-size: 0.9rem; color: #92400e; margin:0; line-height: 1.5;">O Instagram e o LinkedIn bloqueiam a leitura automática da Inteligência Artificial. Para um resumo preciso, sugerimos que você <strong>volte e cole o texto da legenda</strong>.</p>
            <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 0.5rem;">
              <button class="btn btn-secondary" id="btn-back-to-paste">Voltar e Colar</button>
              <button class="btn btn-primary" id="btn-force-continue" style="background-color: #f59e0b; border-color: #f59e0b;">Continuar Sem Legenda</button>
            </div>
          </div>
        `;
        modalBody.prepend(warningDiv);
        lucide.createIcons({ node: warningDiv });
        
        warningDiv.querySelector('#btn-back-to-paste').addEventListener('click', () => {
          warningDiv.remove();
          if (selectArea) selectArea.style.display = 'flex';
          submitBtn.style.display = 'inline-flex';
          cancelBtn.style.display = 'inline-flex';
        });
        
        warningDiv.querySelector('#btn-force-continue').addEventListener('click', () => {
          warningDiv.remove();
          iniciarProcessamento(selectedFile, linkValue, customTextValue);
        });
        
        return;
      }

      iniciarProcessamento(selectedFile, linkValue, customTextValue);
    });

    function iniciarProcessamento(fileToUpload, linkToSend, customTextToSend) {
      submitBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      closeBtn.style.display = 'none';

      const modalBody = overlay.querySelector('#modal-body-container');
      
      modalBody.innerHTML = `
        <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="background-color: #f3e8ff; color: #6b21a8; padding: 0.75rem; border-radius: 12px; display: flex;">
              <i data-lucide="sparkles" style="width: 24px; height: 24px;"></i>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1rem; font-weight: 600; color: var(--text-primary);">Processando Evidência</h3>
              <p style="margin: 0; font-size: 0.825rem; color: var(--text-secondary);">Analisando e estruturando metadados com Inteligência Artificial...</p>
            </div>
          </div>

          <div style="width: 100%; background-color: var(--bg-secondary); height: 6px; border-radius: 3px; overflow: hidden;">
            <div id="upload-progress-bar-fill" style="width: 15%; height: 100%; background-color: #6b21a8; transition: width 0.4s ease;"></div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; background-color: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color); border-radius: 10px; padding: 1.25rem;">
            <div id="step-1" class="upload-step" style="display: flex; align-items: center; gap: 0.75rem; opacity: 0.5; transition: opacity 0.3s;">
              <div class="step-icon" style="width: 24px; height: 24px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; color: #64748b;">1</div>
              <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-primary);">Validando e preparando dados...</span>
            </div>
            <div id="step-2" class="upload-step" style="display: flex; align-items: center; gap: 0.75rem; opacity: 0.5; transition: opacity 0.3s;">
              <div class="step-icon" style="width: 24px; height: 24px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; color: #64748b;">2</div>
              <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-primary);">Enviando para o servidor seguro...</span>
            </div>
            <div id="step-3" class="upload-step" style="display: flex; align-items: center; gap: 0.75rem; opacity: 0.5; transition: opacity 0.3s;">
              <div class="step-icon" style="width: 24px; height: 24px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; color: #64748b;">3</div>
              <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-primary);">Extraindo texto (OCR / Web Scraping)...</span>
            </div>
            <div id="step-4" class="upload-step" style="display: flex; align-items: center; gap: 0.75rem; opacity: 0.5; transition: opacity 0.3s;">
              <div class="step-icon" style="width: 24px; height: 24px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; color: #64748b;">4</div>
              <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-primary);">Processando IA (Resumo e Tags CERNE)...</span>
            </div>
          </div>
        </div>
      `;

      lucide.createIcons({ nameAttr: 'data-lucide', node: modalBody });

      updateUploadStep(1, 25);

      setTimeout(async () => {
        try {
          updateUploadStep(2, 50);

          // 💡 Atualizado para passar o customTextToSend!
          const uploadedEvidence = await window.CerneApp.Api.uploadEvidence(fileToUpload, linkToSend, customTextToSend, (percentage) => {
            if (percentage > 50) {
              updateUploadStep(3, 75);
            }
          });

          updateUploadStep(4, 100);

          setTimeout(() => {
            closeBtn.style.display = 'flex';
            showSuccessScreen(uploadedEvidence);
          }, 400);

        } catch (error) {
          closeBtn.style.display = 'flex';
          modalBody.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--danger);">
              <i data-lucide="alert-triangle" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
              <h4 style="margin: 0 0 0.5rem 0;">Falha no processamento</h4>
              <p style="font-size: 0.85rem; color: var(--text-secondary);">${error.message}</p>
            </div>
          `;
          lucide.createIcons({ nameAttr: 'data-lucide', node: modalBody });
        }
      }, 400);
    }

    function showSuccessScreen(evidence) {
      closeBtn.style.display = 'flex';
      let wasSaved = false;

      function formatDateForInput(dateString) {
        if (!dateString) {
          const today = new Date();
          return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        }
        if (dateString.includes('/')) {
          const [dd, mm, yyyy] = dateString.split('/');
          if (dd && mm && yyyy) return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
        return dateString;
      }
      
      const modalBody = overlay.querySelector('#modal-body-container');
      const footer = overlay.querySelector('#modal-footer-container');

      footer.innerHTML = `
        <button class="btn btn-primary" id="modal-success-done-btn">Confirmar e Salvar</button>
      `;

      function escapeHtml(value) {
        return String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.25rem; animation: fadeIn var(--transition-normal) forwards;">
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem;">
            <div style="width: 48px; height: 48px; background-color: var(--success-bg); border: 2px solid var(--success-border); border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; color: var(--success);">
              <i data-lucide="check-circle" style="width: 26px; height: 26px;"></i>
            </div>
            <div>
              <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 600; color: var(--text-primary);">Evidência Analisada com Sucesso</h3>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem;">Revise e corrija os metadados gerados pela Inteligência Artificial se necessário:</p>
            </div>
          </div>
 
          <div style="width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-md); background-color: var(--bg-secondary); padding: 1.25rem;">
            <div class="edit-form-grid">
              <div class="form-group edit-form-fullwidth">
                <label class="form-label" for="edit-titulo">Título da Evidência</label>
                <input type="text" class="form-input" id="edit-titulo" value="${escapeHtml(evidence.titulo || evidence.nome)}" placeholder="Título da evidência">
              </div>

              <div class="form-group edit-form-fullwidth">
                <label class="form-label" for="edit-nome">Arquivo / Link Original</label>
                <input type="text" class="form-input" id="edit-nome" value="${escapeHtml(evidence.nome || evidence.link)}" disabled style="background-color: var(--bg-tertiary); color: var(--text-secondary); cursor: not-allowed;">
              </div>

              <div class="form-group edit-form-fullwidth">
                <label class="form-label" for="edit-evento">Evento de Origem</label>
                <input type="text" class="form-input" id="edit-evento" value="${escapeHtml(evidence.evento)}" placeholder="Ex: Reunião do Conselho, Mentoria, etc.">
              </div>

              <div class="form-group">
                <label class="form-label">Categorias CERNE</label>
                <div class="tags-selector-wrapper">
                  <div class="selected-tags-display" id="upload-selected-categories-display"></div>
                  <select class="form-select" id="upload-add-category-select"></select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Tags da Evidência</label>
                <div class="tags-selector-wrapper">
                  <div class="selected-tags-display" id="selected-tags-display"></div>
                  <select class="form-select" id="add-tag-select"></select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-responsavel">Responsável pelo Envio</label>
                <select class="form-select" id="edit-responsavel"></select>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-data">Data de Registro</label>
                <input type="date" class="form-input" id="edit-data" value="${formatDateForInput(evidence.data)}">
              </div>

              <div class="form-group edit-form-fullwidth">
                <label class="form-label" for="edit-resumo">Resumo da IA</label>
                <textarea class="form-textarea" id="edit-resumo" placeholder="Escreva um breve resumo da evidência...">${escapeHtml(evidence.resumo)}</textarea>
              </div>
            </div>
          </div>
        </div>
      `;
 
      lucide.createIcons({ nameAttr: 'data-lucide', node: modalBody });

      (async () => {
        const selectResponsavel = overlay.querySelector('#edit-responsavel');
        if (!selectResponsavel) return;
        try {
          const listaResponsaveis = await window.CerneApp.Api.fetchResponsaveis();
          const responsavelAtual = evidence.responsavel || '';
          selectResponsavel.innerHTML = '';
          if (responsavelAtual && !listaResponsaveis.includes(responsavelAtual)) {
            listaResponsaveis.unshift(responsavelAtual);
          }
          listaResponsaveis.forEach(nome => {
            const option = document.createElement('option');
            option.value = nome;
            option.textContent = nome;
            if (nome === responsavelAtual) option.selected = true;
            selectResponsavel.appendChild(option);
          });
        } catch (error) {
          selectResponsavel.innerHTML = `<option value="${evidence.responsavel || 'Equipe CEI'}">${evidence.responsavel || 'Equipe CEI'}</option>`;
        }
      })();

      let selectedCategories = Array.isArray(evidence.categorias) && evidence.categorias.length > 0
        ? [...evidence.categorias]
        : (Array.isArray(evidence.categoriasSugeridas) && evidence.categoriasSugeridas.length > 0 
            ? [...evidence.categoriasSugeridas] 
            : (evidence.categoria ? [evidence.categoria] : []));

      function renderUploadCategoriesWidget() {
        const displayContainer = overlay.querySelector('#upload-selected-categories-display');
        const selectElement = overlay.querySelector('#upload-add-category-select');
        if (!displayContainer || !selectElement) return;

        displayContainer.innerHTML = '';
        if (selectedCategories.length === 0) {
          displayContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-tertiary); font-style: italic;">Nenhuma categoria selecionada</span>';
        } else {
          selectedCategories.forEach(cat => {
            const customStyle = window.getCategoryStyle ? window.getCategoryStyle(cat) : '';
            const categoryClass = `badge-${cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`;

            const badge = document.createElement('span');
            badge.className = `badge ${categoryClass}`;
            if (customStyle) badge.setAttribute('style', customStyle);
            badge.style.display = 'inline-flex';
            badge.style.alignItems = 'center';
            badge.style.gap = '0.35rem';
            badge.style.padding = '0.25rem 0.5rem';

            badge.innerHTML = `
              <span>${escapeHtml(cat)}</span>
              <button type="button" class="tag-badge-remove" style="background:none; border:none; cursor:pointer; font-size: 0.9rem;" title="Remover categoria">&times;</button>
            `;

            badge.querySelector('.tag-badge-remove').addEventListener('click', (e) => {
              e.preventDefault();
              selectedCategories = selectedCategories.filter(c => c !== cat);
              renderUploadCategoriesWidget();
            });

            displayContainer.appendChild(badge);
          });
        }

        selectElement.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Adicionar categoria...';
        defaultOpt.selected = true;
        selectElement.appendChild(defaultOpt);

        const categoriesArray = Array.isArray(categories) ? categories : [];
        const availableCategories = categoriesArray.filter(cat => !selectedCategories.includes(cat));

        availableCategories.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat;
          opt.textContent = cat;
          selectElement.appendChild(opt);
        });

        selectElement.disabled = availableCategories.length === 0;
      }

      renderUploadCategoriesWidget();

      overlay.querySelector('#upload-add-category-select').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val && !selectedCategories.includes(val)) {
          selectedCategories.push(val);
          renderUploadCategoriesWidget();
        }
      });

      let selectedTags = Array.isArray(evidence.tags) && evidence.tags.length > 0
        ? [...evidence.tags]
        : (Array.isArray(evidence.tagsSugeridas) ? [...evidence.tagsSugeridas] : []);

      function renderTagsWidget() {
        const displayContainer = modalBody.querySelector('#selected-tags-display');
        const selectElement = modalBody.querySelector('#add-tag-select');
        if (!displayContainer || !selectElement) return;
        
        displayContainer.innerHTML = '';
        if (selectedTags.length === 0) {
          displayContainer.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-tertiary); font-style: italic;">Nenhuma tag selecionada</span>';
        } else {
          selectedTags.forEach(tag => {
            const badge = document.createElement('span');
            badge.className = 'tag-badge';
            badge.innerHTML = `
              <span>${escapeHtml(tag)}</span>
              <button type="button" class="tag-badge-remove" title="Remover tag">&times;</button>
            `;
            badge.querySelector('.tag-badge-remove').addEventListener('click', (e) => {
              e.preventDefault();
              selectedTags = selectedTags.filter(t => t !== tag);
              renderTagsWidget();
            });
            displayContainer.appendChild(badge);
          });
        }

        selectElement.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Adicionar tag...';
        defaultOpt.selected = true;
        selectElement.appendChild(defaultOpt);

        const tagsListArray = Array.isArray(tagsList) ? tagsList : [];
        const availableTags = tagsListArray.filter(tag => !selectedTags.includes(tag));
        
        availableTags.forEach(tag => {
          const opt = document.createElement('option');
          opt.value = tag;
          opt.textContent = tag;
          selectElement.appendChild(opt);
        });

        selectElement.disabled = availableTags.length === 0;
      }

      renderTagsWidget();

      modalBody.querySelector('#add-tag-select').addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) {
          if (!selectedTags.includes(val)) selectedTags.push(val);
          renderTagsWidget();
        }
      });

      function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `app-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        window.setTimeout(() => {
          toast.classList.remove('show');
          window.setTimeout(() => toast.remove(), 220);
        }, 2600);
      }

      const handleModalClose = () => {
        if (!wasSaved && evidence && evidence.id) {
          window.CerneApp.Api.deleteEvidence(evidence.id).catch(err => {
            console.warn('[UploadModal] Erro ao limpar rascunho descartado:', err);
          });
        }
        overlay.remove();
        onClose();
      };

      closeBtn.onclick = handleModalClose;
      const cancelBtnInSuccess = footer.querySelector('#modal-cancel-btn');
      if (cancelBtnInSuccess) cancelBtnInSuccess.onclick = handleModalClose;
      overlay.onclick = (e) => {
        if (e.target === overlay) handleModalClose();
      };

      const saveDoneBtn = footer.querySelector('#modal-success-done-btn');

      saveDoneBtn.addEventListener('click', async () => {
        const rawDateValue = modalBody.querySelector('#edit-data').value;
        let dataFormatted = new Date().toLocaleDateString('pt-BR');

        if (rawDateValue && rawDateValue.includes('-')) {
          const [yyyy, mm, dd] = rawDateValue.split('-');
          dataFormatted = `${dd}/${mm}/${yyyy}`;
        } else if (rawDateValue) {
          dataFormatted = rawDateValue;
        }

        if (window.CerneApp.Utils?.isFutureDate?.(dataFormatted)) {
          const confirmFuture = confirm('A data informada é uma data futura.\n\nTem certeza de que deseja cadastrar a evidência com esta data?');
          if (!confirmFuture) return;
        }

        const updatedMetadata = {
          titulo: modalBody.querySelector('#edit-titulo').value.trim() || evidence.nome,
          evento: modalBody.querySelector('#edit-evento').value.trim() || 'Sem Evento',
          categorias: selectedCategories,
          categoria: selectedCategories.length > 0 ? selectedCategories[0] : 'Geral',
          responsavel: modalBody.querySelector('#edit-responsavel').value.trim() || 'Não especificado',
          data: dataFormatted,
          resumo: modalBody.querySelector('#edit-resumo').value.trim() || 'Sem resumo disponível.',
          tags: selectedTags
        };

        saveDoneBtn.disabled = true;
        saveDoneBtn.innerHTML = '<span class="btn-loading-spinner" aria-hidden="true"></span> Salvando...';
        closeBtn.disabled = true;

        try {
          const savedEvidence = await window.CerneApp.Api.updateEvidence(evidence.id, updatedMetadata);
          wasSaved = true;

          if (typeof onAddEvidence === 'function') {
            onAddEvidence(savedEvidence);
          }

          showToast('Evidência salva com sucesso.', 'success');

          setTimeout(() => {
            overlay.remove();
            onClose();
          }, 150);
        } catch (error) {
          saveDoneBtn.disabled = false;
          saveDoneBtn.textContent = 'Confirmar e Salvar';
          closeBtn.disabled = false;
          alert(`Não foi possível salvar a evidência: ${error.message}`);
        }
      });
    }

    return overlay;
  }
};