// src/lib/auth/use-auth.ts
import { useCallback, useEffect, useState } from "react"
import { getSession, type Session } from "./auth"

export interface AuthUser {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string | null
    role?: string | null
    banned?: boolean | null
    banReason?: string | null
    banExpires?: Date | null
    firstName?: string | null
    lastName?: string | null
    createdAt: Date
    updatedAt: Date
}

/**
 * Normalize raw user data from the session.
 */
function normalizeUser(user: unknown): AuthUser {
    const u = user as Partial<AuthUser> & {
        id: string
        name: string
        email: string
        createdAt: Date
        updatedAt: Date
    }

    return {
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified ?? false,
        image: u.image ?? null,
        role: u.role ?? null,
        banned: u.banned ?? null,
        banReason: u.banReason ?? null,
        banExpires: u.banExpires ?? null,
        firstName: u.firstName ?? null,
        lastName: u.lastName ?? null,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt)
    }
}

/**
 * Custom hook to manage and expose user session state.
 */
export function useAuth() {
    const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")
    const [user, setUser] = useState<AuthUser | null>(null)
    const [error, setError] = useState<Error | null>(null)

    const fetchSession = useCallback(async () => {
        try {
            const session: Session | null = await getSession()
            if (session?.user) {
                setUser(normalizeUser(session.user))
                setStatus("authenticated")
                setError(null)
            } else {
                setUser(null)
                setStatus("unauthenticated")
                setError(null)
            }
        } catch (err) {
            console.error("Failed to retrieve session:", err)
            setUser(null)
            setStatus("unauthenticated")
            setError(err instanceof Error ? err : new Error("Unknown error during authentication."))
        }
    }, [])

    useEffect(() => {
        fetchSession()
    }, [fetchSession])

    return { user, status, error }
}

/**
 * Hook to expose simplified auth data for UI components.
 */
export function useUser() {
    const { user, status, error } = useAuth()

    return {
        user,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated",
        error
    }
}
