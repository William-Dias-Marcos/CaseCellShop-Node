import { FastifyInstance } from "fastify";
import { getProducts } from "../repositories/product.repository";
import { getFromCache, setInCache } from "../cache/products.cache";

export const productRoutes = async (app: FastifyInstance) => {
  app.get(
    "/products",
    {
      schema: {
        description: "Retorna o catálogo de produtos disponíveis",
        tags: ["Catálogo"],
        response: {
          200: {
            description: "Lista de produtos retornada com sucesso",
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                price: { type: "number" },
                stock: { type: "number" },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const cacheKey = "catalog:products";
      const cachedProducts = getFromCache(cacheKey);

      if (cachedProducts) {
        request.log.info(
          { cache: "hit", key: cacheKey },
          "Produtos retornados do cache",
        );
        return reply.send(cachedProducts);
      }

      request.log.info(
        { cache: "miss", key: cacheKey },
        "Buscando produtos do repositório",
      );
      const products = await getProducts();

      setInCache(cacheKey, products);
      return reply.send(products);
    },
  );
};
