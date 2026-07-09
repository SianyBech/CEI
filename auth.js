function getUserRole(user = {}) {
  const role = user?.app_metadata?.role || user?.role || user?.user_metadata?.role || 'user';
  return String(role).toLowerCase() || 'user';
}

function hasPermission(user = {}, permission) {
  const role = getUserRole(user);
  const rolePermissions = {
    admin: ['view', 'upload', 'edit', 'delete', 'settings', 'administrative'],
    user: ['view', 'upload', 'edit']
  };

  return Boolean(rolePermissions[role] && rolePermissions[role].includes(permission));
}

module.exports = {
  getUserRole,
  hasPermission
};
