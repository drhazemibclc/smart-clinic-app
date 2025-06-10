"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { Doctor, Patient } from "@prisma/client"
import { UserPen } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"
import { createNewAppointment } from "@/app/actions/appointment"
import { AppointmentSchema } from "@/lib/schema"
import { generateTimes } from "@/utils"
import { CustomInput } from "../custom-input"
import { ProfileImage } from "../profile-image"
import { Button } from "../ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"

const TYPES = [
    { label: "General Consultation", value: "General Consultation" },
    { label: "General Check up", value: "General Check Up" },
    { label: "Antenatal", value: "Antenatal" },
    { label: "Maternity", value: "Maternity" },
    { label: "Lab Test", value: "Lab Test" },
    { label: "ANT", value: "ANT" }
]

export const BookAppointment = ({ data, doctors }: { data: Patient; doctors: Doctor[] }) => {
    const [loading, _setLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const [physicians, _setPhysicians] = useState<Doctor[] | undefined>(doctors)

    const appointmentTimes = generateTimes(8, 17, 30)

    const patientName = `${data?.first_name} ${data?.last_name}`

    const form = useForm<z.infer<typeof AppointmentSchema>>({
        resolver: zodResolver(AppointmentSchema),
        defaultValues: {
            doctor_id: "",
            appointment_date: "",
            time: "",
            type: "",
            note: ""
        }
    })

    const onSubmit: SubmitHandler<z.infer<typeof AppointmentSchema>> = async (values) => {
        try {
            setIsSubmitting(true)
            const newData = { ...values, patient_id: data?.id as string }

            const res = await createNewAppointment(newData)

            if (res.success) {
                form.reset({})
                router.refresh()
                toast.success("Appointment created successfully")
            }
        } catch (error) {
            console.log(error)
            toast.error("Something went wrong. Try again later.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex w-full items-center justify-start gap-2 bg-blue-600 font-light text-sm text-white"
                >
                    <UserPen size={16} /> Book Appointment
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full rounded-xl rounded-r-2xl md:top-[2.5%] md:right-[1%] md:h-p[95%]">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <span>Loading</span>
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto p-4">
                        <SheetHeader>
                            <SheetTitle>Book Appointment</SheetTitle>
                        </SheetHeader>

                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="mt-5 space-y-8 2xl:mt-10"
                            >
                                <div className="flex w-full items-center gap-4 rounded-md border border-input bg-background px-3 py-1">
                                    <ProfileImage
                                        url={data?.img ?? ""}
                                        name={patientName}
                                        className="size-16 border border-input"
                                        bgColor={data?.colorCode ?? "0000"}
                                    />

                                    <div>
                                        <p className="font-semibold text-lg">{patientName}</p>
                                        <span className="text-gray-500 text-sm capitalize">
                                            {data?.gender}
                                        </span>
                                    </div>
                                </div>

                                <CustomInput
                                    type="select"
                                    selectList={TYPES}
                                    control={form.control}
                                    name="type"
                                    label="Appointment Type"
                                    placeholder="Select a appointment type"
                                />

                                <FormField
                                    control={form.control}
                                    name="doctor_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Physician</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                disabled={isSubmitting}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a physician" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="">
                                                    {physicians?.map((i, id) => (
                                                        <SelectItem
                                                            key={id}
                                                            value={i.id}
                                                            className="p-2"
                                                        >
                                                            <div className="flex flex-row gap-2 p-2">
                                                                <ProfileImage
                                                                    url={i?.img ?? ""}
                                                                    name={i?.name}
                                                                    bgColor={i?.colorCode ?? "0000"}
                                                                    textClassName="text-black"
                                                                />
                                                                <div>
                                                                    <p className="text-start font-medium ">
                                                                        {i.name}
                                                                    </p>
                                                                    <span className="text-gray-600 text-sm">
                                                                        {i?.specialization}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex items-center gap-2">
                                    <CustomInput
                                        type="input"
                                        control={form.control}
                                        name="appointment_date"
                                        placeholder=""
                                        label="Date"
                                        inputType="date"
                                    />
                                    <CustomInput
                                        type="select"
                                        control={form.control}
                                        name="time"
                                        placeholder="Select time"
                                        label="Time"
                                        selectList={appointmentTimes}
                                    />
                                </div>

                                <CustomInput
                                    type="textarea"
                                    control={form.control}
                                    name="note"
                                    placeholder="Additional note"
                                    label="Additional Note"
                                />

                                <Button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full bg-blue-600"
                                >
                                    Submit
                                </Button>
                            </form>
                        </Form>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
