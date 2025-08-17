const handler = require('../pages/api/chat');
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

  it('rejects non-POST requests', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });
});
