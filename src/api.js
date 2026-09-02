window.CerneApp = window.CerneApp || {};

window.CerneApp.Api = {
  // Base para todas as requisições via Fetch
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

  // =========================================================================
  // GESTÃO DE USUÁRIOS E PERFIL (BANCO DE DADOS)
  // =========================================================================

  async fetchUserProfile() {
    return this.request('/api/user/profile');
  },

  async updateUserProfile(profileData) {
    return this.request('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  },

  async changePassword(newPassword) {
    return this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  },

  // =========================================================================
  // ADMINISTRAÇÃO DE MEMBROS E RESPONSÁVEIS (ADMIN)
  // =========================================================================

  async fetchAllUsers() {
    return this.request('/api/admin/users');
  },

  async createNewUser(userData) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async updateUserByAdmin(userId, userData) {
    return this.request(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify(userData)
    });
  },

  async deleteUserByAdmin(userId) {
    return this.request(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE'
    });
  },

  async fetchResponsaveis() {
    try {
      const users = await this.fetchAllUsers();
      if (Array.isArray(users) && users.length > 0) {
        const nomesUnicos = [...new Set(users.map(u => u.nome).filter(Boolean))].sort();
        if (nomesUnicos.length > 0) return nomesUnicos;
      }
      return ['Equipe CEI'];
    } catch (error) {
      console.error('[API] Erro em fetchResponsaveis:', error);
      return ['Equipe CEI'];
    }
  },

  // =========================================================================
  // EVIDÊNCIAS
  // =========================================================================

  async fetchEvidences() {
    return this.request('/api/evidences');
  },

  async fetchEvidenceById(id) {
    return this.request(`/api/evidences/${encodeURIComponent(id)}`);
  },

  async createEvidence(metadata) {
    return this.request('/api/evidences', {
      method: 'POST',
      body: JSON.stringify(metadata)
    });
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

  uploadEvidence(file, link, customText, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      
      if (file) formData.append('file', file);
      if (link) formData.append('link', link.trim());
      if (customText) formData.append('customText', customText.trim());

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
          let errorMessage = `Envio falhou: ${xhr.statusText} (${xhr.status})`;
          try {
            const errorBody = JSON.parse(xhr.responseText);
            if (errorBody?.error) errorMessage = errorBody.error;
          } catch (e) {}
          reject(new Error(errorMessage));
        }
      };

      xhr.onerror = () => reject(new Error('Erro de rede durante o envio.'));
      xhr.send(formData);
    });
  },

  // =========================================================================
  // CONFIGURAÇÕES GERAIS, CATEGORIAS E TAGS
  // =========================================================================

  async fetchSettings() {
    return this.request('/api/settings');
  },

  async updateSettings(settings) {
    return this.request('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  },

  async fetchCategories() {
    try {
      const settings = await this.fetchSettings();
      return settings?.categories || [];
    } catch (error) {
      console.error('[API] Erro ao buscar categorias:', error);
      return [];
    }
  },

  async fetchTags() {
    try {
      const settings = await this.fetchSettings();
      return settings?.tags || [];
    } catch (error) {
      console.error('[API] Erro ao buscar tags:', error);
      return [];
    }
  }
};