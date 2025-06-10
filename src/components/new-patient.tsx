"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { Patient } from "@prisma/client"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { type Resolver, useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"
import { createNewPatient, updatePatient } from "@/app/actions/patient"
import { GENDER, MARITAL_STATUS, RELATION } from "@/lib"
import { type AuthUser, useUser } from "@/lib/auth/use-auth"
import { PatientFormSchema } from "@/lib/schema"

import { CustomInput } from "./custom-input"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Form } from "./ui/form"

type PatientFormValues = z.infer<typeof PatientFormSchema>

interface DataProps {
    data?: Patient
    type: "create" | "update"
}

const defaultValues: PatientFormValues = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: new Date(),
    gender: "MALE",
    marital_status: "single",
    emergency_contact_name: "",
    emergency_contact_number: "",
    relation: "mother",
    blood_group: "",
    allergies: "",
    medical_conditions: "",
    insurance_number: "",
    insurance_provider: "",
    medical_history: "",
    medical_consent: false,
    privacy_consent: false,
    service_consent: false
}

export const NewPatient = ({ data, type }: DataProps) => {
    const router = useRouter()
    const { user, isLoading } = useUser()
    const [loading, setLoading] = useState(false)

    const form = useForm<PatientFormValues>({
        resolver: zodResolver(PatientFormSchema) as Resolver<PatientFormValues>,
        defaultValues,
        mode: "onBlur"
    })

    const getCreateDefaultValues = useCallback((user: AuthUser): PatientFormValues => {
        return {
            ...defaultValues,
            first_name: user?.firstName ?? "",
            last_name: user?.lastName ?? "",
            email: user?.email ?? ""
        }
    }, [])

    const getPersonalInfo = useCallback((data: Patient) => {
        return {
            first_name: data.first_name ?? "",
            last_name: data.last_name ?? "",
            email: data.email ?? "",
            phone: data.phone ?? "",
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : new Date(),
            gender: data.gender,
            marital_status: data.marital_status as PatientFormValues["marital_status"],
            address: data.address ?? ""
        }
    }, [])

    const getFamilyInfo = useCallback((data: Patient) => {
        return {
            emergency_contact_name: data.emergency_contact_name ?? "",
            emergency_contact_number: data.emergency_contact_number ?? "",
            relation: data.relation as PatientFormValues["relation"]
        }
    }, [])

    const getMedicalInfo = useCallback((data: Patient) => {
        return {
            blood_group: data.blood_group ?? "",
            allergies: data.allergies ?? "",
            medical_conditions: data.medical_conditions ?? "",
            insurance_number: data.insurance_number ?? "",
            insurance_provider: data.insurance_provider ?? "",
            medical_history: data.medical_history ?? ""
        }
    }, [])

    const getConsentInfo = useCallback((data: Patient) => {
        return {
            medical_consent: data.medical_consent ?? false,
            privacy_consent: data.privacy_consent ?? false,
            service_consent: data.service_consent ?? false
        }
    }, [])

    const getUpdateDefaultValues = useCallback(
        (data: Patient): PatientFormValues => {
            return {
                ...getPersonalInfo(data),
                ...getFamilyInfo(data),
                ...getMedicalInfo(data),
                ...getConsentInfo(data)
            }
        },
        [getPersonalInfo, getFamilyInfo, getMedicalInfo, getConsentInfo]
    )

    useEffect(() => {
        if (isLoading) return

        if (type === "create") {
            if (user) {
                form.reset(getCreateDefaultValues(user))
            }
        } else if (type === "update" && data) {
            form.reset(getUpdateDefaultValues(data))
        }
    }, [isLoading, user, data, type, form, getCreateDefaultValues, getUpdateDefaultValues])

    const onSubmit = async (values: PatientFormValues) => {
        setLoading(true)
        const userId = user?.id ?? "anonymous_user"
        const action = type === "create" ? createNewPatient : updatePatient

        try {
            const res = await action(values, userId)
            if (res?.success) {
                toast.success(res.msg)
                form.reset()
                router.push("/patient")
            } else {
                toast.error(res?.msg || "Submission failed.")
            }
        } catch (error) {
            console.error("Error:", error)
            const message = error instanceof Error ? error.message : "An unexpected error occurred."
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading user information...</p>
            </div>
        )
    }

    return (
        <Card className="w-full max-w-6xl p-4">
            <CardHeader>
                <CardTitle>Patient Registration</CardTitle>
                <CardDescription>
                    Please provide all the information below to help us understand better and
                    provide good and quality service to you.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-8">
                        {/* Personal Info */}
                        <h3 className="font-semibold text-lg">Personal Information</h3>
                        <div className="flex flex-col items-center gap-6 md:flex-row md:gap-4">
                            <CustomInput
                                type="input"
                                control={form.control}
                                name="first_name"
                                placeholder="John"
                                label="First Name"
                            />
                            <CustomInput
                                type="input"
                                control={form.control}
                                name="last_name"
                                placeholder="Doe"
                                label="Last Name"
                            />
                        </div>
                        <CustomInput
                            type="input"
                            control={form.control}
                            name="email"
                            placeholder="john@example.com"
                            label="Email Address"
                        />
                        <div className="flex flex-col items-center gap-6 md:flex-row md:gap-4">
                            <CustomInput
                                type="select"
                                control={form.control}
                                name="gender"
                                placeholder="Select gender"
                                label="Gender"
                                selectList={GENDER}
                            />
                            <CustomInput
                                type="input"
                                control={form.control}
                                name="date_of_birth"
                                placeholder="YYYY-MM-DD"
                                label="Date of Birth"
                                inputType="date"
                            />
                        </div>
                        <div className="flex flex-col items-center gap-6 md:flex-row md:gap-4">
                            <CustomInput
                                type="input"
                                control={form.control}
                                name="phone"
                                placeholder="9225600735"
                                label="Contact Number"
                            />
                            <CustomInput
                                type="select"
                                control={form.control}
                                name="marital_status"
                                placeholder="Select marital status"
                                label="Marital Status"
                                selectList={MARITAL_STATUS}
                            />
                        </div>
                        <CustomInput
                            type="input"
                            control={form.control}
                            name="address"
                            placeholder="1479 Street, Apt 1839-G, NY"
                            label="Address"
                        />

                        {/* Family Info */}
                        <div className="space-y-8">
                            <h3 className="font-semibold text-lg">Family Information</h3>
                            <CustomInput
                                type="input"
                                control={form.control}
                                name="emergency_contact_name"
                                placeholder="Anne Smith"
                                label="Emergency contact name"
                            />
                            <CustomInput
                                type="input"
                                control={form.control}
                                name="emergency_contact_number"
                                placeholder="675444467"
                                label="Emergency contact"
                            />
                            <CustomInput
                                type="select"
                                control={form.control}
                                name="relation"
                                placeholder="Select relation"
                                label="Relation"
                                selectList={RELATION}
                            />
                        </div>

                        {/* Medical Info */}
                        <div className="space-y-8">
                            <h3 className="font-semibold text-lg">Medical Information</h3>
                            <CustomInput
                                type="input"
                                control={form.control}
                                name="blood_group"
                                placeholder="A+"
                                label="Blood group"
                            />
                            <CustomInput
                                type="input"
                                control={form.control}
                                name="allergies"
                                placeholder="Milk"
                                label="Allergies"
                            />
                            <CustomInput
                                type="input"
                                control={form.control}
                                name="medical_conditions"
                                placeholder="Medical conditions"
                                label="Medical conditions"
                            />
                            <CustomInput
                                type="input"
                                control={form.control}
                                name="medical_history"
                                placeholder="Medical history"
                                label="Medical history"
                            />
                            <div className="flex flex-col items-center gap-6 md:flex-row md:gap-4">
                                <CustomInput
                                    type="input"
                                    control={form.control}
                                    name="insurance_provider"
                                    placeholder="Provider"
                                    label="Insurance provider"
                                />
                                <CustomInput
                                    type="input"
                                    control={form.control}
                                    name="insurance_number"
                                    placeholder="1234567890"
                                    label="Insurance number"
                                />
                            </div>
                        </div>

                        {/* Consent (only on creation) */}
                        {type !== "update" && (
                            <div>
                                <h3 className="mb-2 font-semibold text-lg">Consent</h3>
                                <div className="space-y-6">
                                    <CustomInput
                                        name="privacy_consent"
                                        label="Privacy Policy Agreement"
                                        placeholder="I consent to the collection..."
                                        type="checkbox"
                                        control={form.control}
                                    />
                                    <CustomInput
                                        control={form.control}
                                        type="checkbox"
                                        name="service_consent"
                                        label="Terms of Service Agreement"
                                        placeholder="I agree to the Terms..."
                                    />
                                    <CustomInput
                                        control={form.control}
                                        type="checkbox"
                                        name="medical_consent"
                                        label="Informed Medical Consent"
                                        placeholder="I provide informed consent..."
                                    />
                                </div>
                            </div>
                        )}

                        <Button disabled={loading} type="submit" className="w-full px-6 md:w-fit">
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : type === "create" ? (
                                "Submit"
                            ) : (
                                "Update"
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
