import { SubmitHandler, useForm } from "react-hook-form"
import { IAuthFormData } from "../../type/auth.type"
import { useState } from "react";
import { AuthFields } from "../components/AuthFields";
import { useAuthMutations } from "../../lib/hooks/auth-mutations.hook";
import { Text, TouchableOpacity, View } from "react-native";
import { Button } from "@/shared/ui/Button/Button";
import { Loader } from "@/shared";
export const AuthForm = () => {
    const [isReg, setIsReg] = useState(false);
    const { control, handleSubmit, reset } = useForm<IAuthFormData>({
        mode: 'onChange', // Валидация при потере фокуса
        reValidateMode: 'onChange', // Повторная валидация при изменении после первой ошибки
        defaultValues: {
            email: "",
            password: "",
            name: ""
        }
    })
    const { login, registration, isLoading } = useAuthMutations(reset);
    const onSubmit: SubmitHandler<IAuthFormData> = (data) => {
        console.log('onSubmit', data);
        if (isReg) {
            registration(data);
        } else {
            console.log('login', data);
            login(data);
        }
    }
    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <Loader />
            </View>
        );
    }

    return (
        <>
            <AuthFields control={control} />

            <Button
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading}
            >
                {isLoading ? <Loader /> : isReg ? "Зарегистрироваться" : "Войти"}
            </Button>



            <View className="mt-4 flex-row items-center justify-center">
                <Text className="text-sm text-gray-500">
                    {!isReg ? "Нет аккаунта?" : "Уже есть аккаунт?"}
                </Text>
                <TouchableOpacity
                    onPress={() => setIsReg(!isReg)}
                    className="ml-2"
                >
                    <Text className="text-sm text-blue-600 font-medium">
                        {!isReg ? "Зарегистрироваться" : "Войти"}
                    </Text>
                </TouchableOpacity>
            </View>
        </>
    )
}
