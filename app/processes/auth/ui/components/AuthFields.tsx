import { Control } from "react-hook-form";
import { IAuthFormData } from "../../type/auth.type";
import { Text, View } from "react-native";
import { Field } from "@/shared/";

export interface IAuthFields {

    control: Control<IAuthFormData>;

}



export const AuthFields = ({ control }: IAuthFields) => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
        <>
            <Field<IAuthFormData>
                control={control}
                name="email"
                placeholder="Email"
                rules={{
                    required: "Email is required",
                    pattern: {
                        value: validEmail,
                        message: "Invalid email address"
                    }


                }}
                keyboardType="email-address"
            />
            <Field<IAuthFormData> control={control}
                name="password"
                placeholder="Password"
                secureTextEntry={true}
                rules={{
                    required: "Password is required",
                    minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters long"
                    }
                }}
            />
            {/* <Field<IAuthFormData> control={control}
                name="confirmPassword"
                placeholder="Confirm Password"
                rules={{
                    required: "Confirm Password is required",
                    validate: (value) => {
                        if (value !== password) {
                            return "Passwords do not match";
                        }
                        return true;
                    },
                    minLength: {
                        value: 6,
                        message: "Password must match"
                    }

                }}

            /> */}
        </>

    )
}
