window.CerneApp.Auth = (() => {
  let currentUser = null;

  function setCurrentUser(user) {
    currentUser = user || null;
    return currentUser;
  }

  function getCurrentUser() {
    return currentUser;
  }

  function isAuthenticated() {
    return Boolean(currentUser);
  }

  function emitUnauthorized() {
    window.dispatchEvent(new CustomEvent('cerne:auth:required'));
  }

  async function requestJson(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    if (response.status === 401) {
      setCurrentUser(null);
      emitUnauthorized();
      throw new Error('Sessão expirada ou não autenticada.');
    }

    if (!response.ok) {
      let errorMessage = 'Falha na requisição.';
      try {
        const body = await response.json();
        errorMessage = body?.error || errorMessage;
      } catch (error) {
        // Ignora erro de parsing.
      }
      throw new Error(errorMessage);
    }

    return response.json().catch(() => null);
  }

  async function login(email, password) {
    const data = await requestJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setCurrentUser(data?.user || null);
    return data;
  }

  async function logout() {
    try {
      await requestJson('/api/auth/logout', { method: 'POST' });
    } finally {
      setCurrentUser(null);
    }
  }

  async function getSession() {
    try {
      const data = await requestJson('/api/auth/session');
      setCurrentUser(data?.user || null);
      return data;
    } catch (error) {
      setCurrentUser(null);
      return null;
    }
  }

  async function forgotPassword(email) {
    return requestJson('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  return {
    login,
    logout,
    getSession,
    forgotPassword,
    getCurrentUser,
    isAuthenticated,
    setCurrentUser,
    emitUnauthorized
  };
})();
