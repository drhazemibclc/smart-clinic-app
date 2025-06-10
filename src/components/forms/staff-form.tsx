"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"
import { createNewStaff } from "@/app/actions/admin"
import { StaffSchema } from "@/lib/schema"
import { CustomInput } from "../custom-input"
import { Button } from "../ui/button"
import { Form } from "../ui/form"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet"

const TYPES = [
    { label: "Nurse", value: "NURSE" },
    { label: "Laboratory", value: "LAB_TECHNICIAN" }
]

export const StaffForm = () => {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const form = useForm<z.infer<typeof StaffSchema>>({
        resolver: zodResolver(StaffSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            role: "NURSE",
            address: "",
            department: "",
            img: "",
            password: "",
            license_number: ""
        }
    })

    const handleSubmit = async (values: z.infer<typeof StaffSchema>) => {
        try {
            setIsLoading(true)
            const resp = await createNewStaff(values)

            if (resp.success) {
                toast.success("Staff added successfully!")

                form.reset()
                router.refresh()
            } else if (resp.error) {
                toast.error(resp.message)
            }
        } catch (error) {
            console.log(error)
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button>
                    <Plus size={20} />
                    New Staff
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full overflow-y-scroll rounded-xl rounded-r-xl md:top-[5%] md:right-[1%] md:h-[90%]">
                <SheetHeader>
                    <SheetTitle>Add New Staff</SheetTitle>
                </SheetHeader>

                <div>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(handleSubmit)}
                            className="mt-5 space-y-8 2xl:mt-10"
                        >
                            <CustomInput
                                type="radio"
                                selectList={TYPES}
                                control={form.control}
                                name="role"
                                label="Type"
                                placeholder=""
                                defaultValue="NURSE"
                            />

                            <CustomInput
                                type="input"
                                control={form.control}
                                name="name"
                                placeholder="Staff name"
                                label="Full Name"
                            />

                            <div className="flex items-center gap-2">
                                <CustomInput
                                    type="input"
                                    control={form.control}
                                    name="email"
                                    placeholder="john@example.com"
                                    label="Email Address"
                                />

                                <CustomInput
                                    type="input"
                                    control={form.control}
                                    name="phone"
                                    placeholder="9225600735"
                                    label="Contact Number"
                                />
                            </div>

                            <CustomInput
                                type="input"
                                control={form.control}
                                name="license_number"
                                placeholder="License Number"
                                label="License Number"
                            />
                            <CustomInput
                                type="input"
                                control={form.control}
                                name="department"
                                placeholder="Children's ward"
                                label="Department"
                            />

                            <CustomInput
                                type="input"
                                control={form.control}
                                name="address"
                                placeholder="1479 Street, Apt 1839-G, NY"
                                label="Address"
                            />

                            <CustomInput
                                type="input"
                                control={form.control}
                                name="password"
                                placeholder=""
                                label="Password"
                                inputType="password"
                            />

                            <Button type="submit" disabled={isLoading} className="w-full">
                                Submit
                            </Button>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
    )
}
