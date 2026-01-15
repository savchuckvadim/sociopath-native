import { FC, PropsWithChildren } from "react"
import { IButtonProps } from "./button.interface"
import { Pressable, Text } from "react-native"
import clsx from "clsx"
import { colors } from "@/shared/"

export const Button: FC<PropsWithChildren<IButtonProps>> = ({
    children,
    className,
    ...rest
}) => {

    return (
        <Pressable
            className={
                clsx(
                    'self-center',
                    'rounded-lg',
                    'w-full',
                    'font-light py-3',
                    `bg-[#F44848]`,
                    className
                )
            }
            {...rest}

            >
            <Text className={
                clsx(
                    "text-white font-medium",
                    'text-center',

                )
            }>{children}</Text>
        </Pressable>
    )
}
