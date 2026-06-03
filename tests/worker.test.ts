import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { processCheckoutJob } from "../src/workers/checkout.worker";
import { saveOrder, getOrder } from "../src/repositories/order.repository";

describe("Worker Integration Tests", () => {
  beforeEach(() => {
    // Habilita os temporizadores falsos para não precisarmos esperar os segundos do setTimeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restaura o relógio original e limpa os mocks (como o Math.random)
    vi.restoreAllMocks();
  });

  it("deve transicionar o pedido para PROCESSING e depois COMPLETED com sucesso", async () => {
    // Mock do Math.random para retornar 0.5 (Garante isSuccess = true)
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const orderId = "order-success-123";
    await saveOrder({
      id: orderId,
      productId: "1",
      quantity: 1,
      status: "PENDING",
    });

    // Dispara a rotina assíncrona
    processCheckoutJob(orderId);

    // Avança 1 segundo virtual no tempo (Simula captura do Job)
    await vi.advanceTimersByTimeAsync(1000);

    let order = await getOrder(orderId);
    expect(order?.status).toBe("PROCESSING");

    // Avança mais 2 segundos virtuais no tempo (Simula processamento do ERP)
    await vi.advanceTimersByTimeAsync(2000);

    order = await getOrder(orderId);
    expect(order?.status).toBe("COMPLETED");
  });

  it("deve transicionar o pedido para PROCESSING e depois FAILED caso o ERP falhe", async () => {
    // Mock do Math.random para retornar 0.1 (Garante isSuccess = false)
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const orderId = "order-fail-456";
    await saveOrder({
      id: orderId,
      productId: "2",
      quantity: 2,
      status: "PENDING",
    });

    processCheckoutJob(orderId);

    await vi.advanceTimersByTimeAsync(1000);
    let order = await getOrder(orderId);
    expect(order?.status).toBe("PROCESSING");

    await vi.advanceTimersByTimeAsync(2000);
    order = await getOrder(orderId);
    expect(order?.status).toBe("FAILED");
  });
});
