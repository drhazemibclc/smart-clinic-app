"use client"

import { EllipsisVertical } from "lucide-react"
import Link from "next/link"
import type React from "react"

import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

export const ActionOptions = ({ children }: { children: React.ReactNode }) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="flex items-center justify-center rounded-full p-1"
                >
                    <EllipsisVertical size={16} className="text-gray-500 text-sm" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3">
                <span className="mb-4 text-gray-400 text-xs uppercase">Perform Action</span>
                {children}
            </PopoverContent>
        </Popover>
    )
}

const className =
    "flex items-center justify-center rounded-full bg-blue-600/10 hover:underline text-blue-600 px-1.5 py-1 text-xs md:text-sm disabled:text-gray-400 disabled:hover:no-underline disabled:cursor-not-allowed"

export const ViewAction = ({ href, disabled = false }: { href: string; disabled?: boolean }) => {
    return (
        <Link href={href}>
            <button type={"submit"} disabled={disabled} className={className}>
                View
            </button>
        </Link>
    )
}

export const ViewActionButton = () => {
    return (
        <button type="button" className={className}>
            View
        </button>
    )
}
