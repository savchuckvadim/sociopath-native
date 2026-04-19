import { TypeRootStackParamList } from "@/processes/navigation/interface/navigation.interface"
import { IconName } from "@/shared/ui/icons/icons-sprite"

export interface IMenuItem {
    name: string
    icon: IconName
    path: keyof TypeRootStackParamList
}


export type TypeNavigate = (path: keyof TypeRootStackParamList) => void
