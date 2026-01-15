import { Control, FieldPath, FieldValues, Path, RegisterOptions } from "react-hook-form";
import { TextInputProps } from "react-native";

export interface IField<T extends FieldValues> extends Omit<TextInputProps, 'onChange' | 'onChangeText' | 'value'> {
    control: Control<T>;
    name: Path<T>;
    rules?: Omit<
        RegisterOptions<T, FieldPath<T>>,
        'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
    >;
}
