import client from "prom-client";

// Habilita métricas padrão do Node.js (CPU, Memória, etc)
client.collectDefaultMetrics();

export const cacheHitsTotal = new client.Counter({
  name: "cache_hits_total",
  help: "Total de vezes que a busca foi resolvida via cache (Cache Hit)",
});

export const cacheMissesTotal = new client.Counter({
  name: "cache_misses_total",
  help: "Total de vezes que a busca não encontrou dados no cache (Cache Miss)",
});

export const getMetrics = async () => await client.register.metrics();
