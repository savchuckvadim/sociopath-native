import { TypeRootStackParamList } from "@/processes/navigation/interface/navigation.interface";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";

export const useTypedNavigation = () => {
    const navigation = useNavigation<NavigationProp<TypeRootStackParamList>>();
    return navigation;
}
