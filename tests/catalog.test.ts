import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { buildApp } from "../src/app";
import { FastifyInstance } from "fastify";

describe("Catalog Integration Tests", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar a lista de produtos com sucesso e registrar um Cache Miss", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/products",
    });

    expect(response.statusCode).toBe(200);
    const products = JSON.parse(response.payload);

    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
    expect(products[0]).toHaveProperty("id");
    expect(products[0]).toHaveProperty("name");
    expect(products[0]).toHaveProperty("stock");

    // Verifica se a métrica de Cache Miss foi registrada no Prometheus
    const metrics = await app.inject({ method: "GET", url: "/metrics" });
    expect(metrics.payload).toContain("cache_misses_total");
  });

  it("deve retornar a lista de produtos instantaneamente e registrar um Cache Hit", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/products",
    });

    expect(response.statusCode).toBe(200);

    // Verifica se a métrica de Cache Hit foi registrada no Prometheus devido à requisição anterior
    const metrics = await app.inject({ method: "GET", url: "/metrics" });
    expect(metrics.payload).toContain("cache_hits_total");
  });
});
