// src/app/_components/motion-wrapper.tsx
"use client"

import { AnimatePresence, type MotionProps, motion } from "framer-motion"

// Corrected: MotionProps already includes 'children', so no need to extend React.PropsWithChildren
interface MotionDivProps extends MotionProps {
    className?: string
    // If you want to be super explicit about children, you can add it here,
    // but it's often redundant with MotionProps.
    // children?: React.ReactNode;
}

export function MotionDiv({ children, className, ...props }: MotionDivProps) {
    return (
        <motion.div className={className} {...props}>
            {children}
        </motion.div>
    )
}

// Corrected: MotionProps already includes 'children'
interface MotionSpanProps extends MotionProps {
    className?: string
    // children?: React.ReactNode;
}

export function MotionSpan({ children, className, ...props }: MotionSpanProps) {
    return (
        <motion.span className={className} {...props}>
            {children}
        </motion.span>
    )
}

export { AnimatePresence }
