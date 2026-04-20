import { Pressable, View } from "react-native"

import { FC } from "react"
import type { TypeRootStackParamList } from "@/processes/navigation/interface/navigation.interface";
import clsx from "clsx"
import { colors } from "@/shared/style/colors"
import { IMenuItem, TypeNavigate } from "../interface/menu-item.interface"
import { Icon } from "@/shared/ui/icons/Icon"

export interface IMenuItemProps {
    item: IMenuItem
    navigate: TypeNavigate
    currentPath: keyof TypeRootStackParamList
    badge?: number | boolean // Количество непрочитанных или просто наличие
}

export const MenuItem: FC<IMenuItemProps> = ({ item, navigate, currentPath, badge }) => {
    const isActive = currentPath === item.path;
    const hasBadge = badge !== undefined && badge !== false && badge !== 0;

    return (
        <Pressable
            onPress={() => navigate(item.path)}
            className={clsx(
                'flex-row items-center justify-center',
                'w-[20%]',
                'py-2 px-1',
                'rounded-lg',
                isActive && 'bg-gray-100'
            )}
        >
            <View className="relative">
                <Icon
                    name={item.icon}
                    size={24}
                    color={isActive ? colors.primary : '#6B7280'}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                {hasBadge && (
                    <View
                        className="absolute -top-1 -right-1 bg-red-500 rounded-full"
                        style={{
                            width: 8,
                            height: 8,
                            minWidth: 8,
                            minHeight: 8,
                        }}
                    />
                )}
            </View>
        </Pressable>
    )
}
