import { toNextJsHandler } from "better-auth/next-js"
import { handler } from "@/lib/auth"

export const { GET, POST } = toNextJsHandler(handler)
