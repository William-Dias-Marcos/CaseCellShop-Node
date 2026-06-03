import { runWithSpan } from "../telemetry/tracing";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

// Array em memória simulando nosso banco de dados
const products: Product[] = [
  { id: "1", name: "Capinha iPhone 13 Pro", price: 59.9, stock: 100 },
  { id: "2", name: "Película de Vidro Galaxy S22", price: 29.9, stock: 50 },
  { id: "3", name: "Carregador Turbo 20W", price: 89.9, stock: 30 },
];

export const getProducts = async (): Promise<Product[]> => {
  // Simula o tempo de resposta de um banco de dados real (100ms)
  return runWithSpan("repository:getProducts", async () => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(products), 100);
    });
  });
};
