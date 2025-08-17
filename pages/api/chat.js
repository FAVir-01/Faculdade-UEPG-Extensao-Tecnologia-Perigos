// pages/api/chat.js

export default async function handler(req, res) {
  // CORS — ajuste se seu front estiver em GitHub Pages
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Signature');

  if (req.method === 'OPTIONS') return res.status(204).end();

  // Healthcheck simples (útil para ver envs na Vercel)
  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      message: 'Use POST para encaminhar ao webhook n8n',
      hasEnv: {
        CHAT_WEBHOOK_URL: !!process.env.CHAT_WEBHOOK_URL,
        CHAT_BASIC_USER: !!process.env.CHAT_BASIC_USER,
        CHAT_BASIC_PASS: !!process.env.CHAT_BASIC_PASS,
        CHAT_SHARED_SECRET: !!process.env.CHAT_SHARED_SECRET,
      },
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS, GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    CHAT_WEBHOOK_URL,
    CHAT_BASIC_USER,
    CHAT_BASIC_PASS,
    CHAT_SHARED_SECRET,
  } = process.env;

  const missing = [];
  if (!CHAT_WEBHOOK_URL) missing.push('CHAT_WEBHOOK_URL');
  if (!CHAT_BASIC_USER) missing.push('CHAT_BASIC_USER');
  if (!CHAT_BASIC_PASS) missing.push('CHAT_BASIC_PASS');
  if (!CHAT_SHARED_SECRET) missing.push('CHAT_SHARED_SECRET');

  if (missing.length) {
    console.error('Missing envs:', missing);
    return res.status(500).json({ error: 'Missing env vars', missing });
  }

  try {
    const basic = Buffer.from(`${CHAT_BASIC_USER}:${CHAT_BASIC_PASS}`).toString('base64');

    const payload = typeof req.body === 'object' ? req.body : {};
    const upstream = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basic}`,
        'X-Signature': CHAT_SHARED_SECRET,
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    const ct = upstream.headers.get('content-type') || 'text/plain';

    res.setHeader('Access-Control-Allow-Origin', allowed);
    res.setHeader('Content-Type', ct);
    return res.status(upstream.status).send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy failed', details: String(err) });
  }
}
