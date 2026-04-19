import { UseFormReset } from "react-hook-form";
import { IAuthFormData } from "../../type/auth.type";
import { useAuth } from "./auth.hook";
import { useMutation } from "@tanstack/react-query";
import { AuthService } from "../api/AuthService";
import { useMemo } from "react";

export const useAuthMutations = (
    reset: UseFormReset<IAuthFormData>
) => {
    const { setUser } = useAuth();
    const authService = new AuthService();
    const { mutate: loginSync, isPending: isLoginLoading, error: loginError } = useMutation({
        mutationKey: ['login'],
        mutationFn: ({ email, password }: IAuthFormData) => authService.login(email, password),
        onSuccess: (data) => {
            setUser(data);
            reset();
        },
        onError: (error) => {
            console.log(error);
        },
    });

    const { mutate: registrationSync, isPending: isRegistrationLoading, error: registrationError } = useMutation({
        mutationKey: ['registration'],
        mutationFn: ({ email, password, name }: IAuthFormData) => authService.registration({ email, password, name }),
        onSuccess: (data) => {
            setUser(data);
            reset();
        },
        onError: (error) => {
            console.log(error);
        },
    });



    return  useMemo(() => ({
        login: loginSync,

        isLoginLoading,
        registration: registrationSync, isRegistrationLoading,
        isLoading: isLoginLoading || isRegistrationLoading,
        loginError,
        registrationError,
    }), [loginSync, registrationSync, isLoginLoading, isRegistrationLoading, loginError, registrationError]);
}

