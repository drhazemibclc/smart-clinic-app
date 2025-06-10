// Import Prisma types
import { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc"
import { processAppointments } from "@/types/helper"
import { daysOfWeek } from "@/utils"

export const patientRouter = createTRPCRouter({
    // --- getPatientDashboardStatistics ---
    getDashboardStats: protectedProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
            try {
                const { id } = input

                // Prisma findFirst equivalent
                const patientData = await ctx.db.patient.findFirst({
                    where: { id: id },
                    select: {
                        // Prisma uses 'select' for specific columns
                        id: true,
                        firstName: true,
                        lastName: true,
                        gender: true,
                        img: true,
                        colorCode: true,
                        dateOfBirth: true
                    }
                })

                if (!patientData) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Patient data not found."
                    })
                }

                // Use Prisma's $transaction for atomic queries
                const [patientAppointments, availableDoctors] = await ctx.db.$transaction(
                    async (prisma) => {
                        // Prisma findMany equivalent for appointments
                        const appointmentsResult = await prisma.appointment.findMany({
                            where: {
                                patientId: patientData.id
                            },
                            include: {
                                // Prisma uses 'include' for relations
                                doctor: {
                                    select: {
                                        id: true,
                                        name: true,
                                        img: true,
                                        specialization: true,
                                        colorCode: true
                                    }
                                },
                                patient: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        gender: true,
                                        dateOfBirth: true,
                                        img: true,
                                        colorCode: true
                                    }
                                }
                            },
                            orderBy: { appointmentDate: "desc" } // Prisma orderBy syntax
                        })

                        const todayDateIndex = new Date().getDay()
                        const today = daysOfWeek[todayDateIndex] ?? "Sunday"

                        // Prisma findMany for available doctors
                        const doctorsResult = await prisma.doctor.findMany({
                            where: {
                                availabilityStatus: "available",
                                workingDays: {
                                    // Filter by relation
                                    some: {
                                        // 'some' for checking if at least one related record matches
                                        day: today
                                    }
                                }
                            },
                            select: {
                                // Prisma uses 'select' for specific columns
                                id: true,
                                name: true,
                                specialization: true,
                                img: true,
                                colorCode: true
                                // If you needed the working day data itself, you'd include it here
                                // workingDays: {
                                //     select: { day: true },
                                //     where: { day: today },
                                // },
                            },
                            take: 4 // Prisma equivalent of limit
                        })

                        return [appointmentsResult, doctorsResult]
                    }
                )

                const { appointmentCounts, monthlyData } =
                    await processAppointments(patientAppointments)
                const last5Records = patientAppointments.slice(0, 5)

                return {
                    data: patientData,
                    appointmentCounts,
                    last5Records,
                    totalAppointments: patientAppointments.length,
                    availableDoctor: availableDoctors, // Note: your original code had 'availableDoctor' singular here
                    monthlyData
                }
            } catch (error) {
                console.error("Error fetching patient dashboard statistics:", error)
                if (error instanceof TRPCError) {
                    throw error
                }
                // Handle Prisma errors specifically
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    console.error("Prisma Error Code:", error.code)
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Database Error: ${error.message}`
                    })
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch patient dashboard statistics."
                })
            }
        }),

    // --- getPatientById ---
    getById: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
            try {
                const { id } = input
                // Prisma findFirst equivalent
                const patient = await ctx.db.patient.findFirst({
                    where: { id: id }
                })

                if (!patient) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Patient data not found."
                    })
                }

                return { data: patient }
            } catch (error) {
                console.error("Error fetching patient by ID:", error)
                if (error instanceof TRPCError) {
                    throw error
                }
                // Handle Prisma errors specifically
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    console.error("Prisma Error Code:", error.code)
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Database Error: ${error.message}`
                    })
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch patient data."
                })
            }
        }),

    // --- getPatientFullDataById ---
    getPatientFullDataById: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
            try {
                const { id } = input

                // Prisma findFirst with OR condition and includes
                const patientWithRelations = await ctx.db.patient.findFirst({
                    where: {
                        OR: [{ id: id }, { email: id }]
                    },
                    include: {
                        appointments: {
                            select: { appointmentDate: true },
                            orderBy: { appointmentDate: "desc" },
                            take: 1
                        }
                    }
                })
                if (!patientWithRelations) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Patient data not found."
                    })
                }
                // Prisma's count method
                const totalAppointmentsCount = await ctx.db.appointment.count({
                    where: {
                        patientId: patientWithRelations.id
                    }
                })

                // Create a type that explicitly includes appointments
                type PatientWithAppointments = Prisma.PatientGetPayload<{
                    include: {
                        appointments: {
                            select: { appointmentDate: true }
                            orderBy: { appointmentDate: "desc" }
                            take: 1
                        }
                    }
                }>
                const typedPatient = patientWithRelations as PatientWithAppointments

                const lastVisit = typedPatient.appointments[0]?.appointmentDate ?? null

                return {
                    data: {
                        ...patientWithRelations,
                        totalAppointments: totalAppointmentsCount,
                        lastVisit
                    }
                }
            } catch (error) {
                console.error("Error fetching full patient data by ID:", error)
                if (error instanceof TRPCError) {
                    throw error
                }
                // Handle Prisma errors specifically
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    console.error("Prisma Error Code:", error.code)
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Database Error: ${error.message}`
                    })
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to retrieve complete patient data."
                })
            }
        }),

    // --- getAllPatients ---
    getAllPatients: publicProcedure
        .input(
            z
                .object({
                    page: z
                        .union([
                            z.number().int().min(1),
                            z.string().regex(/^\d+$/).transform(Number)
                        ])
                        .default(1),
                    limit: z
                        .union([
                            z.number().int().min(1),
                            z.string().regex(/^\d+$/).transform(Number)
                        ])
                        .optional(),
                    search: z.string().optional()
                })
                .optional()
        )
        .query(async ({ input, ctx }) => {
            try {
                const PAGE_NUMBER = input?.page ?? 1
                const LIMIT = input?.limit ?? 10
                const SKIP = (PAGE_NUMBER - 1) * LIMIT

                // Prisma's where clause for search filter
                const searchFilter: Prisma.PatientWhereInput | undefined = input?.search
                    ? {
                          OR: [
                              { firstName: { contains: input.search, mode: "insensitive" } },
                              { lastName: { contains: input.search, mode: "insensitive" } },
                              { phone: { contains: input.search, mode: "insensitive" } },
                              { email: { contains: input.search, mode: "insensitive" } }
                          ]
                      }
                    : undefined

                // Use Prisma's $transaction for atomic operations
                const [fetchedPatients, totalRecordsCount] = await ctx.db.$transaction(
                    async (prisma) => {
                        const patientsResult = await prisma.patient.findMany({
                            where: searchFilter,
                            include: {
                                appointments: {
                                    include: {
                                        // Assuming medicalRecord is a one-to-one relation from Appointment
                                        medicalRecords: {
                                            select: {
                                                createdAt: true,
                                                treatmentPlan: true
                                            }
                                        }
                                    },
                                    orderBy: {
                                        // Order appointments by date descending
                                        appointmentDate: "desc"
                                    },
                                    take: 1 // Get only the most recent appointment
                                }
                            },
                            take: LIMIT, // Prisma equivalent of limit
                            skip: SKIP, // Prisma equivalent of offset
                            orderBy: { firstName: "asc" } // Prisma orderBy syntax
                        })

                        // Prisma's count method for total records
                        const count = await prisma.patient.count({
                            where: searchFilter
                        })

                        return [patientsResult, count]
                    }
                )

                const totalPages = Math.ceil(totalRecordsCount / LIMIT)

                return {
                    data: fetchedPatients,
                    totalRecords: totalRecordsCount,
                    totalPages,
                    currentPage: PAGE_NUMBER
                }
            } catch (error) {
                console.error("Error fetching all patients:", error)
                if (error instanceof TRPCError) {
                    throw error
                }
                // Handle Prisma errors specifically
                if (error instanceof Prisma.PrismaClientKnownRequestError) {
                    console.error("Prisma Error Code:", error.code)
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Database Error: ${error.message}`
                    })
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch patients."
                })
            }
        })
})
