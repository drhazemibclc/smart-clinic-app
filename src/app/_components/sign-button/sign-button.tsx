"use client"

import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { usePostHog } from "posthog-js/react"
import { useEffect } from "react"
import { LiquidButton } from "@/components/liquid-button"
import { POSTHOG_EVENTS } from "@/constants/posthog"
import type { Session } from "@/lib/auth"
import { signIn, signOut } from "@/lib/auth/client"

export const SignButton = ({ session }: { session: Session | null }) => {
    const router = useRouter()
    const posthog = usePostHog()
    const searchParams = useSearchParams()

    const onClick = async () => {
        if (session) {
            await signOut()
            if (posthog) {
                posthog.capture(POSTHOG_EVENTS.USER_SIGNED_OUT, {
                    userId: session.user.id,
                    email: session.user.email
                })
            }
            router.refresh()
        } else {
            await signIn.social({
                provider: "google",
                newUserCallbackURL: "/?new_user=true"
            })
        }
    }

    useEffect(() => {
        const newUser = searchParams.get("new_user")
        if (newUser === "true" && posthog && session?.user.id) {
            posthog.capture(POSTHOG_EVENTS.USER_SIGNED_IN, {
                userId: session.user.id,
                email: session.user.email
            })
            router.replace("/")
        }
    }, [posthog, searchParams, router, session])

    if (session?.user.id) {
        return (
            <div className="flex items-center justify-center gap-4">
                <Image
                    src={session.user.image ?? ""}
                    alt={session.user.name ?? ""}
                    width={32}
                    height={32}
                    className="rounded-full"
                />
                <AuthButton onClick={onClick} text="Sign out" />
            </div>
        )
    }

    return <AuthButton onClick={onClick} text="Sign in" />
}

const AuthButton = ({ onClick, text }: { onClick: () => void; text: string }) => {
    return (
        <LiquidButton onClick={onClick} className="rounded-2xl px-3 py-0.5 font-semibold">
            {text}
        </LiquidButton>
    )
}
