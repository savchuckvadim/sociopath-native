import { UseFormReset } from "react-hook-form";
import { IAuthFormData } from "../../type/auth.type";
import { useAuth } from "./auth.hook";
import { useMutation } from "@tanstack/react-query";
import { AuthService } from "../api/AuthService";
import { useMemo } from "react";

export const useAuthLogout = (

) => {
    const { setUser } = useAuth();
    const authService = new AuthService();

    const { mutate: logoutSync, isPending: isLogoutLoading } = useMutation({
        mutationKey: ['logout'],
        mutationFn: () => authService.logout(),
        onSuccess: () => {
            setUser(null);
        },
        onError: (error) => {
            console.log(error);
        },
    });

    return  useMemo(() => ({
        isLogoutLoading,
        logout: logoutSync,
    }), [isLogoutLoading, logoutSync]);
}

