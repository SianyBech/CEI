const test = require('node:test');
const assert = require('node:assert/strict');
const { getUserRole, hasPermission } = require('../auth');

test('retorna perfil user quando não há role explícita', () => {
  const role = getUserRole({ app_metadata: {}, user_metadata: {} });
  assert.equal(role, 'user');
});

test('trata o papel authenticated do Supabase como usuário comum', () => {
  const role = getUserRole({ app_metadata: { role: 'authenticated' } });
  assert.equal(role, 'user');
});

test('permite acesso amplo para usuários comuns, incluindo configurações', () => {
  const allowed = hasPermission({ app_metadata: { role: 'authenticated' } }, 'settings');
  assert.equal(allowed, true);
});

test('mantém acesso administrativo para papéis admin', () => {
  const allowed = hasPermission({ app_metadata: { role: 'admin' } }, 'administrative');
  assert.equal(allowed, true);
});
