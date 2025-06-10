import Image from "next/image"
import { cn } from "@/lib/utils"
import { getInitials } from "@/utils"

export const ProfileImage = ({
    url,
    name,
    className,
    textClassName,
    bgColor
}: {
    url?: string
    name: string
    className?: string
    textClassName?: string
    bgColor?: string
}) => {
    if (url)
        return (
            <Image
                src={url}
                alt={name}
                height={40}
                width={40}
                className={cn(
                    "flex h-10 w-10 rounded-full object-cover md:hidden lg:block",
                    className
                )}
            />
        )

    if (name) {
        return (
            <div
                className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full font-light text-base text-white md:hidden lg:flex",
                    className
                )}
                style={{ backgroundColor: bgColor || "#2563eb" }}
            >
                <p className={textClassName}>{getInitials(name)}</p>
            </div>
        )
    }
}
