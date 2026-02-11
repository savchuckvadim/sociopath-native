import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "@/processes";
import { useTypedNavigation } from "@/hooks/typed-navigation.hook";
import { colors } from "@/shared/style/colors";

export const CurrentUser = () => {
    const { user } = useAuth();
    const navigation = useTypedNavigation();

    const handlePress = () => {
        navigation.navigate('Me');
    };

    if (!user?.name) {
        return null;
    }

    return (
        <TouchableOpacity onPress={handlePress}>
            <Text style={styles.text}>{user.name}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    text: {
        fontSize: 14,
        color: colors.primary,
    },
});
