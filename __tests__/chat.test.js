const handler = require('../pages/api/chat').default;
const { createMocks } = require('node-mocks-http');

describe('/api/chat', () => {
  beforeEach(() => {
    process.env.CHAT_WEBHOOK_URL = 'https://example.com/webhook';
    process.env.CHAT_BASIC_USER = 'user';
    process.env.CHAT_BASIC_PASS = 'pass';
    process.env.CHAT_SHARED_SECRET = 'secret';
    global.fetch = jest.fn();
  });

  it('forwards request and returns response', async () => {
    const mockBody = { hello: 'world' };
    global.fetch.mockResolvedValue({
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ ok: true })),
      headers: { get: () => 'application/json' },
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: mockBody,
    });

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from('user:pass').toString('base64')}`,
        'X-Signature': 'secret',
      },
      body: JSON.stringify(mockBody),
    });

    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toBe(JSON.stringify({ ok: true }));
  });

  it('returns healthcheck on GET', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.ok).toBe(true);
    expect(data.env).toMatchObject({
      CHAT_WEBHOOK_URL: true,
      CHAT_BASIC_USER: true,
      CHAT_BASIC_PASS: true,
      CHAT_SHARED_SECRET: true,
      ALLOWED_ORIGIN: expect.any(String),
    });
  });

  it('rejects unsupported methods', async () => {
    const { req, res } = createMocks({ method: 'PUT' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });
});
