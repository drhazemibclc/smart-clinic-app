import Link from "next/link"
import { checkRole } from "@/utils/roles"
import { ReviewForm } from "../dialogs/review-form"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"

const AppointmentQuickLinks = async ({ staffId }: { staffId: string }) => {
    const isPatient = await checkRole("PATIENT")

    return (
        <Card className="w-full rounded-xl bg-white shadow-none">
            <CardHeader>
                <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                <Link href="?cat=charts" className="rounded-lg bg-gray-100 px-4 py-2 text-gray-600">
                    Charts
                </Link>
                <Link
                    href="?cat=appointments"
                    className="rounded-lg bg-violet-100 px-4 py-2 text-violet-600"
                >
                    Appointments
                </Link>

                <Link
                    href="?cat=diagnosis"
                    className="rounded-lg bg-blue-100 px-4 py-2 text-blue-600"
                >
                    Diagnosis
                </Link>

                <Link
                    href="?cat=billing"
                    className="rounded-lg bg-green-100 px-4 py-2 text-green-600"
                >
                    Bills
                </Link>

                <Link
                    href="?cat=medical-history"
                    className="rounded-lg bg-red-100 px-4 py-2 text-red-600"
                >
                    Medical History
                </Link>

                <Link
                    href="?cat=payments"
                    className="rounded-lg bg-purple-100 px-4 py-2 text-purple-600"
                >
                    Payments
                </Link>

                <Link
                    href="?cat=lab-test"
                    className="rounded-lg bg-purple-100 px-4 py-2 text-purple-600"
                >
                    Lab Test
                </Link>

                <Link
                    href="?cat=appointments#vital-signs"
                    className="rounded-lg bg-purple-100 px-4 py-2 text-purple-600"
                >
                    Vital Signs
                </Link>

                {!isPatient && <ReviewForm staffId={staffId} />}
            </CardContent>
        </Card>
    )
}

export default AppointmentQuickLinks
