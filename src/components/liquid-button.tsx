"use client"

import { type HTMLMotionProps, motion } from "motion/react"
import * as React from "react"

import { cn } from "@/lib/utils"

type LiquidButtonProps = HTMLMotionProps<"button">

const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
    ({ className, ...props }, ref) => {
        return (
            <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.03 }}
                className={cn(
                    "!bg-muted relative h-8 cursor-pointer overflow-hidden rounded-lg px-4 py-2 font-medium text-primary text-sm [--liquid-button-color:var(--primary)] [background:_linear-gradient(var(--liquid-button-color)_0_0)_no-repeat_calc(200%-var(--liquid-button-fill,0%))_100%/200%_var(--liquid-button-fill,0.2em)] [transition:_background_0.3s_var(--liquid-button-delay,0s),_color_0.3s_var(--liquid-button-delay,0s),_background-position_0.3s_calc(0.3s_-_var(--liquid-button-delay,0s))] hover:text-primary-foreground focus:outline-none hover:[--liquid-button-delay:0.3s] hover:[--liquid-button-fill:100%]",
                    className
                )}
                {...props}
                ref={ref}
            />
        )
    }
)

LiquidButton.displayName = "LiquidButton"

export { LiquidButton, type LiquidButtonProps }
