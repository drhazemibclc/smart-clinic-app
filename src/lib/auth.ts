// src/lib/auth/index.ts

import { betterAuth as betterAuthClient } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
// import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js"
import { admin as adminPlugin, openAPI, organization } from "better-auth/plugins"

import { headers } from "next/headers"
import { cache } from "react"
import { z } from "zod" // <--- Add this line!
import { env } from "@/env"
import { accessControl, admin, doctor, nurse, patient } from "./auth/permissions"
import { db } from "./db"

// Create a temporary, unexported variable to let TypeScript infer its full type
// without immediately trying to serialize it for an export.
const betterAuth = betterAuthClient({
    database: prismaAdapter(db, {
        provider: "postgresql"
    }),
    trustedOrigins: [
        "http://localhost:3000", // Keep your local development origin
        "https://3001-firebase-smart-clinic-appgit-1749545326258.cluster-axf5tvtfjjfekvhwxwkkkzsk2y.cloudworkstations.dev"
    ],
    secret: process.env.BETTER_AUTH_SECRET as string,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    user: {
        additionalFields: {
            role: {
                type: "string", // The database type for the field
                required: false,
                input: false, // This often means it's not a direct input from user registration forms
                // FIX: Use a Zod schema for validation
                validator: {
                    input: z.enum(["patient", "doctor", "admin"]) // Validate incoming role values
                    // If you need to validate output from DB differently, add output: z.schema_for_output
                }
            },
            firstName: {
                type: "string",
                required: false
            },
            lastName: {
                type: "string",
                required: false
            }
        },
        session: {
            expiresIn: 60 * 60 * 24 * 7, // 7 days
            updateAge: 60 * 60 * 24 * 7, // 7 days
            cookieCache: {
                enabled: true,
                maxAge: 5 * 60 // 5 minutes cache
            }
        }
    },
    // advanced: {
    //     crossSubDomainCookies: {
    //         enabled: true
    //     },
    //     defaultCookieAttributes: {
    //         sameSite: "lax",
    //         secure: process.env.NODE_ENV === "production"
    //     }
    // },
    //   hooks: {
    //     after: createAuthMiddleware(async (ctx) => {
    //       const path = ctx.path;
    //       if (path.startsWith("/sign-in/email")) {
    //         const newSession = ctx.context.newSession;
    //         if (newSession) {
    //           const returned = ctx.context.returned;
    //           if (typeof returned === 'object' && returned !== null) {
    //             return ctx.json({
    //               ...returned,
    //               user: {
    //                 ...newSession.user,
    //               },
    //             });
    //           }
    //         }
    //       }
    //     }),
    //   },
    // trustedOrigins: [process.env.CORS_ORIGIN || ""],
    //   onAPIError: {
    //     throw: true,
    //     onError: (error, _ctx) => {
    //       console.error("Auth error:", error);
    //     },
    //     errorURL: `${process.env.API_URL}/auth-error`,
    //   },
    // rateLimit: {
    //     window: 60, // seconds
    //     max: 10
    // },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        autoSignIn: false
    },
    socialProviders: {
        google: {
            clientId: env.BETTER_AUTH_GOOGLE_ID,
            clientSecret: env.BETTER_AUTH_GOOGLE_SECRET
        }
    },
    plugins: [
        organization(),
        nextCookies(),
        openAPI(),
        adminPlugin({
            impersonationSessionDuration: 60 * 60 * 24 * 7,
            defaultRole: "patient",
            adminRoles: ["admin", "doctor"],
            accessControl,
            roles: { admin, doctor, nurse, patient }
        })
    ]
})

// Now, explicitly type your exported `betterAuth` constant using `typeof` the temporary variable.
export const auth = betterAuth
export const { handler } = betterAuth

export const getSession = cache(async () => {
    const session = await betterAuth.api.getSession({
        headers: await headers()
    })
    return session
})

export type Session = typeof betterAuth.$Infer.Session
export type User = Session["user"]
export type Role = User["role"]
