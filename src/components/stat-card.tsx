import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/utils"
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"

interface CardProps {
    title: string
    icon: LucideIcon
    note: string
    value: number
    className?: string
    iconClassName?: string
    link: string
}

const CardIcon = ({ icon: Icon }: { icon: LucideIcon }) => {
    return <Icon />
}
export const StatCard = ({
    title,
    icon,
    note,
    value,
    className,
    iconClassName,
    link
}: CardProps) => {
    return (
        <Card className={cn("w-full md:w-[330px] 2xl:w-[250px]", className)}>
            <CardHeader className="flex flex-row items-center justify-between py-3 capitalize">
                <h3>{title}</h3>
                <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-0 bg-transparent p-2 font-normal text-xs hover:underline"
                >
                    <Link href={link}>See details</Link>
                </Button>
            </CardHeader>

            <CardContent>
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full bg-violet-50-500/15 text-violet-600",
                            iconClassName
                        )}
                    >
                        <CardIcon icon={icon} />
                    </div>

                    <h2 className="font-semibold text-2xl 2xl:text-3xl">{formatNumber(value)}</h2>
                </div>
            </CardContent>

            <CardFooter className="pb-3">
                <p className="text-gray-500 text-sm">{note}</p>
            </CardFooter>
        </Card>
    )
}
