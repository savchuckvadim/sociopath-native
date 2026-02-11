import { TypeRootStackParamList } from "@/processes"
import { FC } from "react"
import { TypeNavigate } from "./interface/IMenuItem"
import { menuData } from "./interface/menu-data"
import { MenuItem } from "./components/MenuItem"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { View } from "react-native"
import { useUnreadCount } from "@/entities/messages/lib/hooks/useUnreadCount"

export interface IBottomMenuProps {
    navigate: TypeNavigate
    currentPath: keyof TypeRootStackParamList
}

export const BottomMenu: FC<IBottomMenuProps> = (props) => {
    const { bottom, top } = useSafeAreaInsets()
    const { hasUnread } = useUnreadCount()

    return (
        <View
            className="flex-row items-center justify-between bg-white"
            style={{
                paddingBottom: bottom + 10,
                paddingTop: 10

            }}>
            {
                menuData.map((item) => {
                    // Показываем бейдж только для Messages
                    const showBadge = item.path === 'Messages' && hasUnread;
                    return (
                        <MenuItem
                            key={item.path}
                            item={item}
                            {...props}
                            badge={showBadge}
                        />
                    )
                })
            }

        </View>
    )
}
