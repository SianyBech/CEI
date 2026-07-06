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

  render(onClose, onAddEvidence) {
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
          <!-- Step 1: File Selection -->
          <div id="upload-step-select" style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="dropzone" id="dropzone-box">
              <i data-lucide="upload-cloud" class="dropzone-icon"></i>
              <div class="dropzone-text">
                <strong>Arraste seu arquivo aqui</strong> ou clique para navegar
              </div>
              <div class="dropzone-subtext">
                Suporta PDF, Imagens (JPG/PNG) ou Documentos (DOCX) até 10MB
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
          </div>
        </div>

        <div class="modal-footer" id="modal-footer-container">
          <button class="btn btn-secondary" id="modal-cancel-btn">Cancelar</button>
          <button class="btn btn-primary" id="modal-upload-submit-btn" disabled>Iniciar Análise</button>
        </div>
      </div>
    `;

    // Modal elements
    const fileInput = overlay.querySelector('#file-input-element');
    const dropzone = overlay.querySelector('#dropzone-box');
    const fileInfoBox = overlay.querySelector('#file-selected-info-box');
    const selectedFileName = overlay.querySelector('#selected-file-name');
    const selectedFileIcon = overlay.querySelector('#selected-file-icon');
    const removeFileBtn = overlay.querySelector('#remove-file-btn');
    const submitBtn = overlay.querySelector('#modal-upload-submit-btn');
    const cancelBtn = overlay.querySelector('#modal-cancel-btn');
    const closeBtn = overlay.querySelector('#modal-close-btn');

    let selectedFile = null;

    // Trigger file input click
    dropzone.addEventListener('click', () => fileInput.click());

    // Drag and drop events
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

    function handleFileSelect(file) {
      selectedFile = file;
      selectedFileName.textContent = file.name;
      
      // Update icon based on file extension
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
        attrs: {
          style: 'width: 16px; height: 16px;'
        },
        nameAttr: 'data-lucide',
        node: fileInfoBox
      });

      fileInfoBox.style.display = 'flex';
      submitBtn.removeAttribute('disabled');
    }

    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedFile = null;
      fileInput.value = '';
      fileInfoBox.style.display = 'none';
      submitBtn.setAttribute('disabled', 'true');
    });

    // Close handlers
    const doClose = () => {
      overlay.remove();
      onClose();
    };

    closeBtn.addEventListener('click', doClose);
    cancelBtn.addEventListener('click', doClose);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) doClose();
    });

    // Submit / Processing logic
    submitBtn.addEventListener('click', () => {
      if (!selectedFile) return;

      submitBtn.style.display = 'none';
      cancelBtn.style.display = 'none';
      closeBtn.style.display = 'none';

      const modalBody = overlay.querySelector('#modal-body-container');
      modalBody.innerHTML = `
        <div class="ai-processing-container">
          <div class="ai-processing-header">
            <div class="ai-icon-pulse">
              <i data-lucide="sparkles" style="width: 20px; height: 20px;"></i>
            </div>
            <div>
              <span class="ai-processing-title">Upload e análise de evidência</span>
              <p style="font-size: 0.75rem; color: var(--text-secondary);">Enviando arquivo e extraindo metadados com OCR + IA...</p>
            </div>
          </div>

          <div class="progress-bar-container">
            <div class="progress-bar-fill" id="upload-progress-fill"></div>
          </div>

          <div class="processing-steps-log" id="steps-log-console"></div>
        </div>
      `;

      lucide.createIcons({
        nameAttr: 'data-lucide',
        node: modalBody
      });

      const progressFill = modalBody.querySelector('#upload-progress-fill');
      const logConsole = modalBody.querySelector('#steps-log-console');

      function addLog(message, completed = false) {
        const logItem = document.createElement('div');
        logItem.className = `step-log-item ${completed ? 'completed' : 'active'}`;
        logItem.innerHTML = `
          <span class="step-status-indicator">${completed ? '<span class="step-log-checkmark">✓</span>' : '⚙'}</span>
          <span>${message}</span>
        `;
        logConsole.appendChild(logItem);
        logConsole.scrollTop = logConsole.scrollHeight;
        return logItem;
      }

      const pendingLog = addLog('Preparando upload...');
      setTimeout(() => {
        pendingLog.classList.remove('active');
        pendingLog.classList.add('completed');
        pendingLog.querySelector('.step-status-indicator').innerHTML = '<span class="step-log-checkmark">✓</span>';

        const uploadingLog = addLog('Enviando arquivo para o servidor...');

        window.CerneApp.Api.uploadEvidence(selectedFile, (percentage) => {
          progressFill.style.width = `${percentage}%`;
        })
          .then((uploadedEvidence) => {
            uploadingLog.classList.remove('active');
            uploadingLog.classList.add('completed');
            uploadingLog.querySelector('.step-status-indicator').innerHTML = '<span class="step-log-checkmark">✓</span>';
            addLog('Arquivo processado com sucesso.', true);
            progressFill.style.width = '100%';
            closeBtn.style.display = 'flex';
            showSuccessScreen(uploadedEvidence);
          })
          .catch((error) => {
            uploadingLog.classList.remove('active');
            uploadingLog.classList.add('completed');
            uploadingLog.querySelector('.step-status-indicator').innerHTML = '<span class="step-log-checkmark">✕</span>';
            progressFill.style.backgroundColor = 'var(--danger)';
            modalBody.innerHTML = `
              <div class="ai-processing-container">
                <div class="ai-processing-header">
                  <div class="ai-icon-pulse" style="background-color: var(--danger-bg);">
                    <i data-lucide="alert-triangle" style="width: 20px; height: 20px; color: var(--danger);"></i>
                  </div>
                  <div>
                    <span class="ai-processing-title">Falha no upload</span>
                    <p style="font-size: 0.75rem; color: var(--text-secondary);">${error.message}</p>
                  </div>
                </div>
              </div>
            `;
            lucide.createIcons({
              nameAttr: 'data-lucide',
              node: modalBody
            });
            closeBtn.style.display = 'flex';
          });
      }, 300);
    });

    function showSuccessScreen(evidence) {
      // Re-enable closing
      closeBtn.style.display = 'flex';
      
      const modalBody = overlay.querySelector('#modal-body-container');
      const footer = overlay.querySelector('#modal-footer-container');

      // Update footer
      footer.innerHTML = `
        <button class="btn btn-primary" id="modal-success-done-btn">Confirmar e Salvar</button>
      `;

      // Update body with a beautiful results summary and editable form
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
                <label class="form-label" for="edit-nome">Arquivo Original</label>
                <input type="text" class="form-input" id="edit-nome" value="${evidence.nome}" disabled style="background-color: var(--bg-tertiary); color: var(--text-secondary); cursor: not-allowed;">
              </div>

              <div class="form-group edit-form-fullwidth">
                <label class="form-label" for="edit-evento">Evento de Origem</label>
                <input type="text" class="form-input" id="edit-evento" value="${evidence.evento}" placeholder="Ex: Reunião do Conselho, Mentoria, etc.">
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-categoria">Categoria CERNE</label>
                <select class="form-select" id="edit-categoria">
                  <option value="Capacitação" ${evidence.categoria === 'Capacitação' ? 'selected' : ''}>Capacitação</option>
                  <option value="Planejamento" ${evidence.categoria === 'Planejamento' ? 'selected' : ''}>Planejamento</option>
                  <option value="Gestão" ${evidence.categoria === 'Gestão' ? 'selected' : ''}>Gestão</option>
                  <option value="Assessoria" ${evidence.categoria === 'Assessoria' ? 'selected' : ''}>Assessoria</option>
                  <option value="Sustentabilidade" ${evidence.categoria === 'Sustentabilidade' ? 'selected' : ''}>Sustentabilidade</option>
                  <option value="Qualificação" ${evidence.categoria === 'Qualificação' ? 'selected' : ''}>Qualificação</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-responsavel">Responsável pelo Envio</label>
                <input type="text" class="form-input" id="edit-responsavel" value="${evidence.responsavel}" placeholder="Nome do responsável">
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-data">Data de Registro</label>
                <input type="text" class="form-input" id="edit-data" value="${evidence.data}" placeholder="DD/MM/AAAA">
              </div>

              <div class="form-group">
                <label class="form-label" for="edit-tags">Tags (separadas por vírgula)</label>
                <input type="text" class="form-input" id="edit-tags" value="${evidence.tags.join(', ')}" placeholder="Ex: IA, Ata, Canvas">
              </div>

              <div class="form-group edit-form-fullwidth">
                <label class="form-label" for="edit-resumo">Resumo da IA</label>
                <textarea class="form-textarea" id="edit-resumo" placeholder="Escreva um breve resumo da evidência...">${evidence.resumo}</textarea>
              </div>

            </div>
          </div>
        </div>
      `;

      lucide.createIcons({
        nameAttr: 'data-lucide',
        node: modalBody
      });

      footer.querySelector('#modal-success-done-btn').addEventListener('click', () => {
        // Collect edited values
        const editedEvidence = {
          id: evidence.id,
          nome: evidence.nome,
          tipo: evidence.tipo,
          textoExtraido: evidence.textoExtraido,
          
          evento: modalBody.querySelector('#edit-evento').value.trim() || 'Sem Evento',
          categoria: modalBody.querySelector('#edit-categoria').value,
          responsavel: modalBody.querySelector('#edit-responsavel').value.trim() || 'Não especificado',
          data: modalBody.querySelector('#edit-data').value.trim() || new Date().toLocaleDateString('pt-BR'),
          resumo: modalBody.querySelector('#edit-resumo').value.trim() || 'Sem resumo disponível.',
          tags: modalBody.querySelector('#edit-tags').value
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0)
        };

        onAddEvidence(editedEvidence);
        doClose();
      });
    }

    return overlay;
  }
};
