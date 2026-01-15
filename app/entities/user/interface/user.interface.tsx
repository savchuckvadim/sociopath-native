import { UserDto } from "@/api";

export interface IUser extends UserDto {

    id: string

    email: string

    name: string

    activationLink: string

    role: string

    isAcivated: boolean

}
