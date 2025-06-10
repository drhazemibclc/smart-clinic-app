// --- Prisma Client Import ---
// Import the Prisma Client types directly. This is the standard way to get model types.
import type {
    Prisma // For utility types like Prisma.AppointmentGetPayload
    // Ensure all models you interact with are imported
} from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc" // Adjust path to your trpc context

// --- Prisma Type Inferences ---
// This is how you typically get inferred types from Prisma relations.
// Prisma provides `GetPayload` utilities based on your include/select.

type PatientAppointmentData = Prisma.AppointmentGetPayload<{
    include: {
        patient: {
            select: {
                id: true
                lastName: true
                firstName: true
                img: true
                colorCode: true
                gender: true
                dateOfBirth: true
            }
        }
        doctor: {
            select: {
                id: true
                name: true
                specialization: true
                colorCode: true
                img: true
            }
        }
    }
}>

type FullAppointmentDetails = Prisma.AppointmentGetPayload<{
    include: {
        doctor: true
        patient: true
        payments: true // Assuming your Prisma schema calls the relation 'payments'
        medicalRecord: {
            // Assuming 'medicalRecord' is the relation name to a single record
            include: {
                diagnosis: true // Assuming 'diagnosis' is the relation name
                labTests: true // Assuming 'labTests' is the relation name
                vitalSigns: true // Assuming 'vitalSigns' is the relation name
            }
        }
    }
}>

// --- Utility: Build Query (Prisma compatible) ---
// This function will now return a Prisma-compatible 'where' object.
const buildAppointmentWhereClause = (
    id?: string,
    search?: string
): Prisma.AppointmentWhereInput | undefined => {
    const conditions: Prisma.AppointmentWhereInput[] = []

    if (search?.trim()) {
        conditions.push({
            OR: [
                { patient: { firstName: { contains: search, mode: "insensitive" } } }, // `ilike` in Prisma is `contains` with `mode: 'insensitive'`
                { patient: { lastName: { contains: search, mode: "insensitive" } } },
                { doctor: { name: { contains: search, mode: "insensitive" } } }
            ]
        })
    }

    if (id?.trim()) {
        conditions.push({
            OR: [
                { patientId: id }, // Assuming patientId and doctorId are strings
                { doctorId: id }
            ]
        })
    }

    // Combine conditions with 'AND' if there are any, otherwise return undefined
    return conditions.length > 0 ? { AND: conditions } : undefined
}

export const appointmentRouter = createTRPCRouter({
    // --- getAppointmentById ---
    getById: publicProcedure
        .input(z.object({ id: z.number().int().positive() })) // Validate ID as positive integer
        .query(async ({ input, ctx }) => {
            try {
                // Prisma findFirst equivalent to Drizzle's findFirst with where
                const data = await ctx.db.appointment.findFirst({
                    where: { id: input.id },
                    include: {
                        doctor: {
                            select: {
                                // Prisma uses 'select' for specific fields
                                id: true,
                                name: true,
                                specialization: true,
                                img: true
                            }
                        },
                        patient: {
                            select: {
                                // Prisma uses 'select' for specific fields
                                id: true,
                                firstName: true,
                                lastName: true,
                                dateOfBirth: true,
                                gender: true,
                                img: true,
                                address: true,
                                phone: true
                            }
                        }
                    }
                })

                if (!data) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Appointment not found."
                    })
                }

                return { data }
            } catch (error) {
                console.error("getAppointmentById error:", error)
                if (error instanceof TRPCError) throw error
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Internal Server Error: Failed to fetch appointment."
                })
            }
        }),

    // --- getAppointments ---
    getAppointments: protectedProcedure // Assuming this data requires authentication
        .input(
            z.object({
                page: z.number().int().min(1).default(1),
                limit: z.number().int().min(1).default(10),
                search: z.string().optional(),
                id: z.string().min(1).optional() // ID could be patientId or doctorId
            })
        )
        .query(async ({ input, ctx }) => {
            try {
                const { page, limit, search, id } = input
                const skip = (page - 1) * limit // Prisma uses 'skip' for offset

                const whereClause = buildAppointmentWhereClause(id, search)

                // Using ctx.db.$transaction for atomic queries in Prisma
                const [appointmentsResult, countResult] = await ctx.db.$transaction(
                    async (prisma) => {
                        // 'prisma' is the transactional client
                        const appointmentsData = await prisma.appointment.findMany({
                            where: whereClause,
                            take: limit, // Prisma equivalent of limit
                            skip: skip, // Prisma equivalent of offset
                            include: {
                                patient: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        phone: true,
                                        gender: true,
                                        img: true,
                                        dateOfBirth: true,
                                        colorCode: true
                                    }
                                },
                                doctor: {
                                    select: {
                                        id: true,
                                        name: true,
                                        specialization: true,
                                        colorCode: true,
                                        img: true
                                    }
                                }
                            },
                            orderBy: { appointmentDate: "desc" } // Prisma orderBy syntax
                        })

                        // Prisma's way to count with a where clause
                        const totalCount = await prisma.appointment.count({
                            where: whereClause
                        })

                        return [appointmentsData, totalCount]
                    }
                )

                return {
                    data: appointmentsResult as PatientAppointmentData[], // Type assertion (ensure your type definition matches Prisma's output)
                    totalRecord: countResult,
                    totalPages: Math.ceil(countResult / limit),
                    currentPage: page
                }
            } catch (error) {
                console.error("getAppointments error:", error)
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Internal Server Error: Failed to fetch appointments."
                })
            }
        }),

    // --- getAppointmentWithMedicalRecordsById ---
    getWithMedicalRecordsById: publicProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .query(async ({ input, ctx }) => {
            try {
                const data = await ctx.db.appointment.findFirst({
                    where: { id: input.id },
                    include: {
                        patient: true, // true includes all fields
                        doctor: true, // true includes all fields
                        medicalRecords: {
                            // Assuming 'medicalRecord' is the relation name in Prisma
                            include: {
                                diagnoses: true, // Assuming 'diagnosis' is the relation name in Prisma
                                labTests: true, // Assuming 'labTests' is the relation name in Prisma
                                vitalSigns: true // Assuming 'vitalSigns' is the relation name in Prisma
                            }
                        }
                        // If 'payments' is a relation to a many-to-one or one-to-many, include it:
                        // payments: true, // Or { select: ... } if you need specific payment fields
                    }
                })

                if (!data) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Appointment data not found."
                    })
                }

                return { data: data as unknown as FullAppointmentDetails } // Type assertion (ensure it matches Prisma's output)
            } catch (error) {
                console.error("getAppointmentWithMedicalRecordsById error:", error)
                if (error instanceof TRPCError) throw error
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message:
                        "Internal Server Error: Failed to fetch appointment with medical records."
                })
            }
        })
})
