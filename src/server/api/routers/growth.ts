// Import Prisma Client directly for model types
import { Prisma } from "@prisma/client" // Prisma client import
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/api/trpc"
// No need to import specific models like 'growthMeasurements' or 'patients' directly from a schema file,
// as they are accessed via ctx.db (your Prisma client instance).

// Import Z-score utility functions
import { calculateZScore, getAgeInDays } from "@/lib/zscoreCalc"

export const growthRouter = createTRPCRouter({
    /**
     * Creates a new growth measurement for a patient,
     * calculating and storing Z-scores for weight-for-age,
     * length/height-for-age, head circumference-for-age, and BMI-for-age.
     */
    createGrowthMeasurement: protectedProcedure
        .input(
            z.object({
                patientId: z.string().min(1),
                measurementDate: z.date(),
                weightKg: z.number().min(0),
                heightCm: z.number().min(0),
                headCircumferenceCm: z.number().min(0).optional(),
                notes: z.string().optional()
            })
        )
        .mutation(async ({ input, ctx }) => {
            try {
                const {
                    patientId,
                    measurementDate,
                    weightKg,
                    heightCm,
                    headCircumferenceCm,
                    notes
                } = input

                // Use ctx.db.patient for Prisma Patient model access
                const patient = await ctx.db.patient.findFirst({
                    where: { id: patientId }, // Prisma uses object for 'where' clause
                    select: {
                        // Prisma uses 'select' for specific columns
                        dateOfBirth: true,
                        gender: true
                    }
                })

                if (!patient) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Patient not found."
                    })
                }

                // Determine gender for Z-score calculation ('boys' or 'girls')
                const patientGender = patient.gender.toLowerCase() === "male" ? "boys" : "girls"
                const ageInDays = getAgeInDays(patient.dateOfBirth, measurementDate)

                // Calculate Z-scores
                const weightZScore = calculateZScore("wfa", patientGender, ageInDays, weightKg)
                const heightZScore = calculateZScore("lhfa", patientGender, ageInDays, heightCm)

                let headCircumferenceZScore: number | null = null
                if (headCircumferenceCm !== undefined && headCircumferenceCm !== null) {
                    headCircumferenceZScore = calculateZScore(
                        "hcfa",
                        patientGender,
                        ageInDays,
                        headCircumferenceCm
                    )
                }

                // Calculate BMI
                const bmi = weightKg / ((heightCm / 100) * (heightCm / 100)) // heightCm to meters
                const bmiZScore = calculateZScore("bfa", patientGender, ageInDays, bmi)

                // Use ctx.db.growthMeasurement.create for Prisma insert
                const newMeasurement = await ctx.db.growthMeasurement.create({
                    data: {
                        // Prisma uses 'data' object for create/update operations
                        patientId,
                        measurementDate,
                        weightKg,
                        heightCm,
                        headCircumferenceCm,
                        bmi,
                        weightZScore,
                        heightZScore,
                        headCircumferenceZScore,
                        bmiZScore,
                        notes
                        // Prisma automatically handles `createdAt` and `updatedAt` if defined with `@@map` in schema.
                        // If not, you can manually set them:
                        // createdAt: new Date(),
                        // updatedAt: new Date(),
                    }
                })

                // Prisma's create method directly returns the created object, no need for length check.
                return newMeasurement
            } catch (error) {
                console.error("Error creating growth measurement:", error)
                if (error instanceof TRPCError) {
                    throw error
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to create growth measurement."
                })
            }
        }),

    /**
     * Retrieves a single growth measurement by its ID.
     */
    getGrowthMeasurementById: publicProcedure
        .input(z.object({ id: z.number().int() }))
        .query(async ({ input, ctx }) => {
            try {
                const { id } = input
                // Prisma findFirst equivalent to Drizzle's findFirst with where
                const measurement = await ctx.db.growthMeasurement.findFirst({
                    where: { id: id } // Prisma uses object for 'where' clause
                })

                if (!measurement) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Growth measurement not found."
                    })
                }
                return measurement
            } catch (error) {
                console.error("Error fetching growth measurement by ID:", error)
                if (error instanceof TRPCError) {
                    throw error
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch growth measurement."
                })
            }
        }),

    /**
     * Retrieves all growth measurements for a specific patient, ordered by measurement date.
     */
    getGrowthMeasurementsByPatientId: publicProcedure
        .input(z.object({ patientId: z.string().min(1) }))
        .query(async ({ input, ctx }) => {
            try {
                const { patientId } = input
                // Prisma findMany equivalent to Drizzle's findMany with where and orderBy
                const measurements = await ctx.db.growthMeasurement.findMany({
                    where: { patientId: patientId }, // Prisma uses object for 'where' clause
                    orderBy: { measurementDate: "asc" } // Prisma uses object for 'orderBy'
                })
                return measurements
            } catch (error) {
                console.error("Error fetching growth measurements by patient ID:", error)
                if (error instanceof TRPCError) {
                    throw error
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to fetch growth measurements."
                })
            }
        }),

    /**
     * Updates an existing growth measurement.
     * Recalculates Z-scores if weight, height, or head circumference are updated.
     */
    updateGrowthMeasurement: protectedProcedure
        .input(
            z.object({
                id: z.number().int(),
                measurementDate: z.date().optional(),
                weightKg: z.number().min(0).optional(),
                heightCm: z.number().min(0).optional(),
                headCircumferenceCm: z.number().min(0).optional().nullable(),
                notes: z.string().optional().nullable()
            })
        )
        .mutation(async ({ input, ctx }) => {
            try {
                const { id, ...updateData } = input

                const existingMeasurement = await ctx.db.growthMeasurement.findFirst({
                    where: { id: id },
                    include: {
                        patient: {
                            select: {
                                dateOfBirth: true,
                                gender: true
                            }
                        }
                    }
                })

                if (!existingMeasurement || !existingMeasurement.patient) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Growth measurement or associated patient not found."
                    })
                }

                // Use existing values if not provided in updateData.
                // Ensure values are numbers by providing a fallback of 0 if they become null.
                const currentWeightKg = updateData.weightKg ?? existingMeasurement.weightKg ?? 0
                const currentHeightCm = updateData.heightCm ?? existingMeasurement.heightCm ?? 0
                const currentMeasurementDate =
                    updateData.measurementDate ?? existingMeasurement.measurementDate

                // Special handling for headCircumferenceCm as it can be null
                let currentHeadCircumferenceCm: number | null = null
                if (updateData.headCircumferenceCm === null) {
                    currentHeadCircumferenceCm = null // Explicitly set to null if input is null
                } else if (updateData.headCircumferenceCm !== undefined) {
                    currentHeadCircumferenceCm = updateData.headCircumferenceCm
                } else {
                    currentHeadCircumferenceCm = existingMeasurement.headCircumferenceCm
                }

                // Now, pass *definite numbers* to calculateZScore and BMI formula.
                // If currentHeightCm or currentWeightKg could genuinely be 0 and lead to
                // division by zero or nonsensical Z-scores, your zscoreCalc should handle it,
                // or you should add a check here. Assuming 0 is a valid fallback for calculation.
                const patientGender =
                    existingMeasurement.patient.gender.toLowerCase() === "male" ? "boys" : "girls"
                const ageInDays = getAgeInDays(
                    existingMeasurement.patient.dateOfBirth,
                    currentMeasurementDate
                )

                const updatedWeightZScore = calculateZScore(
                    "wfa",
                    patientGender,
                    ageInDays,
                    currentWeightKg
                )
                const updatedHeightZScore = calculateZScore(
                    "lhfa",
                    patientGender,
                    ageInDays,
                    currentHeightCm
                )

                let updatedHeadCircumferenceZScore: number | null = null
                if (currentHeadCircumferenceCm !== null) {
                    // Check for null explicitly
                    updatedHeadCircumferenceZScore = calculateZScore(
                        "hcfa",
                        patientGender,
                        ageInDays,
                        currentHeadCircumferenceCm
                    )
                }

                const updatedBmi =
                    currentHeightCm > 0
                        ? currentWeightKg / ((currentHeightCm / 100) * (currentHeightCm / 100))
                        : 0 // Prevent division by zero
                const updatedBmiZScore = calculateZScore(
                    "bfa",
                    patientGender,
                    ageInDays,
                    updatedBmi
                )

                const updatedResult = await ctx.db.growthMeasurement.update({
                    where: { id: id },
                    data: {
                        ...updateData,
                        weightKg: currentWeightKg,
                        heightCm: currentHeightCm,
                        headCircumferenceCm: currentHeadCircumferenceCm, // This can remain null
                        bmi: updatedBmi,
                        weightZScore: updatedWeightZScore,
                        heightZScore: updatedHeightZScore,
                        headCircumferenceZScore: updatedHeadCircumferenceZScore, // This can remain null
                        bmiZScore: updatedBmiZScore,
                        updatedAt: new Date()
                    }
                })

                return updatedResult
            } catch (error) {
                console.error("Error updating growth measurement:", error)
                if (error instanceof TRPCError) {
                    throw error
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to update growth measurement."
                })
            }
        }),

    /**
     * Deletes a growth measurement by its ID.
     */

    deleteGrowthMeasurement: protectedProcedure
        .input(z.object({ id: z.number().int() }))
        .mutation(async ({ input, ctx }) => {
            try {
                const { id } = input
                // Use ctx.db.growthMeasurement.delete for Prisma delete
                const deletedMeasurement = await ctx.db.growthMeasurement.delete({
                    where: { id: id }, // Prisma 'where' for the record to delete
                    select: { id: true } // Select specific fields from the deleted record if needed
                })

                // Prisma's delete method throws an error if no record is found to delete
                // (if using `delete` and `where` doesn't match).
                // If you want to handle "not found" explicitly, you might first use `findUnique`
                // if not found, throw error; else, delete.
                // Or, rely on the error thrown by `.delete()` if no record matched.

                return { success: true, deletedId: deletedMeasurement.id }
            } catch (error) {
                console.error("Error deleting growth measurement:", error)
                if (error instanceof TRPCError) {
                    throw error
                }
                // Prisma will throw a P2025 error if record not found.
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === "P2025"
                ) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Growth measurement not found."
                    })
                }
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to delete growth measurement."
                })
            }
        })
})
