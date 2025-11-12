import handler from '../pages/api/chat.js';
import { createMocks } from 'node-mocks-http';

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
      body: JSON.stringify({ event: 'conversation_ongoing', hello: 'world' }),
    });

    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toBe(JSON.stringify({ ok: true }));
  });

  it('returns healthcheck on GET', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toBe(JSON.stringify({ ok: true }));
  });

  it('handles CORS preflight', async () => {
    process.env.ALLOWED_ORIGIN = 'https://allowed.example';
    const { req, res } = createMocks({ method: 'OPTIONS' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(204);
    expect(res.getHeader('Access-Control-Allow-Origin')).toBe('https://allowed.example');
    delete process.env.ALLOWED_ORIGIN;
  });

  it('allows overriding the event via query string', async () => {
    global.fetch.mockResolvedValue({
      status: 200,
      text: () => Promise.resolve(JSON.stringify({ ok: true, output: 'Hello' })),
      headers: { get: () => 'application/json' },
    });

    const { req, res } = createMocks({
      method: 'POST',
      query: { event: 'conversation_started' },
      body: { initial: true },
    });

    await handler(req, res);

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from('user:pass').toString('base64')}`,
        'X-Signature': 'secret',
      },
      body: JSON.stringify({ event: 'conversation_started', initial: true }),
    });

    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toBe(JSON.stringify({ ok: true, output: 'Hello' }));
  });

  it('rejects unsupported methods', async () => {
    const { req, res } = createMocks({ method: 'PUT' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });
});
