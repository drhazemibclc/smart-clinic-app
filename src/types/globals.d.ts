// Define a type for the string representation of roles.
// This ensures that only valid role strings are used.
export type UserRoles = "ADMIN" | "PATIENT" | "NURSE" | "DOCTOR"

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            // The role in the JWT token is a string
            role?: UserRoles
        }
    }
}
