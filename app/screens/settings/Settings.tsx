import { View, Text, Alert } from "react-native";
import { Button } from "@/shared";
import { useAuth } from "@/processes/auth";
import { AuthService } from "@/processes/auth/lib/api/AuthService";
import { useState } from "react";

export default function Settings() {
    const { user, setUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        Alert.alert(
            "Выход",
            "Вы уверены, что хотите выйти?",
            [
                {
                    text: "Отмена",
                    style: "cancel"
                },
                {
                    text: "Выйти",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const authService = new AuthService();
                            await authService.logout();
                            setUser(null);
                            // Navigation will automatically redirect to Auth screen
                        } catch (error) {
                            console.error('Logout error:', error);
                            Alert.alert("Ошибка", "Не удалось выйти из аккаунта");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <Text className="text-2xl font-bold mb-6">Настройки</Text>
            
            {user && (
                <View className="mb-6">
                    <Text className="text-gray-600 mb-2">Пользователь:</Text>
                    <Text className="text-lg font-semibold">{user.name}</Text>
                    <Text className="text-sm text-gray-500">{user.email}</Text>
                </View>
            )}

            <View className="mt-4">
                <Button 
                    onPress={handleLogout}
                    disabled={isLoading}
                >
                    {isLoading ? "Выход..." : "Выйти"}
                </Button>
            </View>
        </View>
    );
}
