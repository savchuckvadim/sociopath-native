import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";

interface IRegisterForm {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export const RegisterForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});

    const validateForm = (): boolean => {
        const newErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};

        if (!name) {
            newErrors.name = "Имя обязательно";
        }

        if (!email) {
            newErrors.email = "Email обязателен";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Некорректный email";
        }

        if (!password) {
            newErrors.password = "Пароль обязателен";
        } else if (password.length < 6) {
            newErrors.password = "Пароль должен быть не менее 6 символов";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Подтвердите пароль";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Пароли не совпадают";
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
            // TODO: Implement registration logic
            // const data: IRegisterForm = { name, email, password, confirmPassword };
            // await registerUser(data);
            console.log("Registration attempt:", { name, email, password });

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // For now, just show success
            Alert.alert("Успех", "Регистрация выполнена");
        } catch (err: any) {
            setError(err?.message || "Ошибка при регистрации");
        } finally {
            setIsLoading(false);
        }
    };

    const hasError = error || errors.name || errors.email || errors.password || errors.confirmPassword;
    const errorMessage = error || errors.name || errors.email || errors.password || errors.confirmPassword;

    return (
        <View className="gap-4">
            <View className="gap-2">
                <Text className="text-sm font-medium text-gray-700" nativeID="register-name-label">
                    Имя
                </Text>
                <TextInput
                    nativeID="register-name"
                    className="h-10 px-3 border border-gray-300 rounded-md bg-white text-gray-900"
                    placeholder="Имя"
                    placeholderTextColor="#9CA3AF"
                    value={name}
                    onChangeText={(text) => {
                        setName(text);
                        if (errors.name) {
                            setErrors(prev => ({ ...prev, name: undefined }));
                        }
                    }}
                    autoCapitalize="words"
                    editable={!isLoading}
                />
            </View>

            <View className="gap-2">
                <Text className="text-sm font-medium text-gray-700" nativeID="register-email-label">
                    Email
                </Text>
                <TextInput
                    nativeID="register-email"
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
                <Text className="text-sm font-medium text-gray-700" nativeID="register-password-label">
                    Пароль
                </Text>
                <View className="relative">
                    <TextInput
                        nativeID="register-password"
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

            <View className="gap-2">
                <Text className="text-sm font-medium text-gray-700" nativeID="register-confirm-label">
                    Подтвердите пароль
                </Text>
                <TextInput
                    nativeID="register-confirm"
                    className="h-10 px-3 border border-gray-300 rounded-md bg-white text-gray-900"
                    placeholder="Подтвердите пароль"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (errors.confirmPassword) {
                            setErrors(prev => ({ ...prev, confirmPassword: undefined }));
                        }
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    editable={!isLoading}
                />
            </View>

            {hasError && (
                <View className="flex-row items-center p-3 bg-red-50 border border-red-200 rounded-md">
                    <Text className="text-red-600 mr-2">⚠️</Text>
                    <Text className="flex-1 text-sm text-red-600">
                        {errorMessage}
                    </Text>
                </View>
            )}

            <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                className={`w-full h-10 flex-row items-center justify-center rounded-md ${isLoading ? "bg-gray-400" : "bg-gray-900"
                    }`}
            >
                {isLoading ? (
                    <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white font-medium">Регистрация...</Text>
                    </View>
                ) : (
                    <View className="flex-row items-center">
                        <Text className="text-white font-medium mr-2">+</Text>
                        <Text className="text-white font-medium">Зарегистрироваться</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

