// Import Prisma types, including SortOrder
import { Prisma, type VitalSign } from "@prisma/client"
import { format } from "date-fns"
import { useId } from "react"
import db from "@/lib/db"
import { calculateBMI } from "@/utils"
import { checkRole } from "@/utils/roles"
import { AddVitalSigns } from "../dialogs/add-vital-signs"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Separator } from "../ui/separator"

interface VitalSignsProps {
    id: number | string
    patientId: string
    doctorId: string
    medicalId?: string
    appointmentId?: string
}

const ItemCard = ({ label, value }: { label: string; value: string }) => {
    return (
        <div className="w-full">
            <p className="font-medium text-lg xl:text-xl">{value}</p>
            <p className="text-gray-500 text-sm xl:text-base">{label}</p>
        </div>
    )
}

export const VitalSigns = async ({ id, patientId, doctorId }: VitalSignsProps) => {
    // Define the include configuration with correct SortOrder type
    const medicalRecordInclude = {
        vitalSigns: {
            orderBy: { createdAt: Prisma.SortOrder.desc } // <-- FIX IS HERE!
        }
    }

    // Use Prisma.MedicalRecordGetPayload to correctly type the result
    type MedicalRecordWithVitalSigns = Prisma.MedicalRecordGetPayload<{
        include: typeof medicalRecordInclude
    }>

    const data: MedicalRecordWithVitalSigns | null = await db.medicalRecord.findFirst({
        where: { appointmentId: Number(id) },
        include: medicalRecordInclude,
        orderBy: { createdAt: Prisma.SortOrder.desc } // <-- FIX IS ALSO HERE for the main query's orderBy
    })

    // Ensure data is not null before trying to access vitalSigns
    const vitals = data?.vitalSigns ?? [] // Use an empty array as fallback if vitalSigns might be undefined

    const isPatient = await checkRole("PATIENT")
    const vitalSignsId = useId()

    return (
        <section id={vitalSignsId}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Vital Signs</CardTitle>

                    {!isPatient && (
                        <AddVitalSigns
                            key={data?.id || "new-vital-signs-dialog"}
                            patientId={patientId}
                            doctorId={doctorId}
                            appointmentId={id?.toString()}
                            medicalId={data ? data?.id?.toString() : ""}
                        />
                    )}
                </CardHeader>

                <CardContent className="space-y-4">
                    {vitals.length > 0 ? ( // Only map if vitals array is not empty
                        vitals.map((el: VitalSign) => {
                            const { bmi, status, colorCode } = calculateBMI(
                                el.weight || 0,
                                el.height || 0
                            )

                            return (
                                <div className="space-y-4" key={el?.id}>
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        <ItemCard
                                            label="Body Temperature"
                                            value={`${el?.bodyTemperature}Â°C`}
                                        />
                                        <ItemCard
                                            label="Blood Pressure"
                                            value={`${el?.systolic} / ${el?.diastolic} mmHg`}
                                        />
                                        <ItemCard
                                            label="Heart Rate"
                                            value={`${el?.heartRate} bpm`}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        <ItemCard label="Weight" value={`${el?.weight} kg`} />
                                        <ItemCard label="Height" value={`${el?.height} cm`} />

                                        <div className="w-full">
                                            <div className="flex items-center gap-x-2">
                                                <p className="font-medium text-lg xl:text-xl">
                                                    {bmi}
                                                </p>
                                                <span
                                                    className="font-medium text-sm"
                                                    style={{ color: colorCode }}
                                                >
                                                    ({status})
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        <ItemCard
                                            label="Respiratory Rate"
                                            value={`${el?.respiratoryRate || "N/A"}`}
                                        />
                                        <ItemCard
                                            label="Oxygen Saturation"
                                            value={`${el?.oxygenSaturation || "n/a"}`}
                                        />
                                        <ItemCard
                                            label="Reading Date"
                                            value={format(el?.createdAt, "MMM d, yyyy hh:mm a")} // Changed 'MMM d,اں hh:mm a' to 'MMM d, yyyy hh:mm a'
                                        />
                                    </div>
                                    <Separator className="mt-4" />
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-center text-gray-500">No vital signs recorded yet.</p>
                    )}
                </CardContent>
            </Card>
        </section>
    )
}
