import { FastifyInstance } from "fastify";
import { checkoutBodySchema } from "../schemas/checkout.schema";
import { processCheckout } from "../services/checkout.service";

export const checkoutRoutes = async (app: FastifyInstance) => {
  app.post(
    "/checkout",
    {
      schema: {
        description: "Inicia o processamento assíncrono de um pedido",
        tags: ["Checkout"],
        headers: {
          type: "object",
          properties: {
            "idempotency-key": {
              type: "string",
              description: "Chave de idempotência para evitar duplicação",
            },
          },
        },
        body: {
          type: "object",
          required: ["productId", "quantity"],
          properties: {
            productId: { type: "string" },
            quantity: { type: "number" },
          },
        },
        response: {
          202: {
            description: "Pedido aceito para processamento",
            type: "object",
            properties: {
              orderId: { type: "string" },
              status: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const idempotencyKey = request.headers["idempotency-key"] as
        | string
        | undefined;

      // Validação de Payload com Zod
      const parsedBody = checkoutBodySchema.safeParse(request.body);
      if (!parsedBody.success) {
        return reply.code(400).send({
          error: "Dados inválidos",
          details: parsedBody.error.format(),
        });
      }

      const { productId, quantity } = parsedBody.data;
      const result = await processCheckout(productId, quantity, idempotencyKey);

      if (!result.success) {
        request.log.warn(
          { productId, quantity, error: result.error },
          "Falha no checkout",
        );
        return reply.code(422).send({ error: result.error });
      }

      // Logs Estruturados de acordo com o padrão estipulado
      const logMsg = result.isIdempotent
        ? "checkout_idempotente_recuperado"
        : "checkout_started";
      request.log.info(
        {
          orderId: result.order.id,
          productId,
          quantity,
          correlationId: idempotencyKey,
        },
        logMsg,
      );

      return reply
        .code(202)
        .send({ orderId: result.order.id, status: result.order.status });
    },
  );
};
