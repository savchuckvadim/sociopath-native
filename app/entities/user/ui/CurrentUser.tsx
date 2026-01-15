'use client'
import { useAuth } from "@/modules/processes";
import Link from "next/link";

export const CurrentUser = () => {
    const { currentUser } = useAuth();
    
    return (
        <Link href="/network/profile">
            <p className="text-sm text-primary">{currentUser?.name}</p>
        </Link>
    )
}
