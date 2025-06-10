import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc"
import { processAppointments } from "@/types/helper" // Ensure this path is correct
import { daysOfWeek } from "@/utils" // Ensure this path is correct

export const adminRouter = createTRPCRouter({
    // --- getAdminDashboardStats ---
    // Protected procedure as it should only be accessible by authenticated admins
    getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
        try {
            // Prisma transactions are handled differently.
            // You perform operations and then if needed, wrap them in a Prisma.$transaction block
            // if you need atomicity for multiple write operations.
            // For reads, sequential awaits are often fine unless you need specific isolation levels.

            const [totalPatientCount, totalDoctorsCount, allAppointments, availableDoctorsData] =
                await ctx.db.$transaction(async (prisma) => {
                    // Use 'prisma' as the client within transaction
                    // Prisma count for patients
                    const patientsCount = await prisma.patient.count()

                    // Prisma count for doctors
                    const doctorsCount = await prisma.doctor.count()

                    // Fetch all appointments with related patient and doctor info
                    const appointmentsResult = await prisma.appointment.findMany({
                        include: {
                            patient: {
                                select: {
                                    // Use 'select' for specific columns in Prisma
                                    id: true,
                                    lastName: true,
                                    firstName: true,
                                    img: true,
                                    colorCode: true,
                                    gender: true,
                                    dateOfBirth: true
                                }
                            },
                            doctor: {
                                select: {
                                    // Use 'select' for specific columns in Prisma
                                    name: true,
                                    img: true,
                                    colorCode: true,
                                    specialization: true
                                }
                            }
                        },
                        orderBy: {
                            // Prisma orderBy syntax
                            appointmentDate: "desc"
                        }
                    })

                    // Fetch available doctors
                    const todayDate = new Date().getDay() // getDay() returns 0 for Sunday, 1 for Monday, etc.
                    const today = daysOfWeek[todayDate] ?? "Sunday" // Make sure daysOfWeek maps 0 to 'Sunday', etc.

                    const doctorsResult = await prisma.doctor.findMany({
                        where: {
                            workingDays: {
                                some: {
                                    // 'some' for checking if at least one related record matches
                                    day: today
                                }
                            }
                        },
                        select: {
                            // Use 'select' for specific columns in Prisma
                            id: true,
                            name: true,
                            specialization: true,
                            img: true,
                            colorCode: true
                            // If you need workingDays data, you'd include it here
                            // workingDays: {
                            //     select: {
                            //         day: true,
                            //     },
                            //     where: {
                            //         day: today, // Only include the matched working day
                            //     },
                            // },
                        },
                        take: 5 // Prisma equivalent of Drizzle's limit
                    })
                    return [patientsCount, doctorsCount, appointmentsResult, doctorsResult]
                })

            // Process appointments (assuming `processAppointments` is compatible with Prisma results)
            // Ensure your `Appointment` interface in `types/helper.ts` matches Prisma's Appointment type.
            // Prisma's Appointment type will have `appointmentDate: Date` and `status: string`.
            const { appointmentCounts, monthlyData } = await processAppointments(allAppointments)

            const last5Records = allAppointments.slice(0, 5)

            return {
                totalPatient: totalPatientCount,
                totalDoctors: totalDoctorsCount,
                appointmentCounts,
                availableDoctors: availableDoctorsData,
                monthlyData,
                last5Records,
                totalAppointments: allAppointments.length
            }
        } catch (error) {
            console.error("Error fetching admin dashboard stats:", error)
            throw new Error("Something went wrong while fetching dashboard statistics.")
        }
    }),

    // --- getServices ---
    // Publicly accessible as services might be needed by various roles, but keep it in admin if it's primarily an admin function
    getServices: protectedProcedure.query(async ({ ctx }) => {
        try {
            const data = await ctx.db.service.findMany({
                orderBy: {
                    // Prisma orderBy syntax
                    serviceName: "asc"
                }
            })

            if (!data || data.length === 0) {
                return {
                    data: [],
                    message: "No services found."
                }
            }

            return {
                data
            }
        } catch (error) {
            console.error("Error fetching services:", error)
            throw new Error("Internal Server Error: Failed to fetch services.")
        }
    })
})
