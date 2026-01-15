import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Button, Loader } from "@/shared";


interface ILoginForm {
    email: string;
    password: string;
}

export const LoginForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validateForm = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = "Email обязателен";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Некорректный email";
        }

        if (!password) {
            newErrors.password = "Пароль обязателен";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        setError(null);

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // TODO: Implement login logic
            // const data: ILoginForm = { email, password };
            // await login(data);
            console.log("Login attempt:", { email, password });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For now, just show success
            Alert.alert("Успех", "Вход выполнен");
        } catch (err: any) {
            setError(err?.message || "Ошибка при входе");
        } finally {
            setIsLoading(false);
        }
    };

    const hasError = error || errors.email || errors.password;
    const errorMessage = error || errors.email || errors.password;

    return (
        <View className="gap-4">
            <View className="gap-2">
                <Text className="text-sm font-medium text-gray-700" nativeID="login-email-label">
                    Email
                </Text>
                <TextInput
                    nativeID="login-email"
                    className="h-10 px-3 border border-gray-300 rounded-md bg-white text-gray-900"
                    placeholder="your@email.com"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        if (errors.email) {
                            setErrors(prev => ({ ...prev, email: undefined }));
                        }
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    editable={!isLoading}
                />
            </View>

            <View className="gap-2">
                <Text className="text-sm font-medium text-gray-700" nativeID="login-password-label">
                    Пароль
                </Text>
                <View className="relative">
                    <TextInput
                        nativeID="login-password"
                        className="h-10 px-3 pr-10 border border-gray-300 rounded-md bg-white text-gray-900"
                        placeholder="Введите пароль"
                        placeholderTextColor="#9CA3AF"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) {
                                setErrors(prev => ({ ...prev, password: undefined }));
                            }
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoComplete="password"
                        textContentType="password"
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        className="absolute right-3"
                        style={{ top: 5, height: 40, justifyContent: 'center' }}
                        disabled={isLoading}
                    >
                        <Text className="text-gray-400 text-base">
                            {showPassword ? "👁️" : "👁️‍🗨️"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {hasError && (
                <View className="flex-row items-center p-3 bg-red-50 border border-red-200 rounded-md">
                    <Text className="text-red-600 mr-2">⚠️</Text>
                    <Text className="flex-1 text-sm text-red-600">
                        {errorMessage}
                    </Text>
                </View>
            )}
            {isLoading ? <Loader /> : <Button
             className={`  ${isLoading ? "bg-gray-400" : ""
             }`}
            onPress={handleSubmit}
            disabled={isLoading}>

                Войти
            </Button>}

            {/* <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                className={`w-full h-10 flex-row items-center justify-center rounded-md ${isLoading ? "bg-gray-400" : "bg-blue-600"
                    }`}
            >
                {isLoading ? (
                    <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-medium">Вход...</Text>
                    </View>
                ) : (
                    <View className="flex-row items-center">
                        <Text className="text-white font-medium mr-2">→</Text>
                        <Text className="text-white font-medium">Войти</Text>
                    </View>
                )}
            </TouchableOpacity> */}
        </View>
    );
};

