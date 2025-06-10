import type { Prisma } from "@prisma/client"
import db from "@/lib/db"

// --- Response Interfaces ---
interface SuccessResponse<T> {
    success: true
    data: T
    status: number
    message?: string
}

interface ErrorResponse {
    success: false
    message: string
    status: number
}

// --- Payload Types ---
type PatientAppointmentData = Prisma.AppointmentGetPayload<{
    select: {
        id: true
        patient_id: true
        doctor_id: true
        type: true
        appointment_date: true
        time: true
        status: true
        note: true
        reason: true
        created_at: true
        updated_at: true
        patient: {
            select: {
                id: true
                first_name: true
                last_name: true
                phone: true
                gender: true
                img: true
                date_of_birth: true
                colorCode: true
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
        bills: true
        medical: {
            include: {
                diagnosis: true
                lab_test: true
                vital_signs: true
            }
        }
    }
}>

// --- Utility: Build Query ---
const buildQuery = (id?: string, search?: string): Prisma.AppointmentWhereInput => {
    const conditions: Prisma.AppointmentWhereInput[] = []

    if (search?.trim()) {
        conditions.push({
            OR: [
                { patient: { first_name: { contains: search, mode: "insensitive" } } },
                { patient: { last_name: { contains: search, mode: "insensitive" } } },
                { doctor: { name: { contains: search, mode: "insensitive" } } }
            ]
        })
    }

    if (id?.trim()) {
        conditions.push({
            OR: [{ patient_id: id }, { doctor_id: id }]
        })
    }

    return conditions.length > 0 ? { AND: conditions } : {}
}

// --- Get Appointment By ID ---
export async function getAppointmentById(id: number): Promise<
    | SuccessResponse<
          Prisma.AppointmentGetPayload<{
              include: {
                  doctor: {
                      select: {
                          id: true
                          name: true
                          specialization: true
                          img: true
                      }
                  }
                  patient: {
                      select: {
                          id: true
                          first_name: true
                          last_name: true
                          date_of_birth: true
                          gender: true
                          img: true
                          address: true
                          phone: true
                      }
                  }
              }
          }>
      >
    | ErrorResponse
> {
    try {
        if (!id || Number.isNaN(id) || id <= 0) {
            return {
                success: false,
                message: "Invalid appointment ID.",
                status: 400
            }
        }

        const data = await db.appointment.findUnique({
            where: { id },
            include: {
                doctor: {
                    select: { id: true, name: true, specialization: true, img: true }
                },
                patient: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        date_of_birth: true,
                        gender: true,
                        img: true,
                        address: true,
                        phone: true
                    }
                }
            }
        })

        if (!data) {
            return {
                success: false,
                message: "Appointment not found.",
                status: 404
            }
        }

        return { success: true, data, status: 200 }
    } catch (error) {
        console.error("getAppointmentById error:", error)
        return { success: false, message: "Internal Server Error", status: 500 }
    }
}

// --- Get Appointments for Patient or Doctor with Pagination ---
interface AllAppointmentsProps {
    page?: number | string
    limit?: number | string
    search?: string
    id?: string
}

export async function getPatientAppointments({
    page = 1,
    limit = 10,
    search,
    id
}: AllAppointmentsProps): Promise<
    | SuccessResponse<{
          data: PatientAppointmentData[]
          totalPages: number
          currentPage: number
          totalRecord: number
      }>
    | ErrorResponse
> {
    try {
        const PAGE_NUMBER = Math.max(Number(page) || 1, 1)
        const LIMIT = Math.max(Number(limit) || 10, 1)
        const SKIP = (PAGE_NUMBER - 1) * LIMIT

        const query = buildQuery(id, search)

        const [data, totalRecord] = await Promise.all([
            db.appointment.findMany({
                where: query,
                skip: SKIP,
                take: LIMIT,
                select: {
                    id: true,
                    patient_id: true,
                    doctor_id: true,
                    type: true,
                    appointment_date: true,
                    time: true,
                    status: true,
                    note: true,
                    reason: true,
                    created_at: true,
                    updated_at: true,
                    patient: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            phone: true,
                            gender: true,
                            img: true,
                            date_of_birth: true,
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
                orderBy: { appointment_date: "desc" }
            }),
            db.appointment.count({ where: query })
        ])

        return {
            success: true,
            data: {
                data,
                totalRecord,
                totalPages: Math.ceil(totalRecord / LIMIT),
                currentPage: PAGE_NUMBER
            },
            status: 200
        }
    } catch (error) {
        console.error("getPatientAppointments error:", error)
        return { success: false, message: "Internal Server Error", status: 500 }
    }
}

// --- Get Appointment + Medical Records ---
export async function getAppointmentWithMedicalRecordsById(
    id: number
): Promise<SuccessResponse<FullAppointmentDetails> | ErrorResponse> {
    try {
        if (!id || Number.isNaN(id) || id <= 0) {
            return {
                success: false,
                message: "Invalid appointment ID.",
                status: 400
            }
        }

        const data = await db.appointment.findUnique({
            where: { id },
            include: {
                patient: true,
                doctor: true,
                bills: true,
                medical: {
                    include: {
                        diagnosis: true,
                        lab_test: true,
                        vital_signs: true
                    }
                }
            }
        })

        if (!data) {
            return {
                success: false,
                message: "Appointment data not found.",
                status: 404
            }
        }

        return { success: true, data, status: 200 }
    } catch (error) {
        console.error("getAppointmentWithMedicalRecordsById error:", error)
        return { success: false, message: "Internal Server Error", status: 500 }
    }
}
