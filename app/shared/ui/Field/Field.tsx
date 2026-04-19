import { JSX } from "react"
import { IField } from "./field.interface"
import { Controller } from "react-hook-form"
import { Text, TextInput, View } from "react-native"
import {clsx} from "clsx"


export const Field = <T extends Record<string, any>>({
    control,
    name,
    className,
    rules,
    ...rest

}: IField<T>): JSX.Element => {
    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            render={({
                field: { onChange, onBlur, value },
                fieldState: { error }
            }) =>
                <View
                    className={clsx(
                        "h-14 px-3 mb-6 border border-gray-300  bg-white text-gray-900 mb-3 rounded-[16px]",
                        error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-gray-300",
                        className
                    )}
                >
                    <TextInput
                        autoCapitalize="none"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={(value || "").toString()}
                        className={clsx(
                            "w-full h-full",
                            "text-gray-900",
                            "text-sm",
                            "text-black text-base"

                            // "font-light",

                        )}
                        placeholderTextColor={'#212121'}
                        {...rest}


                    />
                    {error && <Text className="text-red-500 text-sm">{error?.message as string || "Error"}</Text>}

                </View>
            }
        />
    )
}
