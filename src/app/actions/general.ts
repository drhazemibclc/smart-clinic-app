"use server"

import { type ReviewFormValues, reviewSchema } from "@/components/dialogs/review-form"
import { auth } from "@/lib/auth" // BetterAuth client
import db from "@/lib/db"

export async function deleteDataById(
    id: string,
    deleteType: "doctor" | "staff" | "patient" | "payment" | "bill"
) {
    try {
        // Delete DB record
        switch (deleteType) {
            case "doctor":
                await db.doctor.delete({ where: { id } })
                break
            case "staff":
                await db.staff.delete({ where: { id } })
                break
            case "patient":
                await db.patient.delete({ where: { id } })
                break
            case "payment":
                await db.payment.delete({ where: { id: Number(id) } })
                break
            case "bill":
                await db.patientBills.delete({ where: { id: Number(id) } })
                break
        }

        // Delete auth user if relevant
        if (["doctor", "staff", "patient"].includes(deleteType)) {
            await auth.api.deleteUser({ query: { id }, body: {} }) // BetterAuth version
        }

        return {
            success: true,
            message: "Data deleted successfully",
            status: 200
        }
    } catch (error) {
        console.error("Delete error:", error)
        return {
            success: false,
            message: "Internal Server Error",
            status: 500
        }
    }
}

export async function createReview(values: ReviewFormValues) {
    try {
        const validatedFields = reviewSchema.parse(values)

        await db.rating.create({
            data: validatedFields
        })

        return {
            success: true,
            message: "Review created successfully",
            status: 200
        }
    } catch (error) {
        console.error("Review creation error:", error)
        return {
            success: false,
            message: "Internal Server Error",
            status: 500
        }
    }
}
