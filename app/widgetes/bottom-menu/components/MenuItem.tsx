import { Pressable, Text, View } from "react-native"

import { FC } from "react"
import type { TypeRootStackParamList } from "@/processes/navigation/interface/navigation.interface";
import {clsx} from "clsx"
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
    const badgeCount = typeof badge === 'number' ? badge : undefined;
    const badgeLabel =
        typeof badgeCount === 'number' && badgeCount > 0
            ? (badgeCount > 99 ? '99+' : String(badgeCount))
            : null;

    return (
        <Pressable
            onPress={() => navigate(item.path)}
            className={clsx(
                'flex-row items-center justify-center',
                'w-[20%]',
                'py-2 px-1',
                'rounded-lg',
            
            )}
        >
            <View className="relative">
                <Icon
                    name={item.icon}
                    size={24}
                    color={isActive ? colors.primary : '#6B7280'}
                    strokeWidth={isActive ? 2.5 : 2}
                />
                {hasBadge ? (
                    badgeLabel ? (
                        <View
                            className="absolute -top-2 -right-3 bg-red-500 rounded-full items-center justify-center px-1"
                            style={{ minWidth: 16, height: 16 }}
                        >
                            <Text className="text-[10px] font-semibold text-white">{badgeLabel}</Text>
                        </View>
                    ) : (
                        <View
                            className="absolute -top-1 -right-1 bg-red-500 rounded-full"
                            style={{
                                width: 8,
                                height: 8,
                                minWidth: 8,
                                minHeight: 8,
                            }}
                        />
                    )
                ) : null}
            </View>
        </Pressable>
    )
}
