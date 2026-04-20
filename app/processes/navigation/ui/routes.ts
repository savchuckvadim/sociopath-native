import { IRoute } from "../interface/navigation.interface";
import Me from "@/screens/me/Me";
import People from "@/screens/people/People";
import Settings from "@/screens/settings/Settings";
import UserProfile from "@/screens/user-profile/UserProfile";
import Call from "@/entities/call/ui/Call";
import Chats from "@/screens/chats/Chats";
import { ChatScreen } from "@/screens";

export const routes: IRoute[] = [
    // {
    //     name: 'Home',
    //     component: Home,
    // },
    {
        name: 'Me',
        component: Me,
    },
    {
        name: 'Messages',
        component: Chats,
    },
    {
        name: 'Chat',
        component: ChatScreen,
    },
    {
        name: 'Call',
        component: Call,
    },
    {
        name: 'People',
        component: People,
    },
    {
        name: 'UserProfile',
        component: UserProfile,
    },
    {
        name: 'Settings',
        component: Settings,
    },
];
