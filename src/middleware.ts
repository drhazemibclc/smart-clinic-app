import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth" // Your BetterAuth session getter
import { type RouteConfig, routeAccess } from "@/lib/routes" // Your route access config

// Convert routeAccess paths to URLPattern objects with allowedRoles
const routeMatchers: RouteConfig[] = routeAccess.map(({ path, allowedRoles }) => {
    // Convert :path* wildcard to (.*) for URLPattern
    const patternString = path.replace(/:path\*/g, "(.*)")

    return {
        pattern: new URLPattern({ pathname: patternString }),
        allowedRoles
    }
})

export async function middleware(request: NextRequest) {
    const url = request.nextUrl

    const session = await getSession()
    const user = session?.user ?? null

    // Determine user role
    const userRole: string = user?.role || (user ? "patient" : "unauthenticated")

    // Find matching route by testing URL pathname against each pattern
    const matchedRoute = routeMatchers.find(({ pattern }) => pattern.test(url.pathname))

    if (matchedRoute && !matchedRoute.allowedRoles.includes(userRole)) {
        // Redirect unauthenticated users to sign-in page
        // Redirect unauthorized users to their role's dashboard
        const redirectTo =
            userRole === "unauthenticated"
                ? new URL("/sign-in", url.origin)
                : new URL(`/${userRole}`, url.origin)

        return NextResponse.redirect(redirectTo)
    }

    // User is authorized or route not protected, continue
    return NextResponse.next()
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"]
}
