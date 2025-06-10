import { PostHogProvider } from "@/components/providers/PostHogProvider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { TRPCReactProvider } from "@/trpc/react"

export const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
            <PostHogProvider>
                <TRPCReactProvider>{children}</TRPCReactProvider>
            </PostHogProvider>
        </ThemeProvider>
    )
}
