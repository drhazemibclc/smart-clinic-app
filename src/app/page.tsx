import { motion } from "framer-motion"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { HexagonBackground } from "@/components/hexagon-background"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/auth"
import { HydrateClient } from "@/trpc/server"
import { getRole } from "@/utils/roles"
import { SignButton } from "./_components/sign-button"

export default async function Home() {
    const session = await getSession()
    const userId = session?.user?.id
    const role = session?.user?.role || (await getRole())

    if (userId && role) {
        redirect(`/${role.toLowerCase()}`)
    }

    return (
        <HydrateClient>
            <HexagonBackground
                className="flex size-full min-h-screen items-center justify-center"
                hexagonSize={65}
                hexagonMargin={2}
            >
                <div className="flex h-screen flex-col items-center justify-between p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="flex flex-1 flex-col items-center justify-center px-4 text-center md:px-8"
                    >
                        <h1 className="text-center font-extrabold text-4xl leading-tight md:text-5xl lg:text-6xl">
                            Welcome to
                            <motion.span
                                className="mt-2 block text-6xl text-blue-700 md:text-7xl lg:text-8xl"
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.4, type: "spring" }}
                            >
                                Kinda HMS
                            </motion.span>
                        </h1>

                        <p className="mx-auto mt-4 max-w-3xl text-gray-600 text-lg md:text-xl">
                            Your trusted partner in pediatric healthcare.
                        </p>

                        <motion.p
                            className="mt-6 mb-10 max-w-2xl text-base text-gray-700 leading-relaxed md:text-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            At <strong>Kinda HMS</strong>, we believe in nurturing health from the
                            very first step. Our platform simplifies pediatric care — from
                            appointment scheduling to growth tracking and medical records.
                        </motion.p>

                        <div className="flex w-full flex-col justify-center gap-4 sm:flex-row">
                            {userId ? (
                                <Link
                                    href={`/${role?.toLowerCase() || ""}`}
                                    className="w-full sm:w-auto"
                                >
                                    <Button className="w-full py-6 font-semibold text-lg">
                                        Go to Your Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/sign-up" className="w-full sm:w-auto">
                                        <Button className="w-full bg-blue-600 py-6 font-semibold text-lg hover:bg-blue-700">
                                            New Patient? Register Here!
                                        </Button>
                                    </Link>
                                    <Suspense
                                        fallback={
                                            <div className="h-12 w-full animate-pulse rounded-md bg-gray-200 sm:w-auto" />
                                        }
                                    >
                                        <SignButton session={undefined} />
                                    </Suspense>
                                    <Link href="/sign-in" className="w-full sm:w-auto">
                                        <Button
                                            variant="outline"
                                            className="w-full border-blue-700 py-6 font-medium text-blue-700 text-lg hover:bg-blue-50 hover:text-blue-800"
                                        >
                                            Already have an account? Log In
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>
                    </motion.div>

                    <footer className="w-full p-4">
                        <p className="text-center text-gray-500 text-sm">
                            &copy; {new Date().getFullYear()} Kinda HMS. All rights reserved.{" "}
                            <span className="hidden sm:inline">
                                Nurturing little lives, together.
                            </span>
                        </p>
                    </footer>
                </div>
            </HexagonBackground>
        </HydrateClient>
    )
}
