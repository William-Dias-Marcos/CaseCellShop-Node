import { runWithSpan } from "../telemetry/tracing";

export type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface Order {
  id: string;
  productId: string;
  quantity: number;
  status: OrderStatus;
  idempotencyKey?: string;
}

const orders = new Map<string, Order>();

export const saveOrder = async (order: Order): Promise<void> => {
  return runWithSpan("repository:saveOrder", async () => {
    orders.set(order.id, order);
  });
};

export const getOrder = async (id: string): Promise<Order | undefined> => {
  return runWithSpan("repository:getOrder", async () => {
    return orders.get(id);
  });
};

export const getOrderByIdempotencyKey = async (
  key: string,
): Promise<Order | undefined> => {
  return runWithSpan("repository:getOrderByIdempotencyKey", async () => {
    for (const order of orders.values()) {
      if (order.idempotencyKey === key) return order;
    }
    return undefined;
  });
};
