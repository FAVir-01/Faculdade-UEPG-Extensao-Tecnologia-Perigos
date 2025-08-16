const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const {
    CHAT_WEBHOOK_URL,
    CHAT_BASIC_USER,
    CHAT_BASIC_PASS,
    CHAT_SHARED_SECRET,
  } = process.env;

  if (!CHAT_WEBHOOK_URL || !CHAT_BASIC_USER || !CHAT_BASIC_PASS || !CHAT_SHARED_SECRET) {
    res.status(500).json({ error: 'Missing environment variables' });
    return;
  }

  try {
    const auth = Buffer.from(`${CHAT_BASIC_USER}:${CHAT_BASIC_PASS}`).toString('base64');

    const n8nResponse = await fetch(CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
        'X-Signature': CHAT_SHARED_SECRET,
      },
      body: JSON.stringify(req.body),
    });

    const text = await n8nResponse.text();
    const contentType = n8nResponse.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    res.status(n8nResponse.status).send(text);
  } catch (err) {
    res.status(500).json({ error: 'Failed to call webhook' });
  }
};

module.exports = handler;
