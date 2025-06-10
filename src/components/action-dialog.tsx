"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FaQuestion } from "react-icons/fa6"
import { toast } from "sonner"
import { deleteDataById } from "@/app/actions/general"
import { ProfileImage } from "./profile-image"
import { SmallCard } from "./small-card"
import { Button } from "./ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog"

interface ActionDialogProps {
    type: "doctor" | "staff" | "delete"
    id: string
    data?: {
        img?: string
        name?: string
        colorCode?: string
        role?: string
        email?: string
        phone?: string
        address?: string
        department?: string
        license_number?: string
    }
    deleteType?: "doctor" | "staff" | "patient" | "payment" | "bill"
}
export const ActionDialog = ({ id, data, type, deleteType }: ActionDialogProps) => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    if (type === "delete") {
        const handleDelete = async () => {
            try {
                setLoading(true)

                if (!deleteType) {
                    toast.error("Delete type is not specified")
                    setLoading(false)
                    return
                }
                const res = await deleteDataById(id, deleteType)

                if (res.success) {
                    toast.success("Record deleted successfully")
                    router.refresh()
                } else {
                    toast.error("Failed to delete record")
                }
            } catch (error) {
                console.log(error)
                toast.error("Something went wrong")
            } finally {
                setLoading(false)
            }
        }

        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="flex items-center justify-center rounded-full text-red-500"
                    >
                        <Trash2 size={16} className="text-red-500" />
                        {deleteType === "patient" && "Delete"}
                    </Button>
                </DialogTrigger>

                <DialogContent>
                    <div className="flex flex-col items-center justify-center py-6">
                        <DialogTitle>
                            <div className="mb-2 rounded-full bg-red-200 p-4">
                                <FaQuestion size={50} className="text-red-500" />
                            </div>
                        </DialogTitle>

                        <span className="text-black text-xl">Delete Confirmation</span>
                        <p className="text-sm">
                            Are you sure you want to delete the selected record?
                        </p>

                        <div className="mt-6 flex items-center justify-center gap-x-3">
                            <DialogClose asChild>
                                <Button variant={"outline"} className="px-4 py-2">
                                    Cancel
                                </Button>
                            </DialogClose>

                            <Button
                                disabled={loading}
                                variant="outline"
                                className="bg-destructive px-4 py-2 font-medium text-sm text-white hover:bg-destructive hover:text-white"
                                onClick={handleDelete}
                            >
                                Yes. Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (type === "staff") {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button
                        variant={"outline"}
                        className="flex items-center justify-center rounded-full text-blue-600 text-blue-600/10 hover:underline"
                    >
                        View
                    </Button>
                </DialogTrigger>

                <DialogContent className="max-h-[90%] max-w-[300px] overflow-y-auto p-8 md:max-w-2xl">
                    <DialogTitle className="mb-4 font-semibold text-gray-600 text-lg">
                        Staff Information
                    </DialogTitle>

                    <div className="flex justify-between">
                        <div className="flex items-center gap-3">
                            <ProfileImage
                                url={data?.img ?? ""}
                                name={data?.name ?? ""}
                                className="xl:size-20"
                                bgColor={data?.colorCode ?? "0000"}
                                textClassName="xl:text-2xl"
                            />

                            <div className="flex flex-col">
                                <p className="font-semibold text-xl">{data?.name}</p>
                                <span className="text-gray-600 text-sm capitalize md:text-base">
                                    {data?.role?.toLowerCase()}
                                </span>
                                <span className="text-blue-500 text-sm">Full-Time</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 space-y-6">
                        <div className="flex flex-col gap-y-4 md:flex-row md:flex-wrap md:items-center md:gap-x-0 xl:justify-between">
                            {/* <SmallCard label="Full Name" value={data?.name} /> */}
                            <SmallCard label="Email Address" value={data?.email ?? "N/A"} />
                            <SmallCard label="Phone Number" value={data?.phone ?? "N/A"} />
                        </div>

                        <div>
                            <SmallCard label="Address" value={data?.address || "N/A"} />
                        </div>

                        <div className="flex flex-col gap-y-4 md:flex-row md:flex-wrap md:items-center md:gap-x-0 xl:justify-between">
                            <SmallCard label="Role" value={data?.role ?? "N/A"} />
                            <SmallCard label="Department" value={data?.department || "N/A"} />
                            <SmallCard
                                label="License Number"
                                value={data?.license_number || "N/A"}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }
    return null
}
