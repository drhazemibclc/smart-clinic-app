"use client"

import { Ban, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { GiConfirmed } from "react-icons/gi"
import { MdCancel } from "react-icons/md"
import { toast } from "sonner"
import { appointmentAction } from "@/app/actions/appointment"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Textarea } from "./ui/textarea"

interface ActionsProps {
    type: "approve" | "cancel"
    id: string | number
    disabled: boolean
}

export const AppointmentActionDialog = ({ type, id, disabled }: ActionsProps) => {
    const [isLoading, setIsLoading] = useState(false)
    const [reason, setReason] = useState("")
    const router = useRouter()

    const handleAction = async () => {
        if (type === "cancel" && !reason) {
            toast.error("Please provide a reason for cancellation.")
            return
        }

        try {
            setIsLoading(true)
            const newReason =
                reason ||
                `Appointment has ben ${type === "approve" ? "scheduled" : "cancelled"} on ${new Date()}`

            const resp = await appointmentAction(
                id,
                type === "approve" ? "SCHEDULED" : "CANCELLED",
                newReason
            )

            if (resp.success) {
                toast.success(resp.msg)
                setReason("")
                router.refresh()
            } else if (resp.error) {
                toast.error(resp.msg)
            }
        } catch (error) {
            console.log(error)
            toast.error("Something went wrong. Try again later.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild disabled={!disabled}>
                {type === "approve" ? (
                    <Button size="sm" variant="ghost" className="w-full justify-start">
                        <Check size={16} /> Approve
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex w-full items-center justify-start gap-2 rounded-full text-red-500 disabled:cursor-not-allowed"
                    >
                        <Ban size={16} /> Cancel
                    </Button>
                )}
            </DialogTrigger>

            <DialogContent>
                <div className="flex flex-col items-center justify-center py-6">
                    <DialogTitle>
                        {type === "approve" ? (
                            <div className="mb-2 rounded-full bg-emerald-200 p-4">
                                <GiConfirmed size={50} className="text-emerald-500" />
                            </div>
                        ) : (
                            <div className="mb-2 rounded-full bg-red-200 p-4">
                                <MdCancel size={50} className="text-red-500" />
                            </div>
                        )}
                    </DialogTitle>

                    <span className="text-black text-xl">
                        Appointment
                        {type === "approve" ? " Confirmation" : " Cancellation"}
                    </span>
                    <p className="text-center text-gray-500 text-sm">
                        {type === "approve"
                            ? "You're about to confirmed this appointment. Yes to approve or No to cancel."
                            : "Are you sure you want to cancel this appointment?"}
                    </p>

                    {type === "cancel" && (
                        <Textarea
                            disabled={isLoading}
                            className="mt-4"
                            placeholder="Cancellation reason...."
                            onChange={(e) => setReason(e.target.value)}
                        />
                    )}

                    <div className="mt-6 flex items-center justify-center gap-x-4">
                        <Button
                            disabled={isLoading}
                            onClick={() => handleAction()}
                            variant="outline"
                            className={cn(
                                "px-4 py-2 font-medium text-sm text-white hover:text-white hover:underline",
                                type === "approve"
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-destructive hover:bg-destructive"
                            )}
                        >
                            Yes, {type === "approve" ? "Approve" : "Delete"}
                        </Button>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                className="px-4 py-2 text-gray-500 text-sm underline"
                            >
                                No
                            </Button>
                        </DialogClose>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
