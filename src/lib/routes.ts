// RouteConfig type
export type RouteConfig = {
    pattern: URLPattern
    allowedRoles: string[]
}

// Route access config - paths with :path* converted to URLPattern (done above)
export const routeAccess: { path: string; allowedRoles: string[] }[] = [
    { path: "/admin/:path*", allowedRoles: ["admin"] },
    { path: "/patient/:path*", allowedRoles: ["patient", "admin", "doctor", "nurse"] },
    { path: "/doctor/:path*", allowedRoles: ["doctor", "admin"] },
    { path: "/staff/:path*", allowedRoles: ["nurse", "lab_technician", "cashier", "admin"] },
    { path: "/records/users", allowedRoles: ["admin"] },
    { path: "/records/doctors/:path*", allowedRoles: ["admin", "doctor"] },
    { path: "/records/staffs/:path*", allowedRoles: ["admin", "doctor"] },
    { path: "/records/patients/:path*", allowedRoles: ["admin", "doctor", "nurse"] },
    { path: "/patient/registrations", allowedRoles: ["admin", "nurse"] }
]
