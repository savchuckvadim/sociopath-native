import { LoginDto, CreateUserDto, UserDto } from "@/api";


export interface IAuthFormData extends Pick<UserDto, 'email' | 'name'> {
    password: string;
    confirmPassword: string;
}


//TODO: удалить этот интерфейс
export interface IRegisterForm extends CreateUserDto {

    name: string;
    email: string;
    password: string;
    confirmPassword: string;


}
//TODO: удалить этот интерфейс
export interface ILoginForm extends LoginDto {

    email: string;
    password: string;

}

export interface IAuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    currentUser: UserDto | null;

}
