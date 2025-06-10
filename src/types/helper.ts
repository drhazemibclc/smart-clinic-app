import type { AppointmentStatus as PrismaAppointmentStatus } from "@prisma/client" // Import Prisma's AppointmentStatus
import { endOfYear, format, getMonth, startOfYear } from "date-fns"

export type AppointmentStatus = PrismaAppointmentStatus // <<< FIX: Use Prisma's enum directly

// --- Utility types and functions ---

interface Appointment {
    status: AppointmentStatus
    appointmentDate: Date
    // Add any other properties of your Appointment object that are used here
    // For example: id: string;
}

function isValidStatus(status: string): status is AppointmentStatus {
    return ["PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"].includes(status as AppointmentStatus)
}

interface MonthlyStats {
    name: string
    appointment: number
    completed: number
}

const initializeMonthlyData = (): MonthlyStats[] => {
    const this_year = new Date().getFullYear()
    const months = Array.from({ length: 12 }, (_, index) => ({
        name: format(new Date(this_year, index), "MMM"), // "Jan", "Feb", etc.
        appointment: 0,
        completed: 0
    }))
    return months
}

// Exported for use in other routers (e.g., doctor.router.ts and admin.router.ts)
export const processAppointments = async (appointments: Appointment[]) => {
    // Get the start and end of the current year for filtering
    const currentYearStart = startOfYear(new Date())
    const currentYearEnd = endOfYear(new Date())

    // Define the type for our combined accumulator
    type CombinedAccumulator = {
        appointmentCounts: Record<AppointmentStatus, number>
        monthlyData: MonthlyStats[]
    }

    // Initialize the combined accumulator object
    const initialAccumulator: CombinedAccumulator = {
        appointmentCounts: {
            PENDING: 0,
            SCHEDULED: 0,
            COMPLETED: 0,
            CANCELLED: 0
        },
        monthlyData: initializeMonthlyData() // Initialize monthlyData here
    }

    // Use reduce to build both sets of data in a single pass
    const finalCounts = appointments.reduce(
        (acc: CombinedAccumulator, appointment) => {
            const { status, appointmentDate } = appointment

            // Basic validation for appointmentDate.
            if (!(appointmentDate instanceof Date) || Number.isNaN(appointmentDate.getTime())) {
                console.warn(`Skipping invalid appointment date: ${appointmentDate}`)
                return acc // Return current accumulator for invalid dates
            }

            const monthIndex = getMonth(appointmentDate) // 0 for Jan, 11 for Dec

            // Only process appointments that fall within the current year
            if (appointmentDate >= currentYearStart && appointmentDate <= currentYearEnd) {
                // Access monthlyData from the accumulator.
                // Use non-null assertion '!' here to tell TypeScript it's safe.
                acc.monthlyData[monthIndex]!.appointment += 1 // <<< FIX

                if (status === "COMPLETED") {
                    acc.monthlyData[monthIndex]!.completed += 1 // <<< FIX
                }
            }

            // Increment status counts
            if (isValidStatus(status)) {
                acc.appointmentCounts[status] = (acc.appointmentCounts[status] || 0) + 1
            }

            return acc // Return the updated accumulator
        },
        initialAccumulator // Pass the combined initial accumulator
    )

    // Destructure the final result from the reducer
    const { appointmentCounts, monthlyData } = finalCounts

    return { appointmentCounts, monthlyData }
}
