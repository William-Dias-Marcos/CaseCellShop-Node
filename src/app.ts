import Fastify from "fastify";
import crypto from "crypto";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { getMetrics } from "./metrics/metrics";
import { productRoutes } from "./routes/products.routes";
import { checkoutRoutes } from "./routes/checkout.routes";
import { orderRoutes } from "./routes/orders.routes";
import { tracer } from "./telemetry/tracing";
import { SpanStatusCode } from "@opentelemetry/api";

export const buildApp = () => {
  const app = Fastify({
    logger: {
      level: "info",
      // O Pino já formata em JSON nativamente. Usaremos pino-pretty apenas no modo dev se necessário,
      // mas para cumprir o requisito de logs estruturados em JSON, o padrão é excelente.
    },
    // Geração automática de requestId (requisito de observabilidade)
    genReqId: () => crypto.randomUUID(),
  });

  // Segurança: Proteção contra vulnerabilidades web adicionando cabeçalhos HTTP defensivos
  // CSP desligado localmente para não bloquear a renderização dos scripts do Swagger UI
  app.register(helmet, { contentSecurityPolicy: false });

  // Segurança: Proteção contra ataques de negação de Serviço (DoS) e Brute Force
  app.register(rateLimit, {
    max: 100, // Limite de 100 requisições...
    timeWindow: "1 minute", // ...por minuto por IP
    // O Fastify retorna 429 Too Many Requests automaticamente ao exceder o limite
  });

  // Hook para iniciar o trace (Span) na requisição HTTP
  app.addHook("onRequest", (request, reply, done) => {
    const span = tracer.startSpan(
      `HTTP ${request.method} ${request.routeOptions?.url || request.url}`,
    );
    span.setAttribute("http.method", request.method);
    span.setAttribute("http.url", request.url);
    (request as any).span = span;
    done();
  });

  // Hook para finalizar o trace (Span) na resposta
  app.addHook("onResponse", (request, reply, done) => {
    const span = (request as any).span;
    if (span) {
      span.setAttribute("http.status_code", reply.statusCode);
      span.setStatus({
        code:
          reply.statusCode >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
      });
      span.end();
    }
    done();
  });

  // Configuração do Swagger (OpenAPI)
  app.register(swagger, {
    openapi: {
      info: {
        title: "CaseCellShop API",
        description: "API para a plataforma backend da CaseCellShop",
        version: "1.0.0",
      },
    },
  });

  app.register(swaggerUi, {
    routePrefix: "/docs",
  });

  // Rota de health check básica
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  // Rota de métricas do Prometheus
  app.get("/metrics", async (request, reply) => {
    reply.header("Content-Type", "text/plain");
    return getMetrics();
  });

  // Registrando as rotas
  app.register(productRoutes);
  app.register(checkoutRoutes);
  app.register(orderRoutes);

  return app;
};
