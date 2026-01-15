import { TypeRootStackParamList } from "@/processes/navigation/interface/navigation.interface"
import { TypeFeatherIconNames } from "@/shared/ui/Icon/IIcon"

export interface IMenuItem {
    name: string
    icon: TypeFeatherIconNames
    path: keyof TypeRootStackParamList
}


export type TypeNavigate = (path: keyof TypeRootStackParamList) => void
