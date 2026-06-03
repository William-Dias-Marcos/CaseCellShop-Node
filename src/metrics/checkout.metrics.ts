import client from "prom-client";

export const checkoutStartedTotal = new client.Counter({
  name: "checkout_started_total",
  help: "Total de checkouts iniciados",
});

export const checkoutCompletedTotal = new client.Counter({
  name: "checkout_completed_total",
  help: "Total de checkouts completados com sucesso",
});

export const checkoutFailedTotal = new client.Counter({
  name: "checkout_failed_total",
  help: "Total de checkouts que falharam",
});
