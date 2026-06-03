import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app";
import { FastifyInstance } from "fastify";

describe("Checkout Integration Tests", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    // Instancia o app mas não faz o bind em nenhuma porta.
    // O inject cuidará das chamadas.
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve processar um checkout com sucesso (Status 202)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/checkout",
      payload: { productId: "1", quantity: 1 }, // Produto 1 começa com 100 de estoque
    });

    expect(response.statusCode).toBe(202);
    const body = JSON.parse(response.payload);

    expect(body).toHaveProperty("orderId");
    expect(body.status).toBe("PENDING");
  });

  it("não deve permitir overselling (venda acima do estoque disponível)", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/checkout",
      payload: { productId: "1", quantity: 1000 }, // Tenta comprar 1000, mas o estoque é < 100
    });

    expect(response.statusCode).toBe(422);
    const body = JSON.parse(response.payload);
    expect(body.error).toBe("Estoque insuficiente");
  });

  it("deve garantir segurança contra concorrência (Race Conditions)", async () => {
    // O Produto 3 ("Carregador Turbo 20W") possui exatamente 30 unidades no repositório em memória
    // Dispararemos 4 requisições simultâneas de 10 unidades cada
    const requests = Array.from({ length: 4 }).map(() =>
      app.inject({
        method: "POST",
        url: "/checkout",
        payload: { productId: "3", quantity: 10 },
      }),
    );

    const responses = await Promise.all(requests);

    const accepted = responses.filter((r) => r.statusCode === 202);
    const rejected = responses.filter((r) => r.statusCode === 422);

    // Apenas 3 transações devem passar (3 x 10 = 30) e 1 deve ser rejeitada
    expect(accepted.length).toBe(3);
    expect(rejected.length).toBe(1);
    expect(JSON.parse(rejected[0].payload).error).toBe("Estoque insuficiente");
  });

  it("deve respeitar a chave de idempotência e não duplicar pedidos", async () => {
    const idempotencyKey = "minha-chave-unica-de-teste-123";
    const payload = { productId: "2", quantity: 1 };

    const response1 = await app.inject({
      method: "POST",
      url: "/checkout",
      headers: { "idempotency-key": idempotencyKey },
      payload,
    });
    const response2 = await app.inject({
      method: "POST",
      url: "/checkout",
      headers: { "idempotency-key": idempotencyKey },
      payload,
    });

    // Deve recuperar o exato mesmo pedido, indicando que não foi processado duas vezes
    expect(response1.statusCode).toBe(202);
    expect(JSON.parse(response1.payload).orderId).toBe(
      JSON.parse(response2.payload).orderId,
    );
  });
});
