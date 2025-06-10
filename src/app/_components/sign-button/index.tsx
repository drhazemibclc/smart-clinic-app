import { auth } from "@/server/auth"
import { SignButton } from "./sign-button"

const SignButtonWrapper = async () => {
    const session = await auth()
    return (
        <div>
            <SignButton session={session} />
        </div>
    )
}

export { SignButtonWrapper as SignButton }
