"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/trpc/react"
import { signUpSchema } from "@/lib/zod-schemas/auth"

const signUpFormSchema = signUpSchema
    .extend({
        confirmPassword: z.string().min(1, { message: "Please confirm your password" })
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"]
    })

type SignUpFormData = z.infer<typeof signUpFormSchema>

export function SignUpForm() {
    const router = useRouter()
    const [isRedirecting, setIsRedirecting] = useState(false)

    const form = useForm<SignUpFormData>({
        resolver: zodResolver(signUpFormSchema),
        mode: "onChange", // Enable live validation
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: ""
        }
    })

    const signUpMutation = api.auth.signUp.useMutation({
        onSuccess: () => {
            setIsRedirecting(true)
            toast.success("Account created successfully!")
            router.push("/login")
        }
    })

    const onSubmit = (data: SignUpFormData) => {
        const { confirmPassword: _cf, ...apiData } = data
        signUpMutation.mutate(apiData)
    }

    const isLoading = signUpMutation.isPending || isRedirecting

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input
                                    type="text"
                                    placeholder="Enter your full name"
                                    disabled={isLoading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    disabled={isLoading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="Create a strong password"
                                    disabled={isLoading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder="Confirm your password"
                                    disabled={isLoading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isRedirecting
                        ? "Redirecting..."
                        : isLoading
                          ? "Creating account..."
                          : "Create account"}
                </Button>
            </form>
        </Form>
    )
}
