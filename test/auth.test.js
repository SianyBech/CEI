const test = require('node:test');
const assert = require('node:assert/strict');
const { getUserRole, hasPermission } = require('../auth');

test('retorna perfil user quando não há role explícita', () => {
  const role = getUserRole({ app_metadata: {}, user_metadata: {} });
  assert.equal(role, 'user');
});

test('permite acesso de administrador para ações administrativas', () => {
  const allowed = hasPermission({ app_metadata: { role: 'admin' } }, 'administrative');
  assert.equal(allowed, true);
});

test('bloqueia acesso administrativo quando o perfil é user', () => {
  const allowed = hasPermission({ app_metadata: { role: 'user' } }, 'administrative');
  assert.equal(allowed, false);
});
