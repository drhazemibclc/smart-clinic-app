"use server"
import type { AppointmentStatus } from "@prisma/client"

import type { VitalSignsFormData } from "@/components/dialogs/add-vital-signs"
import { getSession } from "@/lib/auth"
import db from "@/lib/db"
import { AppointmentSchema, VitalSignsSchema } from "@/lib/schema"
import type { AppointmentInput } from "@/types/data-types"

export async function createNewAppointment(data: AppointmentInput) {
    try {
        const validatedData = AppointmentSchema.safeParse(data)

        if (!validatedData.success) {
            return { success: false, msg: "Invalid data" }
        }
        const validated = validatedData.data

        await db.appointment.create({
            data: {
                patient_id: validated.patient_id,
                doctor_id: validated.doctor_id,
                time: validated.time,
                type: validated.type,
                appointment_date: new Date(validated.appointment_date),
                note: validated.note
            }
        })

        return {
            success: true,
            message: "Appointment booked successfully"
        }
    } catch (error) {
        console.log(error)
        return { success: false, msg: "Internal Server Error" }
    }
}
export async function appointmentAction(
    id: string | number,

    status: AppointmentStatus,
    reason: string
) {
    try {
        await db.appointment.update({
            where: { id: Number(id) },
            data: {
                status,
                reason
            }
        })

        return {
            success: true,
            error: false,
            msg: `Appointment ${status.toLowerCase()} successfully`
        }
    } catch (error) {
        console.log(error)
        return { success: false, msg: "Internal Server Error" }
    }
}

export async function addVitalSigns(
    data: VitalSignsFormData,
    appointmentId: string,
    doctorId: string
) {
    try {
        const session = await getSession()
        const userId = session?.user.id

        if (!userId) {
            return { success: false, msg: "Unauthorized" }
        }

        const validatedData = VitalSignsSchema.parse(data)

        let medicalRecord = null

        if (!validatedData.medical_id) {
            medicalRecord = await db.medicalRecords.create({
                data: {
                    patient_id: validatedData.patient_id,
                    appointment_id: Number(appointmentId),
                    doctor_id: doctorId
                }
            })
        }

        const med_id = validatedData.medical_id || medicalRecord?.id

        if (!med_id) {
            return { success: false, msg: "Medical record ID is missing" }
        }

        await db.vitalSigns.create({
            data: {
                ...validatedData,
                medical_id: Number(med_id)
            }
        })

        return {
            success: true,
            msg: "Vital signs added successfully"
        }
    } catch (error) {
        console.log(error)
        return { success: false, msg: "Internal Server Error" }
    }
}
