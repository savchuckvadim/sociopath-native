import { useGlobalCallContext } from '@/entities/call';
import { Video } from 'lucide-react-native';
import { TouchableOpacity } from "react-native";

interface VideoCallInitButtonProps {
    chatId: string;
    otherUserId: string;
}

export const VideoCallInitButton = ({ chatId, otherUserId }: VideoCallInitButtonProps) => {
    const context = useGlobalCallContext();

    if (!context) {
        console.error('❌ [VideoCallInitButton] GlobalCallContext is not available');
        return null;
    }

    const { handleCallUser } = context;

    const handleClick = async () => {
        if (!otherUserId || !chatId) {
            console.warn('⚠️ [VideoCallInitButton] Missing otherUserId or chatId', { otherUserId, chatId });
            return;
        }

        if (!handleCallUser) {
            console.error('❌ [VideoCallInitButton] handleCallUser is not available');
            return;
        }

        try {
            await handleCallUser(otherUserId, chatId, 'VIDEO');
        } catch (error) {
            console.error('❌ [VideoCallInitButton] Error initiating call:', error);
        }
    };

    return (
        <TouchableOpacity
            onPress={handleClick}
            className="flex-shrink-0 w-10 h-10 rounded-full items-center justify-center bg-gray-100 border border-gray-300"
        >
            <Video size={20} color="#000" />
        </TouchableOpacity>
    );
};
