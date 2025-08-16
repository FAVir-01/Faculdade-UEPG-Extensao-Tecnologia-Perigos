# Chat Proxy

Endpoint Next.js `/api/chat` que encaminha o corpo JSON recebido para `CHAT_WEBHOOK_URL` utilizando cabeçalhos:

- `Authorization: Basic user:pass` (a partir de `CHAT_BASIC_USER` e `CHAT_BASIC_PASS`)
- `X-Signature: CHAT_SHARED_SECRET`

O status e o corpo retornados pelo webhook são repassados ao cliente.

## Variáveis de ambiente

- `CHAT_WEBHOOK_URL`
- `CHAT_BASIC_USER`
- `CHAT_BASIC_PASS`
- `CHAT_SHARED_SECRET`

## Desenvolvimento

```bash
npm run dev
```

## Testes

```bash
npm test
```
