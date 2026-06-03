import { FastifyInstance } from "fastify";
import { getOrder } from "../repositories/order.repository";

export const orderRoutes = async (app: FastifyInstance) => {
  app.get(
    "/orders/:orderId/status",
    {
      schema: {
        description: "Consulta o status atual de um pedido",
        tags: ["Pedidos"],
        params: {
          type: "object",
          required: ["orderId"],
          properties: {
            orderId: {
              type: "string",
              description: "UUID do pedido gerado no checkout",
            },
          },
        },
        response: {
          200: {
            description: "Status do pedido recuperado com sucesso",
            type: "object",
            properties: {
              orderId: { type: "string" },
              status: { type: "string" },
            },
          },
          404: {
            description: "Pedido não encontrado",
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { orderId } = request.params as { orderId: string };
      const order = await getOrder(orderId);

      if (!order) {
        request.log.warn(
          { orderId },
          "Tentativa de consulta a pedido inexistente",
        );
        return reply.code(404).send({ error: "Pedido não encontrado" });
      }

      return reply.code(200).send({ orderId: order.id, status: order.status });
    },
  );
};
