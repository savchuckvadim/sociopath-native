import { useQuery } from "@tanstack/react-query";
import { ProfileService } from "../api/ProfileService";
import { ProfileDto } from "@/api";

export const useProfile = (userId: string) => {
    const { data: profile, isLoading, error } = useQuery<ProfileDto>({
        queryKey: ['profile', userId],
        queryFn: () => ProfileService.getProfileByUserId(userId),
        enabled: !!userId,
    });
    console.log(profile);
    return {
        profile,
        isLoading,
        error,
        posts: profile?.postsCount || 0,
        followers: profile?.followersCount || 0,
        following: profile?.followingCount || 0,
        slogan: profile?.about || '',
    };
};
