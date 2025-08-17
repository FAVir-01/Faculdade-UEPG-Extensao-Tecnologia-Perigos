# Chat Proxy

Endpoint Next.js `/api/chat` que encaminha o corpo JSON recebido para `CHAT_WEBHOOK_URL` utilizando cabeçalhos de autenticação e assinatura.

## `/api/chat`

- **URL:** `/api/chat`
- **Variáveis de ambiente:**
  - `CHAT_WEBHOOK_URL`: URL do webhook n8n que receberá o POST
  - `CHAT_BASIC_USER`: usuário para o header `Authorization: Basic`
  - `CHAT_BASIC_PASS`: senha para o header `Authorization: Basic`
  - `CHAT_SHARED_SECRET`: valor enviado em `X-Signature`
  - `ALLOWED_ORIGIN` (opcional): origem permitida para CORS

### Como testar

Healthcheck (verifica se as variáveis de ambiente estão configuradas):

```bash
curl -s https://SEU-APP.vercel.app/api/chat | jq
# {
#   "ok": true,
#   "env": { "CHAT_WEBHOOK_URL": true, ... }
# }
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

