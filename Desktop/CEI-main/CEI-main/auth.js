function normalizeRole(role) {
  const normalizedRole = String(role || '').trim().toLowerCase();
  if (!normalizedRole) {
    return 'user';
  }

  if (['authenticated', 'user', 'member', 'standard'].includes(normalizedRole)) {
    return 'user';
  }

  if (['admin', 'administrator', 'owner'].includes(normalizedRole)) {
    return 'admin';
  }

  return normalizedRole;
}

const DEMO_EMAIL = 'test@gmail.com';
const DEMO_PASSWORD = 'test';

function isDemoCredentials(email, password) {
  return String(email || '').trim().toLowerCase() === DEMO_EMAIL && String(password || '') === DEMO_PASSWORD;
}

function getDemoUser() {
  return {
    id: 'demo-user',
    email: DEMO_EMAIL,
    role: 'admin',
    app_metadata: { role: 'admin' },
    user_metadata: { full_name: 'Usuário Demo' }
  };
}

function isDemoSession(accessToken = '', refreshToken = '') {
  return String(accessToken || '').trim() === 'demo-access-token' || String(refreshToken || '').trim() === 'demo-refresh-token';
}

function getUserRole(user = {}) {
  const role = user?.app_metadata?.role || user?.role || user?.user_metadata?.role || user?.app_metadata?.roles?.[0] || 'user';
  return normalizeRole(role);
}

function hasPermission(user = {}, permission) {
  const role = getUserRole(user);
  const rolePermissions = {
    admin: ['view', 'upload', 'edit', 'delete', 'settings', 'administrative'],
    user: ['view', 'upload', 'edit', 'delete', 'settings', 'administrative']
  };

  const permissions = rolePermissions[role] || rolePermissions.user;
  return permissions.includes(permission);
}

module.exports = {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  isDemoCredentials,
  getDemoUser,
  isDemoSession,
  getUserRole,
  hasPermission
};
