'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { useUser } from "../lib/hook/user.hook";
import { Badge } from "@workspace/ui/components/badge";
import { div } from "framer-motion/client";
import { Input } from "@workspace/ui/components/input";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export const Users = ({ userId }: { userId: string }) => {
    const { users } = useUser(userId);
    const [search, setSearch] = useState('');
    const filteredUsers = users?.filter((user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()));

    const router = useRouter();
    return (
        <div className="flex flex-col gap-4 h-[75vh]">
            <h1 className="text-2xl font-bold">Пользователи</h1>
            <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4" />
                    Назад
                </Button>
                <Input type="text" placeholder="Поиск" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                    {
                        filteredUsers?.map((user) => (
                            <div key={user.id}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{user.name}</CardTitle>
                                        <CardDescription>{user.email}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p>{user.role}</p>
                                        <Badge variant={user.isAcivated ? 'default' : 'destructive'}>
                                            <p>{user.isAcivated ? 'Activated' : 'Not Activated'}</p>

                                        </Badge>
                                    </CardContent>
                                </Card>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>

    )
}
