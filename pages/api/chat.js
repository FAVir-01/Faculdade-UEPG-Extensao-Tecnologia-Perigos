// pages/api/chat.js
function setCors(req, res) {
  const origin = process.env.ALLOWED_ORIGIN;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Signature");
  res.setHeader("Access-Control-Max-Age", "86400");
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const resolveEvent = () => {
    const queryEvent = req.query?.event;
    if (typeof queryEvent === "string" && queryEvent.trim()) {
      return queryEvent;
    }
    const bodyEvent = req.body && typeof req.body === "object" ? req.body.event : undefined;
    if (typeof bodyEvent === "string" && bodyEvent.trim()) {
      return bodyEvent;
    }
    return "conversation_ongoing";
  };

  const buildPayload = () => {
    if (!req.body || typeof req.body !== "object") {
      return { event: resolveEvent() };
    }

    const { event: _ignoredEvent, ...rest } = req.body;
    return { event: resolveEvent(), ...rest };
  };

  const { CHAT_WEBHOOK_URL, CHAT_BASIC_USER, CHAT_BASIC_PASS, CHAT_SHARED_SECRET } = process.env;
  if (!CHAT_WEBHOOK_URL || !CHAT_BASIC_USER || !CHAT_BASIC_PASS || !CHAT_SHARED_SECRET) {
    console.error("missing-env");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  try {
    console.log("forwarding to webhook");
    const started = Date.now();
    const auth = Buffer.from(`${CHAT_BASIC_USER}:${CHAT_BASIC_PASS}`).toString("base64");
    const payload = buildPayload();
    const n8nResp = await fetch(CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
        "X-Signature": CHAT_SHARED_SECRET,
      },
      body: JSON.stringify(payload),
    });
    const contentType = n8nResp.headers.get("content-type") || "application/json; charset=utf-8";
    const text = await n8nResp.text();
    console.log("webhook-response", { status: n8nResp.status, ms: Date.now() - started });
    res.setHeader("Content-Type", contentType);
    return res.status(n8nResp.status).send(text);
  } catch (err) {
    console.error("webhook-error", { message: err?.message });
    return res.status(500).json({ error: "Failed to call webhook" });
  }
}
