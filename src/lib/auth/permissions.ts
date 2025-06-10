import { createAccessControl } from "better-auth/plugins/access"
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access"

const statement = {
    user: Array.from(new Set([...defaultStatements.user, "update", "read", "unban"])),
    session: defaultStatements.session
} as const
const accessControl = createAccessControl(statement)
const admin = accessControl.newRole({
    user: [
        "create",
        "read",
        "update",
        "delete",
        "list",
        "ban",
        "unban",
        "impersonate",
        "set-password",
        "set-role"
    ],
    session: adminAc.statements.session
})
const doctor = accessControl.newRole({
    user: ["create", "read", "update", "delete", "ban", "unban"]
})
const patient = accessControl.newRole({
    user: ["read", "update", "delete"]
})
const nurse = accessControl.newRole({
    user: ["read", "update", "delete"]
})

export { statement, accessControl, doctor, admin, nurse, patient }
