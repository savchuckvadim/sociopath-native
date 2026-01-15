import { Pressable, Text, View } from "react-native"
import { IMenuItem, TypeNavigate } from "../interface/IMenuItem"
import { FC } from "react"
import { TypeRootStackParamList } from "@/processes"
import clsx from "clsx"
import { Feather } from '@expo/vector-icons'
import { colors } from "@/shared/style/colors"

export interface IMenuItemProps {
    item: IMenuItem
    navigate: TypeNavigate
    currentPath: keyof TypeRootStackParamList
}
export const MenuItem: FC<IMenuItemProps> = ({ item, navigate, currentPath }) => {
    const isActive = currentPath === item.path;
    return (
        <Pressable
            onPress={() => navigate(item.path)}
            className={clsx(
                'flex-row items-center justify-center',
                'items-center',
                'w-[20%]',

            )}
        >
            <Feather
                name={item.icon}
                size={26}
                color={isActive ? colors.primary : 'black'}

            />
        </Pressable>
    )
}
