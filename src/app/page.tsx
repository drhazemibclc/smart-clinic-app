import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getSession } from "@/lib/auth"
import { HydrateClient } from "@/trpc/server"
import { getRole } from "@/utils/roles"

import { MotionDiv, MotionSpan } from "./_components/motion-wrapper"
import { SignButton } from "./_components/sign-button"

const MOTION_CONFIG = {
    header: {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: "easeOut" }
    },
    clinicName: {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 1, delay: 0.4, type: "spring" }
    }
}

const LoadingFallback = () => <div className="h-12 w-full animate-pulse rounded-md bg-gray-200" />

const Footer = () => (
    <footer className="mt-8 w-full p-4">
        <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Smart Clinic. All rights reserved.
            <br className="sm:hidden" />
            <span className="ml-1 inline-block sm:inline">
                Dedicated to Healthy Beginnings in Hurghada.
            </span>
        </p>
    </footer>
)

export default async function Home() {
    const session = await getSession()
    const role = session?.user?.role || (await getRole())
    const dashboardPath = `/${role?.toLowerCase()}`

    if (session?.user?.id && role) redirect(dashboardPath)

    return (
        <HydrateClient>
            <main className="flex h-screen flex-col justify-between px-6 py-8">
                <section className="flex flex-1 flex-col items-center justify-center text-center">
                    <MotionDiv {...MOTION_CONFIG.header}>
                        <h1 className="font-extrabold text-4xl text-gray-900 leading-tight md:text-5xl lg:text-6xl">
                            Welcome to
                            <MotionSpan
                                {...MOTION_CONFIG.clinicName}
                                className="mt-2 block font-black text-6xl text-blue-700 tracking-tight md:text-7xl lg:text-8xl"
                            >
                                Smart Clinic
                            </MotionSpan>
                        </h1>

                        <p className="mt-4 max-w-2xl font-medium text-gray-700 text-lg md:text-xl">
                            Your dedicated <strong>Pediatric and Lactation Clinic</strong> in the
                            heart of Hurghada.
                        </p>

                        <MotionDiv
                            initial={{ opacity: 0, textShadow: "0 0 0px #fff" }}
                            animate={{
                                opacity: 1,
                                textShadow: "0 0 8px #fff, 0 0 16px #fff, 0 0 24px #fff"
                            }}
                            transition={{
                                delay: 0.8,
                                duration: 2,
                                ease: "easeOut",
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                            className="mt-6 max-w-xl text-base text-white leading-relaxed md:text-lg"
                        >
                            At <strong>Smart Clinic</strong>, we’re committed to nurturing your
                            children’s health and supporting mothers in their lactation journey with
                            compassionate, expert care.
                        </MotionDiv>

                        <div className="mt-10 w-full max-w-xl">
                            <Suspense fallback={<LoadingFallback />}>
                                <SignButton session={session} />
                            </Suspense>
                        </div>
                    </MotionDiv>
                </section>

                <Footer />
            </main>
        </HydrateClient>
    )
}
