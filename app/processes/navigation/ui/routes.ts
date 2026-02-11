import Home from "@/screens/home/Home";
import Auth from "@/screens/auth/Auth";
import { IRoute } from "../interface/navigation.interface";
import { Chats, People, Me, Settings, ChatScreen, UserProfile } from "@/screens";
import Call from "@/entities/call/ui/Call";
// import Chats from "@/components/screens/chats/Chats";

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
