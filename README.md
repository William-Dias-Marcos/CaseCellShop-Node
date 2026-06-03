# CaseCellShop - Plataforma Backend

[![CI Pipeline](https://github.com/William-Dias-Marcos/CaseCellShop-Node/actions/workflows/ci.yml/badge.svg)](https://github.com/William-Dias-Marcos/CaseCellShop-Node/actions/workflows/ci.yml)

Este projeto implementa uma mini plataforma backend para a CaseCellShop, desenvolvida como teste técnico para demonstrar proficiência em Node.js, TypeScript e arquitetura de software. O foco é a implementação de conceitos cruciais como design de APIs REST, sistema de cache, concorrência, idempotência e observabilidade profunda.

---

## 🚀 Como Executar Localmente

O projeto foi construído prezando pela simplicidade e ausência de dependências externas (bancos de dados, Redis, RabbitMQ). Ele é **100% executável localmente** rodando apenas na memória do Node.js.

### 1. Preparando o Ambiente

Crie o seu arquivo de variáveis de ambiente com base no exemplo:

```bash
cp .env.example .env
```

### 2. Instalando as Dependências

```bash
npm install
```

### 3. Iniciando o Servidor (Desenvolvimento)

```bash
npm run dev
```

---

## 🐳 Como Fazer o Deploy (Produção)

O projeto conta com um `Dockerfile` otimizado em múltiplas etapas (_multi-stage build_) e mecanismo de _Graceful Shutdown_, pronto para subir em plataformas de nuvem modernas (AWS ECS, Render, Railway, Fly.io).

1. Faça o build da imagem Docker localmente:

```bash
docker build -t casecellshop-api .
```

2. Execute o contêiner injetando as variáveis de ambiente:

```bash
docker run -p 3000:3000 -e PORT=3000 -e HOST=0.0.0.0 -e NODE_ENV=production casecellshop-api
```

---

## 🧪 Como Testar

O projeto conta com uma robusta suíte de testes de integração e unitários rodando sobre o **Vitest**, que injeta requisições diretamente na instância do Fastify, validando lógicas como _overselling_ (vender sem estoque), chaves de idempotência e filas assíncronas (usando _Fake Timers_).

Para rodar os testes:

```bash
npm test
```

---

## ⚙️ CI/CD (Continuous Integration)

O repositório está configurado com **GitHub Actions**. Qualquer _push_ ou _pull request_ para a branch `main` disparará automaticamente uma esteira na nuvem que:

1. Faz o setup do Node.js (v24) com cache ativado.
2. Instala as dependências de forma limpa (`npm ci`).
3. Executa a suíte de testes de integração via Vitest.
4. Executa o build do TypeScript garantindo a integridade estática dos tipos.

---

## 📖 Documentação e APIs

Com o servidor em execução, acesse os seguintes endpoints no seu navegador:

- **Swagger / OpenAPI (Catálogo e Checkout):** [http://localhost:3000/docs](http://localhost:3000/docs)
- **Métricas do Prometheus:** [http://localhost:3000/metrics](http://localhost:3000/metrics)

---

## 🏗️ Arquitetura

### Stack Tecnológica

- **Linguagem:** TypeScript + Node.js (v24+)
- **Framework:** Fastify (Escolhido por sua extrema performance, hooks para tracing nativo e ecossistema de validação).
- **Validação:** Zod
- **Métricas e Logs:** `prom-client` e `pino` (Structured Logging em JSON)
- **Tracing:** `@opentelemetry/api`
- **Testes:** Vitest

### Desenho dos Componentes

1. **API (Rotas):** Expõe os contratos documentados via OpenAPI. Valida dados de entrada rigorosamente com Zod e faz fail-fast.
2. **Serviços:** Contêm regras de negócio puro (validação de estoque, idempotência).
3. **Repositórios:** Abstraem o acesso a dados. Neste projeto, os dados estão armazenados em estruturas como `Map` e arrays globais da V8.
4. **Cache:** Map em memória para consultas ao catálogo (`GET /products`), implementando TTL fixo e métricas de Hit/Miss.
5. **Worker Assíncrono:** Fila controlada em background (via Event Loop) que altera o status do pedido (`PENDING -> PROCESSING -> COMPLETED/FAILED`), simulando um sistema legado ou ERP.
6. **Observabilidade:** Métricas e traces globais amarrados pelo `Fastify hooks`.

---

## ⚖️ Trade-offs e Decisões Técnicas

Para garantir a executabilidade imediata proposta pelo teste, as seguintes abstrações foram tomadas:

### 1. Armazenamento em Memória vs Banco de Dados

- **Decisão:** Usar `Map<string, Order>` e um Array de `Product` injetados dinamicamente na execução.
- **Trade-off:** A aplicação é ultra-rápida e não precisa de `docker-compose`. Por outro lado, qualquer restart do servidor zera os dados (falta de persistência) e o sistema não escala horizontalmente (múltiplas réplicas teriam estoques independentes). Em produção real, migraríamos este repositório para um PostgreSQL com Locks (`SELECT FOR UPDATE`) para garantir a consistência de estoque.

### 2. Lock de Concorrência Síncrono

- **Decisão:** Aproveitar o fato de o JavaScript ser _Single-Threaded_. Atualizamos o Array global de forma síncrona dentro da validação.
- **Trade-off:** Protegeu perfeitamente contra race conditions localmente (validado nos testes). Em um ambiente distribuído com banco de dados real, precisaríamos de uma transação ACID.

### 3. Fila e Worker Simulados

- **Decisão:** Usar execução em _background_ não bloqueante (disparando a Promise sem `await`) acoplada a funções `setTimeout` para atraso artificial.
- **Trade-off:** Evita a configuração de um RabbitMQ ou SQS. No entanto, corremos risco de perder _jobs_ se o processo crachar no meio da execução (sem funcionalidade de _Dead Letter Queue_ ou retentativas automáticas).

### 4. Cache sem Redis

- **Decisão:** Sistema rudimentar de Map com tempo de expiração (`expiresAt`).
- **Trade-off:** Novamente, limita a escalabilidade horizontal e aumenta o uso de RAM (Heap Memory) do contêiner. Um Redis/Memcached seria a abordagem de produção, mas isso violaria a restrição de independência do teste.

### 5. OpenTelemetry Simulado (NoOp)

- **Decisão:** Implementação real dos _Spans_ e API de Tracing, mas sem um _Exporter_ plugado (como Jaeger).
- **Trade-off:** O código está devidamente instrumentado e pronto para produção (Zero Code Changes), mas localmente não penaliza a máquina tentando enviar telemetria para portas que não existem.

---

## 🤖 Prompts de IA Utilizados

Este projeto utilizou assistência de IA para alavancar a estruturação inicial e construção dos testes, mantendo a arquitetura proposta em `AGENT.md`.

- _"Vamos implementar o endpoint do Catálogo (GET /products) com o sistema de cache em memória e TTL configurável."_
- _"Perfeito, vamos implementar o endpoint de Checkout (POST /checkout) com validação do Zod e controle de estoque."_
- _"Vamos configurar o OpenTelemetry (Tracing) para monitorarmos as requisições e cumprir mais um requisito."_
- _"Vamos criar os testes unitários/integração usando Vitest para validarmos a regra do overselling de estoque."_
- _"Como vou entregar um teste técnico sem um .env?" (Geração de .env.example e validação Zod)._
