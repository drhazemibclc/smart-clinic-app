// --- Import Prisma Models ---
// Import all necessary models directly from @prisma/client
import type { Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc" // Corrected path to trpc
import { processAppointments } from "@/types/helper" // Ensure this is compatible with Prisma's Appointment type
import { daysOfWeek } from "@/utils" // Assuming daysOfWeek is here, adjust path as needed

// --- Helper for Prisma Where Clause ---
// This builds a Prisma-compatible 'where' object for the doctors query
const buildDoctorWhereClause = (search?: string): Prisma.DoctorWhereInput | undefined => {
    if (search?.trim()) {
        return {
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { specialization: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } }
            ]
        }
    }
    return undefined
}

export const doctorRouter = createTRPCRouter({
    // --- getAllDoctors ---
    getAllDoctors: publicProcedure
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

                const whereClause = buildDoctorWhereClause(input?.search)

                const [fetchedDoctors, totalRecordsCount] = await ctx.db.$transaction(
                    async (prisma) => {
                        const doctorsQueryResult = await prisma.doctor.findMany({
                            where: whereClause,
                            include: { workingDays: true }, // Prisma uses 'include' for relations
                            take: LIMIT, // Prisma equivalent of limit
                            skip: SKIP, // Prisma equivalent of offset
                            orderBy: { name: "asc" } // Default order, adjust if needed
                        })

                        const totalCountResult = await prisma.doctor.count({
                            where: whereClause
                        })

                        return [doctorsQueryResult, totalCountResult]
                    }
                )

                const totalPages = Math.ceil(totalRecordsCount / LIMIT)

                return {
                    data: fetchedDoctors,
                    totalRecords: totalRecordsCount,
                    totalPages,
                    currentPage: PAGE_NUMBER
                }
            } catch (error) {
                console.error("Error fetching all doctors:", error)
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch doctors."
                })
            }
        }),

    // --- getDoctorDashboardStats ---
    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
        try {
            const userId = ctx.session?.user.id
            if (!userId) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "User not authenticated."
                })
            }

            const [totalPatientCount, totalNursesCount, allAppointments, availableDoctorsData] =
                await ctx.db.$transaction(async (prisma) => {
                    const patientCount = await prisma.patient.count()

                    const nursesCount = await prisma.staff.count({
                        where: { role: "NURSE" } // Assuming 'role' is a string or enum
                    })

                    const appointmentsResult = await prisma.appointment.findMany({
                        where: {
                            doctorId: userId,
                            // Ensure appointmentDate is less than or equal to current date
                            appointmentDate: {
                                lte: new Date()
                            }
                        },
                        include: {
                            patient: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    lastName: true,
                                    gender: true,
                                    dateOfBirth: true,
                                    colorCode: true,
                                    img: true
                                }
                            },
                            doctor: {
                                // Including doctor might be redundant if this is for the doctor's own dashboard
                                select: {
                                    id: true,
                                    name: true,
                                    specialization: true,
                                    img: true,
                                    colorCode: true
                                }
                            }
                        },
                        orderBy: {
                            appointmentDate: "desc"
                        }
                    })

                    const todayDate = new Date().getDay()
                    const today = daysOfWeek[todayDate] ?? "Sunday"

                    const doctorsResult = await prisma.doctor.findMany({
                        where: {
                            availabilityStatus: "AVAILABLE", // Assuming this is an enum value (e.g., DoctorStatus.AVAILABLE)
                            workingDays: {
                                some: {
                                    // Check if AT LEAST ONE working day matches today
                                    day: today
                                }
                            }
                        },
                        select: {
                            id: true,
                            name: true,
                            specialization: true,
                            img: true,
                            colorCode: true
                        },
                        take: 5
                    })

                    return [patientCount, nursesCount, appointmentsResult, doctorsResult]
                })

            // Process appointments (assuming `processAppointments` is compatible with Prisma results)
            const { appointmentCounts, monthlyData } = await processAppointments(allAppointments)

            const last5Records = allAppointments.slice(0, 5)

            return {
                totalNurses: totalNursesCount,
                totalPatient: totalPatientCount,
                appointmentCounts,
                last5Records,
                availableDoctors: availableDoctorsData,
                totalAppointment: allAppointments?.length,
                monthlyData
            }
        } catch (error) {
            console.error("Error fetching doctor dashboard stats:", error)
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to fetch doctor dashboard statistics."
            })
        }
    }),

    // --- getDoctorById ---
    getById: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
            try {
                const { id } = input

                const [doctorData, totalAppointmentCount] = await ctx.db.$transaction(
                    async (prisma) => {
                        const doctorQueryResult = await prisma.doctor.findFirst({
                            where: { id: id },
                            include: {
                                workingDays: true,
                                appointments: {
                                    include: {
                                        patient: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                lastName: true,
                                                gender: true,
                                                img: true,
                                                colorCode: true
                                            }
                                        },
                                        doctor: {
                                            // Including doctor might be redundant if querying doctor by ID
                                            select: {
                                                name: true,
                                                specialization: true,
                                                img: true,
                                                colorCode: true
                                            }
                                        }
                                    },
                                    orderBy: { appointmentDate: "desc" },
                                    take: 10
                                }
                            }
                        })

                        const appointmentCountResult = await prisma.appointment.count({
                            where: { doctorId: id }
                        })

                        return [doctorQueryResult, appointmentCountResult]
                    }
                )

                if (!doctorData) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Doctor not found."
                    })
                }

                return {
                    data: doctorData,
                    totalAppointment: totalAppointmentCount
                }
            } catch (error) {
                console.error("Error fetching doctor by ID:", error)
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch doctor details."
                })
            }
        }),

    // --- getRatingById ---
    getRatingsById: publicProcedure
        .input(z.object({ id: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
            try {
                const { id } = input
                const ratingsData = await ctx.db.rating.findMany({
                    where: { staffId: id }, // Assuming staffId is the foreign key to doctor.id
                    include: {
                        patient: {
                            select: { lastName: true, firstName: true }
                        }
                    }
                })

                const totalRatings = ratingsData?.length || 0
                const sumRatings = ratingsData?.reduce((sum, el) => sum + el.rating, 0) || 0
                const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0
                const formattedAverageRating = (Math.round(averageRating * 10) / 10).toFixed(1)

                return {
                    totalRatings,
                    averageRating: formattedAverageRating,
                    ratings: ratingsData
                }
            } catch (error) {
                console.error("Error fetching ratings by ID:", error)
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch ratings."
                })
            }
        }),

    // --- getAvailableDoctors ---
    getAvailableDoctors: publicProcedure.query(async ({ ctx }) => {
        try {
            const todayDate = new Date().getDay()
            const today = daysOfWeek[todayDate] ?? "Sunday"

            const availableDoctorsData = await ctx.db.doctor.findMany({
                where: {
                    availabilityStatus: "AVAILABLE", // Assuming this is an enum or string literal in Prisma
                    workingDays: {
                        some: {
                            // 'some' means "at least one working day matches"
                            day: today
                        }
                    }
                },
                select: {
                    // Use 'select' to specify returned fields
                    id: true,
                    name: true,
                    specialization: true,
                    img: true,
                    colorCode: true
                },
                take: 3 // Prisma equivalent of limit
            })

            return { data: availableDoctorsData }
        } catch (error) {
            console.error("Error fetching available doctors:", error)
            throw new Error("Failed to fetch available doctors.")
        }
    })
})
