const test = require('node:test');
const assert = require('node:assert/strict');

const User = require('../src/models/userModel');

test('User schema requires name, email, and passwordHash', () => {
  const user = new User({});
  const validationError = user.validateSync();

  assert.ok(validationError);
  assert.ok(validationError.errors.name);
  assert.ok(validationError.errors.email);
  assert.ok(validationError.errors.passwordHash);
});

test('User schema trims and lowercases email', () => {
  const user = new User({
    name: 'Admin User',
    email: '  ADMIN@Example.COM  ',
    passwordHash: 'hashed-password'
  });

  assert.equal(user.email, 'admin@example.com');
});

test('User schema enforces name max length', () => {
  const user = new User({
    name: 'a'.repeat(101),
    email: 'admin@example.com',
    passwordHash: 'hashed-password'
  });

  const validationError = user.validateSync();

  assert.ok(validationError);
  assert.ok(validationError.errors.name);
});

test('User schema enforces email max length', () => {
  const user = new User({
    name: 'Admin User',
    email: `${'a'.repeat(243)}@example.com`,
    passwordHash: 'hashed-password'
  });

  const validationError = user.validateSync();

  assert.ok(validationError);
  assert.ok(validationError.errors.email);
});

test('User schema configures unique indexed email and timestamps', () => {
  const emailPath = User.schema.path('email');

  assert.equal(emailPath.options.unique, true);
  assert.equal(emailPath.options.index, true);
  assert.equal(User.schema.options.timestamps, true);
});
