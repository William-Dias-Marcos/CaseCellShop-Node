import { buildApp } from "./app";
import { env } from "./env";

const start = async () => {
  const app = buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(
      `Servidor CaseCellShop rodando em http://${env.HOST}:${env.PORT}`,
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful Shutdown: Garante o encerramento seguro da aplicação
  const listeners = ["SIGINT", "SIGTERM"];
  listeners.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(
        `Sinal ${signal} recebido. Encerrando servidor graciosamente...`,
      );
      await app.close();
      process.exit(0);
    });
  });
};

start();
