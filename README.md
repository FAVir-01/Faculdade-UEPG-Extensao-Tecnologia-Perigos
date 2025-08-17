# Chat Proxy

Endpoint Next.js `/api/chat` que encaminha o corpo JSON recebido para `CHAT_WEBHOOK_URL` utilizando cabeçalhos de autenticação e assinatura.

## `/api/chat`

- **URL:** `/api/chat`
- **Variáveis de ambiente:**
  - `CHAT_WEBHOOK_URL`
  - `CHAT_BASIC_USER`
  - `CHAT_BASIC_PASS`
  - `CHAT_SHARED_SECRET`
  - `ALLOWED_ORIGIN` (opcional)

### Como testar

Healthcheck:

```bash
curl -s https://SEU-APP.vercel.app/api/chat | jq
```

POST simples:

```bash
curl -i -X POST https://SEU-APP.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"ping":"ok"}'
```

## Desenvolvimento

```bash
npm run dev
```

## Testes

```bash
npm test
```

