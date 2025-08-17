// pages/api/chat.js
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Signature");
  res.setHeader("Access-Control-Max-Age", "86400");
}

async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    const { CHAT_WEBHOOK_URL, CHAT_BASIC_USER, CHAT_BASIC_PASS, CHAT_SHARED_SECRET } = process.env;
    return res.status(200).json({
      ok: true,
      env: {
        CHAT_WEBHOOK_URL: !!CHAT_WEBHOOK_URL,
        CHAT_BASIC_USER: !!CHAT_BASIC_USER,
        CHAT_BASIC_PASS: !!CHAT_BASIC_PASS,
        CHAT_SHARED_SECRET: !!CHAT_SHARED_SECRET,
        ALLOWED_ORIGIN: allowedOrigin,
      },
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { CHAT_WEBHOOK_URL, CHAT_BASIC_USER, CHAT_BASIC_PASS, CHAT_SHARED_SECRET } = process.env;
  if (!CHAT_WEBHOOK_URL || !CHAT_BASIC_USER || !CHAT_BASIC_PASS || !CHAT_SHARED_SECRET) {
    return res.status(500).json({ error: "Missing environment variables" });
  }

  try {
    const auth = Buffer.from(`${CHAT_BASIC_USER}:${CHAT_BASIC_PASS}`).toString("base64");
    const n8nResp = await fetch(CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
        "X-Signature": CHAT_SHARED_SECRET,
      },
      body: JSON.stringify(req.body ?? {}),
    });
    const contentType = n8nResp.headers.get("content-type") || "application/json; charset=utf-8";
    const text = await n8nResp.text();
    res.setHeader("Content-Type", contentType);
    return res.status(n8nResp.status).send(text);
  } catch (err) {
    console.error("proxy-error", { message: err?.message, stack: err?.stack });
    return res.status(500).json({ error: "Failed to call webhook", detail: err?.message || "unknown" });
  }
}

export default handler;
