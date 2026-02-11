import { TypeRootStackParamList } from "@/processes/navigation/interface/navigation.interface"
import { LucideIcon } from "lucide-react-native"

export interface IMenuItem {
    name: string
    icon: LucideIcon
    path: keyof TypeRootStackParamList
}


export type TypeNavigate = (path: keyof TypeRootStackParamList) => void
