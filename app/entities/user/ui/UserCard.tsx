import { UserDto } from "@workspace/nest-api";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import Link from "next/link";


export const UserCard = ({ user }: { user: UserDto }) => {
    return (
        <Card className="w-full h-[30vh] bg-background/40">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">{user.name}</CardTitle>
                {/* <CardDescription className="text-sm text-gray-500">{user.email}</CardDescription> */}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <p className="text-sm text-gray-500 mb-2">{user.email}</p>
                <Link href={`/network/users`}>
                    <Button className="w-full">
                        Найти друзей
                    </Button>
                </Link>
            </CardContent>

        </Card>
    )
}
