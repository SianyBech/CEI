window.CerneApp.Api = {
  async fetchEvidences(dateFrom = null, dateTo = null) {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);

    const url = params.toString() ? `/api/evidences?${params.toString()}` : '/api/evidences';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Falha ao carregar as evidências.');
    }

    return response.json();
  },

  async fetchEvidenceById(id) {
    const response = await fetch(`/api/evidences/${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new Error('Falha ao carregar os detalhes da evidência.');
    }

    return response.json();
  },

  async updateEvidence(id, metadata) {
    const response = await fetch(`/api/evidences/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || 'Falha ao atualizar a evidência.');
    }

    return response.json();
  },

  async deleteEvidence(id) {
    const response = await fetch(`/api/evidences/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || 'Falha ao excluir a evidência.');
    }

    return response.json();
  },

  async fetchSettings() {
    const response = await fetch('/api/settings');
    if (!response.ok) {
      throw new Error('Falha ao carregar as configurações.');
    }

    return response.json();
  },

  async updateSettings(settings) {
    const response = await fetch('/api/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || 'Falha ao atualizar as configurações.');
    }

    return response.json();
  },

  uploadEvidence(file, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      });

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (error) {
            reject(new Error('Resposta inválida do servidor.'));
          }
        } else {
          let errorMessage = `Upload falhou: ${xhr.statusText} (${xhr.status})`;

          try {
            const errorBody = JSON.parse(xhr.responseText);
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          } catch (error) {
            // Mantém a mensagem padrão se a resposta não for JSON.
          }

          reject(new Error(errorMessage));
        }
      };

      xhr.onerror = () => reject(new Error('Erro de rede durante o upload.'));
      xhr.send(formData);
    });
  }
};
