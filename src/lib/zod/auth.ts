import { z } from "zod"

export const signUpSchema = z.object({
    name: z
        .string()
        .min(1, { message: "Name is required" })
        .min(2, { message: "Name must be at least 2 characters" })
        .max(50, { message: "Name must be less than 50 characters" }),
    email: z
        .string()
        .min(1, { message: "Email is required" })
        .email({ message: "Please enter a valid email address" }),
    password: z
        .string()
        .min(1, { message: "Password is required" })
        .min(8, { message: "Password must be at least 8 characters" })
        .regex(/[A-Z]/, {
            message: "Password must contain at least one uppercase letter"
        })
        .regex(/[a-z]/, {
            message: "Password must contain at least one lowercase letter"
        })
        .regex(/[0-9]/, {
            message: "Password must contain at least one number"
        })
})

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, { message: "Email is required" })
        .email({ message: "Please enter a valid email address" }),
    password: z
        .string()
        .min(1, { message: "Password is required" })
        .min(6, { message: "Password must be at least 6 characters" })
})
