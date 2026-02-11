import { ProfileDto } from "@/api";
import { getProfile } from "@/api/generated/profile/profile";

const $api = getProfile();

export class ProfileService {
    constructor() { }

    static async getProfileByUserId(userId: string): Promise<ProfileDto> {
        const result = await $api.profileGetProfileByUserId(userId) as ProfileDto;
        debugger;
        return result;
    }

    static async getMyProfile(): Promise<ProfileDto> {
        return await $api.profileGetMyProfile() as ProfileDto;
    }
}
