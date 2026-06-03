import { z } from "zod";

export const checkoutBodySchema = z.object({
  productId: z
    .string({ required_error: "O productId é obrigatório" })
    .min(1)
    .max(50, "O productId deve ter no máximo 50 caracteres"),
  quantity: z
    .number({ required_error: "A quantidade é obrigatória" })
    .int()
    .positive("A quantidade deve ser maior que zero"),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;
