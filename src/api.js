window.CerneApp.Api = {
  async request(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    if (response.status === 401) {
      window.CerneApp.Auth?.emitUnauthorized?.();
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || 'Sessão expirada ou não autenticada.');
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || 'Falha ao processar a requisição.');
    }

    return response.json().catch(() => null);
  },

  async fetchEvidences() {
    return this.request('/api/evidences');
  },

  async fetchEvidenceById(id) {
    return this.request(`/api/evidences/${encodeURIComponent(id)}`);
  },

  async updateEvidence(id, metadata) {
    return this.request(`/api/evidences/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(metadata)
    });
  },

  async deleteEvidence(id) {
    return this.request(`/api/evidences/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  async fetchSettings() {
    return this.request('/api/settings');
  },

  async updateSettings(settings) {
    return this.request('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  },

  uploadEvidence(file, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);
      xhr.withCredentials = true;

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

// teste de git