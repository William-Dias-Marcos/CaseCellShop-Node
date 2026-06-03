import client from "prom-client";

export const workerJobsProcessedTotal = new client.Counter({
  name: "worker_jobs_processed_total",
  help: "Total de jobs processados pelo worker assíncrono",
});
