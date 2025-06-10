import { adminClient, inferAdditionalFields } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { toast } from "sonner"

import type { auth } from "./auth"
import { accessControl, admin, doctor, nurse, patient } from "./permissions"

export const authClient = createAuthClient({
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [
        adminClient(),
        inferAdditionalFields<typeof auth>(),
        adminClient({
            accessControl,
            roles: { admin, doctor, patient, nurse }
        })
    ],
    fetchOptions: {
        onError(e) {
            if (e.error.status === 429) {
                toast.error("Too many requests. Please try again later.")
            }
        }
    }
})

export const { signIn, signOut, signUp, useSession } = createAuthClient()
export type Session = typeof authClient.$Infer.Session

export type User = (typeof authClient.$Infer.Session)["user"]
export type Role = (typeof authClient.$Infer.Session)["user"]["role"]
