"use client"

import { Bell } from "lucide-react"
import { usePathname } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { UserAvatar } from "@/components/user-avatar"
import { api } from "@/trpc/react"

export const Navbar = () => {
    const pathname = usePathname()
    const { data: session, isLoading } = api.auth.getSession.useQuery()

    const formatPathName = (): string => {
        if (!pathname) return "Overview"
        const splitRoute = pathname.split("/")
        const lastIndex = splitRoute.length - 1 > 2 ? 2 : splitRoute.length - 1
        const pathName = splitRoute[lastIndex] ?? "overview"
        return pathName.replace(/-/g, " ") || "Overview"
    }

    const path = formatPathName()

    return (
        <div className="flex justify-between bg-white p-5 shadow-sm">
            <h1 className="font-medium text-gray-500 text-xl capitalize">{path}</h1>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Bell className="text-gray-600" />
                    <span className="-top-2 absolute right-0 size-4 rounded-full bg-red-600 text-center text-[10px] text-white">
                        2
                    </span>
                </div>

                {isLoading ? (
                    <Skeleton className="h-10 w-10 rounded-full" />
                ) : session?.user ? (
                    <UserAvatar
                        user={{
                            firstName: session.user.firstName ?? undefined,
                            lastName: session.user.lastName ?? undefined,
                            image: session.user.image ?? undefined
                        }}
                    />
                ) : null}
            </div>
        </div>
    )
}
