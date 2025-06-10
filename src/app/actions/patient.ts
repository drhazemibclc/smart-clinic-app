"use server"

import { auth } from "@/lib/auth" // better-auth wrapper
import db from "@/lib/db"
import { PatientFormSchema } from "@/lib/schema"
import type { PatientInput } from "@/types/data-types"

export async function updatePatient(data: PatientInput, pid: string) {
    try {
        const validateData = PatientFormSchema.safeParse(data)

        if (!validateData.success) {
            return {
                success: false,
                error: true,
                msg: "Provide all required fields"
            }
        }

        const patientData = validateData.data

        await auth.api.updateUser({
            body: {
                firstName: patientData.first_name,
                lastName: patientData.last_name
            }
        })

        await db.patient.update({
            where: { id: pid },
            data: patientData
        })

        return {
            success: true,
            error: false,
            msg: "Patient info updated successfully"
        }
    } catch (error: unknown) {
        console.error("Update patient error:", error)
        return {
            success: false,
            error: true,
            msg: error instanceof Error ? error.message : "Internal server error"
        }
    }
}

export async function createNewPatient(data: unknown, pid: string) {
    try {
        const validateData = PatientFormSchema.safeParse(data)

        if (!validateData.success) {
            return {
                success: false,
                error: true,
                msg: "Provide all required fields"
            }
        }

        const patientData = validateData.data
        let patientId = pid

        if (pid === "new-patient") {
            const user = await auth.api.createUser({
                body: {
                    email: patientData.email,
                    password: patientData.phone,
                    name: `${patientData.first_name} ${patientData.last_name}`,
                    role: "patient"
                }
            })
            patientId = user.user.id
        } else {
            await auth.api.updateUser({
                body: {
                    role: "patient"
                }
            })
        }

        await db.patient.create({
            data: {
                ...patientData,
                id: patientId
            }
        })

        return {
            success: true,
            error: false,
            msg: "Patient created successfully"
        }
    } catch (error: unknown) {
        console.error("Create patient error:", error)
        return {
            success: false,
            error: true,
            msg: error instanceof Error ? error.message : "Internal server error"
        }
    }
}
