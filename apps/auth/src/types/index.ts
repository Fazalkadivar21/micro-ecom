import z from "zod"

export const fullNameSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
})

export const addressSchema = z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(1, "Zip is required"),
    country: z.string().min(1, "Country is required"),
    isDefault: z.boolean().optional(),
})

export const userRegisterSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    fullName: fullNameSchema,
    role: z.enum(["user", "seller"]),
    addresses: z.array(addressSchema).optional(),
})

export const userLoginSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
}).refine(
  (data) => data.email || data.username,
  {
    message: "Either email or username is required",
    path: ["email"],
  }
);


export const createAddressSchema = z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zip: z.string().min(1, "Zip is required"),
    country: z.string().min(1, "Country is required"),
    isDefault: z.boolean().optional(),
})

export const updateAddressSchema = z.object({
    street: z.string().min(1, "Street is required").optional(),
    city: z.string().min(1, "City is required").optional(),
    state: z.string().min(1, "State is required").optional(),
    zip: z.string().min(1, "Zip is required").optional(),
    country: z.string().min(1, "Country is required").optional(),
    isDefault: z.boolean().optional(),
})

declare global {
    namespace Express {
        interface Request {
            userId: string;
        }
    }
}