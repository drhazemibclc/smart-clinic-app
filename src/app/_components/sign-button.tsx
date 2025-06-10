"use client"

import { useRouter } from "next/navigation"
import { LiquidButton } from "@/components/liquid-button"
import { type Session, signIn, signOut } from "@/server/auth/auth-client"

export const SignButton = ({ session }: { session: Session | null }) => {
    const router = useRouter()

    const onClick = async () => {
        if (session) {
            await signOut()
            router.refresh()
        } else {
            await signIn.social({ provider: "google" })
        }
    }

    return (
        <div>
            {session?.user.id ? (
                <div className="flex flex-col items-center justify-center gap-2">
                    <p>Signed in as {session.user.name}</p>
                    <AuthButton onClick={onClick} text="Sign out" />
                </div>
            ) : (
                <AuthButton onClick={onClick} text="Sign in" />
            )}
        </div>
    )
}

const AuthButton = ({ onClick, text }: { onClick: () => void; text: string }) => {
    return (
        <LiquidButton onClick={onClick} className="rounded-2xl px-3 py-0.5 font-semibold">
            {text}
        </LiquidButton>
    )
}
