const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SKIP_DB = 'true';

const app = require('../app');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (!server) {
    return;
  }

  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
});

test('GET / returns notification service status', async () => {
  const response = await fetch(`${baseUrl}/`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    message: 'Notification service is running.'
  });
});

test('GET / includes secure headers and hides framework signature', async () => {
  const response = await fetch(`${baseUrl}/`);

  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-powered-by'), null);
});

test('POST /notifications rejects non-object JSON bodies', async () => {
  const response = await fetch(`${baseUrl}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['invalid'])
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, 'INVALID_BODY_TYPE');
});

test('GET /notifications returns an empty list in preview mode', async () => {
  const response = await fetch(`${baseUrl}/notifications`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.count, 0);
  assert.deepEqual(body.data, []);
});

test('POST /notifications creates a notification in preview mode', async () => {
  const response = await fetch(`${baseUrl}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipient: 'admin@example.com',
      channel: 'email',
      subject: 'Welcome',
      message: 'Notification preview mode works.',
      status: 'pending'
    })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.data.recipient, 'admin@example.com');
  assert.equal(body.data.channel, 'email');
});

test('GET /notifications returns created preview notifications', async () => {
  const response = await fetch(`${baseUrl}/notifications`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.count, 1);
  assert.equal(body.data[0].recipient, 'admin@example.com');
});

test('GET unknown route returns standardized 404 error', async () => {
  const response = await fetch(`${baseUrl}/missing-route`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
});
