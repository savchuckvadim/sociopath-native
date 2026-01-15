import { UserDto } from "@/api";
import { getUser } from "@/api/generated/user/user";

const $api = getUser();

export class UserService {

    constructor() { }

    static async getUser(id: string): Promise<UserDto> {
        return await $api.userGetUser(id) as UserDto;
    }

    static async getAllUsers(): Promise<UserDto[]> {
        return await $api.userGetAllUsers() as UserDto[];
    }
}
