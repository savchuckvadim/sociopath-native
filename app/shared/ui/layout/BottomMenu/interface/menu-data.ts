import { IMenuItem } from "./IMenuItem";
import { User, Users, MessageSquare, Settings, Home } from "lucide-react-native";

export const menuData: IMenuItem[] = [
    // {
    //     name: 'Home',
    //     icon: Home,
    //     path: 'Home',
    // },

    {
        name: 'Me',
        icon: User,
        path: 'Me',
    },
    {
        name: 'People',
        icon: Users,
        path: 'People',
    },
    {
        name: 'Messages',
        icon: MessageSquare,
        path: 'Messages',
    },
    {
        name: 'Settings',
        icon: Settings,
        path: 'Settings',
    },
]
