import { redirect } from "next/navigation"
import type React from "react"
import { api } from "@/trpc/server"

export const dynamic = "force-dynamic"

interface AuthLayoutProps {
    children: React.ReactNode
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
    const session = await api.auth.getSession()

    if (session) {
        redirect("/app")
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-card px-4 py-8 shadow sm:rounded-lg sm:px-10">{children}</div>
            </div>
        </div>
    )
}
