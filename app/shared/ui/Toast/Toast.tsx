import { FC } from "react"
import { colors } from "../../style/colors"
import { View } from "react-native"
import { Text } from "react-native"
import RnToast, { BaseToast, BaseToastProps, ToastConfigParams } from "react-native-toast-message"

const options = (primaryColor: string = colors.primary, secondaryColor: string = colors.secondary): BaseToastProps => {
    return {
        style: {
            borderRadius: 10,
            padding: 10,
            backgroundColor: primaryColor,
            borderLeftColor: secondaryColor,
            borderLeftWidth: 10,
        },
        text1Style: {
            fontSize: 16,
            fontWeight: "bold",
            color: colors.septenary,
        },
        text2Style: {
            fontSize: 14,
            color: colors.septenary,
        },
    }
}
export const Toast: FC = () => {
    return (
        <RnToast
            config={{
                success: (params: ToastConfigParams<any>) => <BaseToast {...params} {...options(colors.primary, colors.secondary)} />,
                error: (params: ToastConfigParams<any>) => <BaseToast {...params} {...options(colors.primary, colors.secondary)} />,
                warning: (params: ToastConfigParams<any>) => <BaseToast {...params} {...options(colors.primary, colors.secondary)} />,
                info: (params: ToastConfigParams<any>) => <BaseToast {...params} {...options(colors.primary, colors.secondary)} />,
            }}
            visibilityTime={3000}
            topOffset={50}
            bottomOffset={0}
            onPress={() => RnToast.hide()}
        />
    )
}
