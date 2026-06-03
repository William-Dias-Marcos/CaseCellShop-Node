import { getProducts } from "../repositories/product.repository";
import {
  getOrderByIdempotencyKey,
  saveOrder,
  Order,
} from "../repositories/order.repository";
import { v4 as uuidv4 } from "uuid";
import { processCheckoutJob } from "../workers/checkout.worker";
import { checkoutStartedTotal } from "../metrics/checkout.metrics";

export const processCheckout = async (
  productId: string,
  quantity: number,
  idempotencyKey?: string,
): Promise<{
  order: Order;
  isIdempotent: boolean;
  success: boolean;
  error?: string;
}> => {
  // Regra 1: Idempotência
  if (idempotencyKey) {
    const existingOrder = await getOrderByIdempotencyKey(idempotencyKey);
    if (existingOrder) {
      return { order: existingOrder, isIdempotent: true, success: true };
    }
  }

  // Regra 2: Lock Atômico (Em Memória). Recuperamos os produtos por referência.
  const products = await getProducts();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return {
      order: {} as Order,
      isIdempotent: false,
      success: false,
      error: "Produto não encontrado",
    };
  }

  if (product.stock < quantity) {
    return {
      order: {} as Order,
      isIdempotent: false,
      success: false,
      error: "Estoque insuficiente",
    };
  }

  // Consistência: Reserva imediata do estoque garantida pela execução síncrona
  product.stock -= quantity;

  const order: Order = {
    id: uuidv4(),
    productId,
    quantity,
    status: "PENDING",
    idempotencyKey,
  };
  await saveOrder(order);
  checkoutStartedTotal.inc();
  processCheckoutJob(order.id); // Despacha para o background sem aguardar o retorno

  return { order, isIdempotent: false, success: true };
};
