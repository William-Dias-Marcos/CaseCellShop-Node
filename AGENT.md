# AGENT.md

## Contexto

**Status:** 🟢 Projeto 100% Concluído

Este projeto implementa uma mini plataforma backend para a CaseCellShop.

A implementação deve utilizar obrigatoriamente:

- Node.js
- TypeScript

O objetivo não é construir um e-commerce completo, é focar em:

- Design de APIs REST
- Cache com TTL
- Processamento assíncrono
- Consistência de estoque
- Idempotência
- Observabilidade
- Testes automatizados
- Documentação técnica

Sempre priorize simplicidade, clareza, tipagem forte e executabilidade local.

---

## Stack Tecnológica

### Obrigatória

- Node.js
- TypeScript

### Recomendada

- Fastify (ou Express, justificando a escolha)
- Zod para validação
- Swagger/OpenAPI
- Prometheus Client
- OpenTelemetry
- Vitest ou Jest
- Pino para logs estruturados
- @fastify/helmet para segurança de cabeçalhos
- @fastify/rate-limit para prevenção de DDoS/Brute Force

### Dependências Externas

O projeto deve funcionar localmente sem necessidade de serviços externos.

Redis, RabbitMQ, Kafka ou banco de dados são opcionais.

Por padrão:

- armazenamento em memória
- fila em memória
- cache em memória

---

## Objetivos Funcionais

### Catálogo

Implementar:

GET /products

Requisitos:

- Retornar catálogo de produtos.
- Utilizar cache com TTL.
- Expor métricas de cache hit/miss.
- Permitir invalidação simples quando necessário.

---

### Checkout

Implementar:

POST /checkout

Requisitos:

- Processamento assíncrono.
- Retornar HTTP 202 Accepted.
- Resposta mínima:

```json
{
  "orderId": "uuid",
  "status": "PENDING"
}
```

- Criar pedido inicialmente em estado PENDING.
- Publicar trabalho para worker interno ou fila simulada.

---

### Status do Pedido

Implementar:

GET /orders/:orderId/status

Resposta:

```json
{
  "orderId": "uuid",
  "status": "PENDING"
}
```

Possíveis status:

- PENDING
- PROCESSING
- COMPLETED
- FAILED

---

## Requisitos de Consistência

### Estoque

Nunca permitir venda acima do estoque disponível.

Implementar estratégia segura para concorrência:

- mutex
- lock por produto
- atomic update
- reserva de estoque

Qualquer abordagem é válida desde que seja determinística.

---

### Idempotência

Implementar suporte ao header:

Idempotency-Key

Regras:

- Requisição repetida com mesma chave deve retornar o mesmo pedido.
- Não criar múltiplos pedidos para duplo clique ou retries.

---

## Cache

Implementar cache para:

GET /products

Requisitos:

- TTL configurável.
- Métricas:
  - cache_hits_total
  - cache_misses_total

Implementação preferencial:

- cache em memória utilizando Map + TTL

O projeto deve funcionar sem Redis.

---

## Worker Assíncrono

Implementar worker local simulando integração com ERP.

Fluxo:

PENDING
→ PROCESSING
→ COMPLETED

ou

PENDING
→ PROCESSING
→ FAILED

Adicionar atraso artificial para demonstrar processamento assíncrono.

Utilizar:

- setTimeout
- fila em memória
- worker interno

Não utilizar serviços externos obrigatórios.

---

## Observabilidade

### Logs

Todos os logs devem ser estruturados em JSON.

Utilizar preferencialmente:

- Pino

Campos obrigatórios:

- timestamp
- level
- message
- requestId
- correlationId

Quando existir pedido:

- orderId

Exemplo:

```json
{
  "level": "info",
  "message": "checkout_started",
  "requestId": "req-123",
  "correlationId": "corr-123",
  "orderId": "ord-456"
}
```

---

### Métricas

Expor endpoint:

GET /metrics

Métricas mínimas:

```text
cache_hits_total
cache_misses_total

checkout_started_total
checkout_completed_total
checkout_failed_total

worker_jobs_processed_total
```

Utilizar:

- prom-client

---

## Segurança e Produção (Production Ready)

