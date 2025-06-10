// Import Prisma types
import { Prisma } from "@prisma/client" // Ensure you import Prisma for types
import { TRPCError } from "@trpc/server"
import { z } from "zod"

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc" // Adjust path as needed

// --- Prisma Type Inferences ---
// Use Prisma's GetPayload for types based on includes
type PaymentRecordData = Prisma.PaymentGetPayload<{
    include: {
        patient: {
            // Assuming 'patient' is the relation name in your Prisma schema for Payment
            select: {
                firstName: true
                lastName: true
                dateOfBirth: true
                img: true
                colorCode: true
                gender: true
            }
        }
    }
}>

// --- Utility: Build Where Clause for Payment Records (Prisma-compatible) ---
const buildPaymentRecordsWhereClause = (search?: string): Prisma.PaymentWhereInput | undefined => {
    if (!search?.trim()) {
        return undefined // No search term, no where clause
    }

    // Prisma's 'OR' operator for combining conditions
    // `contains` with `mode: 'insensitive'` is the Prisma equivalent of `ilike`
    return {
        OR: [
            { patient: { firstName: { contains: search, mode: "insensitive" } } },
            { patient: { lastName: { contains: search, mode: "insensitive" } } },
            { patientId: { contains: search, mode: "insensitive" } } // Assuming patientId is a string and you want to search by it
        ]
    }
}

export const paymentRouter = createTRPCRouter({
    // --- getPaymentRecords ---
    // Protected procedure, as payment records typically require authentication
    getPaymentRecords: protectedProcedure
        .input(
            z.object({
                page: z.number().int().min(1).default(1),
                limit: z.number().int().min(1).default(10),
                search: z.string().optional()
            })
        )
        .query(async ({ input, ctx }) => {
            try {
                const { page, limit, search } = input
                const skip = (page - 1) * limit // Prisma uses 'skip' for offset

                // Build the Prisma WHERE clause object
                const whereClause = buildPaymentRecordsWhereClause(search)

                // Use ctx.db.$transaction for atomic queries in Prisma
                const [data, totalRecordsCount] = await ctx.db.$transaction(async (prisma) => {
                    // 'prisma' is the transactional client
                    // Fetch payment records with patient details
                    const recordsResult = await prisma.payment.findMany({
                        // Assuming your Prisma model is named 'Payment'
                        where: whereClause,
                        include: {
                            // Prisma uses 'include' for relations
                            patient: {
                                // Assuming 'patient' is the relation name to the Patient model
                                select: {
                                    // Prisma uses 'select' for specific columns
                                    firstName: true,
                                    lastName: true,
                                    dateOfBirth: true,
                                    img: true,
                                    colorCode: true,
                                    gender: true
                                }
                            }
                        },
                        take: limit, // Prisma equivalent of Drizzle's limit
                        skip: skip, // Prisma equivalent of Drizzle's offset
                        orderBy: { createdAt: "desc" } // Prisma's 'orderBy' syntax
                    })

                    // Count total records with the same WHERE clause
                    const countResult = await prisma.payment.count({
                        // Assuming your Prisma model is named 'Payment'
                        where: whereClause
                    })

                    return [recordsResult, countResult]
                })

                const totalPages = Math.ceil(totalRecordsCount / limit)

                return {
                    data: data as PaymentRecordData[], // Cast to your inferred type
                    totalRecords: totalRecordsCount,
                    totalPages,
                    currentPage: page
                }
            } catch (error) {
                console.error("Error fetching payment records:", error)
                // Handle Prisma-specific errors or generic errors
                if (error instanceof TRPCError) {
                    throw error
                } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    // Log Prisma error code for debugging if needed
                    console.error("Prisma Error Code:", error.code)
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Database Error: ${error.message}`
                    })
                } else if (error instanceof Error) {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Internal Server Error: ${error.message}`
                    })
                } else {
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Internal Server Error: An unknown error occurred."
                    })
                }
            }
        })
})
