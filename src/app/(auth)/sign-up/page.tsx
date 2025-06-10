import Link from "next/link"
import { SignUpForm } from "./_components/sign-up-form"

export default function SignUpPage() {
    return (
        <>
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center font-bold text-3xl tracking-tight">
                    Create a new account
                </h2>
                <p className="mt-2 text-center text-muted-foreground text-sm">
                    Already have an account?{" "}
                    <Link href="/login" className="font-medium text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
            <SignUpForm />
        </>
    )
}