Para garantir resiliência e maturidade, o projeto deve implementar:

- [x] **Validação de Ambiente:** Validar as variáveis (`.env`) rigorosamente no boot da aplicação (ex: com Zod).
- [x] **Segurança Web:** Adicionar cabeçalhos de defesa HTTP e limite de requisições por IP (Rate Limiting).
- [x] **Resiliência:** Tratar rejeições de Promises em workers assíncronos e prover rotina de _Graceful Shutdown_ ao desligar o servidor.
- [x] **Containerização:** Fornecer um `Dockerfile` otimizado (_Multi-stage build_) rodando sob usuário não-root.

---

### Tracing

Implementar OpenTelemetry.

Criar spans para:

- request HTTP
- cache
- repository
- worker

Caso não exista exportador real, documentar a simplificação no README.

---

## OpenAPI

Manter documentação OpenAPI atualizada.

Requisitos:

- schemas de sucesso
- schemas de erro
- exemplos de request
- exemplos de response

Endpoints obrigatórios:

- GET /products
- POST /checkout
- GET /orders/:orderId/status
- GET /metrics

---

## Estrutura Recomendada

```text
src/
├── app.ts
├── server.ts
├── env.ts

├── routes/
│   ├── products.routes.ts
│   ├── checkout.routes.ts
│   └── orders.routes.ts

├── services/
│   ├── product.service.ts
│   ├── checkout.service.ts
│   └── order.service.ts

├── repositories/
│   ├── product.repository.ts
│   └── order.repository.ts

├── cache/
│   └── products.cache.ts

├── workers/
│   └── checkout.worker.ts

├── telemetry/
│   └── tracing.ts

├── metrics/
│   └── metrics.ts

├── middleware/
│   ├── request-id.ts
│   └── idempotency.ts

├── schemas/
├── types/
└── utils/

tests/
docs/

README.md
AGENT.md
.env.example
Dockerfile
.dockerignore
```

---

## Testes

Cobertura mínima obrigatória:

### Catálogo

- cache miss
- cache hit

### Checkout

- criação de pedido

### Idempotência

- mesma chave retorna mesmo pedido

### Concorrência

- múltiplos checkouts simultâneos
- estoque nunca fica negativo
- overselling nunca ocorre

### Worker

- mudança de status
- processamento assíncrono

---

## README

Documentar:

### Arquitetura

- API
- Cache
- Worker
- Observabilidade

### Trade-offs

- armazenamento em memória
- fila simulada
- ERP simulado

### Como Executar

```bash
npm install
npm run dev
```

### Como Testar

```bash
npm test
```

### OpenAPI

```bash
http://localhost:3000/docs
```

### Métricas

```bash
http://localhost:3000/metrics
```

### Prompts de IA Utilizados

Registrar os prompts relevantes utilizados durante o desenvolvimento.

---

## Restrições

Não implementar:

- autenticação
- autorização
- pagamento real
- ERP real
- frontend
- deploy obrigatório

O foco é demonstrar capacidade de engenharia backend.

---

## Critérios de Aceitação

A implementação é considerada pronta quando:

- [x] GET /products utiliza cache.
- [x] POST /checkout retorna HTTP 202.
- [x] Status do pedido pode ser consultado.
- [x] Estoque não permite overselling.
- [x] Idempotência funciona.
- [x] Worker processa pedidos.
- [x] Logs possuem correlationId e requestId.
- [x] Métricas estão disponíveis.
- [x] OpenAPI está documentada.
- [x] Testes passam.
- [x] README documenta decisões e limitações.

---

## Diretrizes para IA

Ao gerar código:

1. Utilizar TypeScript strict mode.
2. Priorizar código simples e legível.
3. Evitar abstrações prematuras.
4. Manter forte tipagem.
5. Não remover observabilidade existente.
6. Não remover verificações de estoque.
7. Não quebrar idempotência.
8. Atualizar OpenAPI quando alterar contratos.
9. Atualizar README quando alterar comportamento.
10. Sempre adicionar testes para novas regras de negócio.
11. Preferir composição a herança.
12. Seguir princípios SOLID apenas quando agregarem clareza.
13. Produzir código pronto para execução local.
