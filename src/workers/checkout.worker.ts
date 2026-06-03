import { getOrder, saveOrder } from "../repositories/order.repository";
import {
  checkoutCompletedTotal,
  checkoutFailedTotal,
} from "../metrics/checkout.metrics";
import { workerJobsProcessedTotal } from "../metrics/worker.metrics";
import { runWithSpan } from "../telemetry/tracing";

export const processCheckoutJob = async (orderId: string): Promise<void> => {
  runWithSpan("worker:processCheckoutJob", async () => {
    // Simula o atraso na captura do job de uma fila (1 segundo)
    setTimeout(async () => {
      try {
        const order = await getOrder(orderId);
        if (!order) return;

        order.status = "PROCESSING";
        await saveOrder(order);

        // Simula o tempo de processamento em um ERP externo (2 segundos)
        setTimeout(async () => {
          try {
            // 80% de chance de sucesso para fins de demonstração
            const isSuccess = Math.random() > 0.2;

            order.status = isSuccess ? "COMPLETED" : "FAILED";
            await saveOrder(order);

            workerJobsProcessedTotal.inc();
            if (isSuccess) checkoutCompletedTotal.inc();
            else checkoutFailedTotal.inc();
          } catch (err) {
            console.error("Erro no processamento do ERP externo:", err);
          }
        }, 2000);
      } catch (err) {
        console.error("Erro na captura do Job do worker:", err);
      }
    }, 1000);
  });
};
