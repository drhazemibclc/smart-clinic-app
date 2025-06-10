"use client"

import { useRouter } from "next/navigation"
import { LiquidButton } from "@/components/liquid-button"
import { type Session, signIn, signOut } from "@/lib/auth/client"

export const SignButton = ({ session }: { session: Session | null }) => {
    const router = useRouter()

    const handleClick = async () => {
        if (session?.user?.id) {
            await signOut()
            router.refresh()
        } else {
            await signIn.social({ provider: "google" })
        }
    }

    const userName = session?.user?.name ?? session?.user?.email ?? "User"

    return (
        <div className="flex flex-col items-center gap-2 text-gray-700 text-sm">
            {session?.user?.id ? (
                <>
                    <p className="text-gray-600 text-sm">
                        Signed in as <strong>{userName}</strong>
                    </p>
                    <AuthButton onClick={handleClick} text="Sign out" />
                </>
            ) : (
                <AuthButton onClick={handleClick} text="Sign in with Google" />
            )}
        </div>
    )
}

const AuthButton = ({ onClick, text }: { onClick: () => void; text: string }) => {
    return (
        <LiquidButton
            onClick={onClick}
            className="rounded-2xl px-4 py-2 font-medium shadow-sm transition-all hover:brightness-110"
            aria-label={text}
        >
            {text}
        </LiquidButton>
    )
}
