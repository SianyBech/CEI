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


async createUserByAdmin(userData) {
  return this.request('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
},

async deleteUserByAdmin(userId) {
  return this.request(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  });
},

// Adicione dentro de window.CerneApp.Api
async updateUserByAdmin(userId, userData) {
  return this.request(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify(userData)
  });
},

// Métodos de administração de usuários
  async fetchAllUsers() {
    return this.request('/api/admin/users');
  },

  async createNewUser(userData) {
    return this.request('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async fetchUserProfile() {
    return this.request('/api/user/profile');
  },

  async updateUserProfile(profileData) {
    return this.request('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  },

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

  async fetchSettings() {
    return this.request('/api/settings');
  },

  async updateSettings(settings) {
    return this.request('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  },

  // Adicione dentro de window.CerneApp.Api no src/api.js

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
},

async changePassword(newPassword) {
  return this.request('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ newPassword })
  });
},

  async fetchResponsaveis() {
  try {
    // Busca a lista real de usuários cadastrados no banco
    const users = await this.fetchAllUsers();
    
    if (Array.isArray(users) && users.length > 0) {
      // Extrai apenas os nomes, remove vazios e ordena alfabeticamente
      const nomesUnicos = [...new Set(users.map(u => u.nome).filter(Boolean))].sort();
      if (nomesUnicos.length > 0) return nomesUnicos;
    }
    
    return ['Equipe CEI']; // Fallback de segurança se o banco estiver vazio
  } catch (error) {
    console.error('[API] Erro em fetchResponsaveis:', error);
    return ['Equipe CEI'];
  }
},

uploadEvidence(file, link, onProgress) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      
      // Validação flexível: Anexa o que o usuário tiver enviado
      if (file) {
        formData.append('file', file);
      }
      
      if (link) {
        formData.append('link', link.trim());
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);
      xhr.withCredentials = true;

      // Monitoramento da barra de progresso
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && typeof onProgress === 'function') {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      });

      // Resposta do servidor
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
            if (errorBody?.error) {
              errorMessage = errorBody.error;
            }
          } catch (error) {
            // Mantém a mensagem padrão se a resposta não for JSON.
          }

          reject(new Error(errorMessage));
        }
      };

      xhr.onerror = () => reject(new Error('Erro de rede durante o envio.'));
      
      // Dispara a requisição com o arquivo, com o link, ou com ambos.
      xhr.send(formData);
    });
  }
};