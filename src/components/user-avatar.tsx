import Image from "next/image"

export function UserAvatar({
    user
}: {
    user: { firstName?: string; lastName?: string; image?: string }
}) {
    return (
        <div className="flex items-center gap-2">
            {user.image ? (
                <Image
                    src={user.image}
                    alt="User Avatar"
                    width={40}
                    height={40}
                    className="rounded-full"
                />
            ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 font-medium text-white">
                    {(user.firstName?.[0] || "") + (user.lastName?.[0] || "")}
                </div>
            )}
        </div>
    )
}
