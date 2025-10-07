import { z } from "zod";

// Price schema
const priceSchema = z.object({
  amount: z
    .number()
    .min(0, "Price amount must be a positive number"),
  currency: z.enum(["USD", "INR"]).default("INR"),
});

// CREATE schema
export const createProductSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  price: priceSchema,
  stock: z.number().int().nonnegative().default(0),
});

// UPDATE schema
export const updateProductSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  price: priceSchema.partial().optional(),
  stock: z.number().int().nonnegative().optional(),
});

declare global {
    namespace Express {
        interface Request {
            userId: string;
            sellerId: string;
        }
    }
}