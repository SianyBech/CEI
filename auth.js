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
  getUserRole,
  hasPermission
};
