window.CerneApp.Api = {
  async fetchEvidences() {
    const response = await fetch('/api/evidences');
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
          reject(new Error(`Upload falhou: ${xhr.statusText} (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error('Erro de rede durante o upload.'));
      xhr.send(formData);
    });
  }
};
