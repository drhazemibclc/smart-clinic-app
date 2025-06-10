import { postRouter } from "@/server/api/routers/post"
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc"
import { adminRouter } from "./routers/admin"
import { appointmentRouter } from "./routers/appointment"
import { authRouter } from "./routers/auth"
import { doctorRouter } from "./routers/doctor"
import { growthRouter } from "./routers/growth"
import { medicalRouter } from "./routers/medical"
import { medicalRecordRouter } from "./routers/medicalRecord"
import { patientRouter } from "./routers/patient"
import { paymentRouter } from "./routers/payment"
import { staffRouter } from "./routers/staff"

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
    post: postRouter,
    admin: adminRouter,
    appointment: appointmentRouter,
    auth: authRouter,
    medical: medicalRouter,
    patient: patientRouter,
    payment: paymentRouter,
    doctor: doctorRouter,
    growth: growthRouter,
    medicalRecord: medicalRecordRouter,
    staff: staffRouter
})

// export type definition of API
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter)
