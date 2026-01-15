import Home from "@/screens/home/Home";
import Auth from "@/screens/auth/Auth";
import { IRoute } from "../interface/navigation.interface";
import { Chats } from "@/screens";
// import Chats from "@/components/screens/chats/Chats";

export const routes: IRoute[] = [
    // {
    //     name: 'Auth',
    //     component: Auth,
    // },
    {
        name: 'Home',
        component: Home,
    },
    {
        name: 'Messages',
        component: Chats,
    },
    {
        name: 'Profile',
        component: Chats,
    },
    {
        name: 'Settings',
        component: Chats,
    },
];
