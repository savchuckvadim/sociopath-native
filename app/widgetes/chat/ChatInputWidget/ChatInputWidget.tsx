import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Phone, Video, Send } from 'lucide-react-native';
import { VideoCallInitButton } from './components/VideoCallInitButton';

interface ChatInputWidgetProps {
    chatId: string;
    otherUserId: string;
    messageText: string;
    onMessageTextChange: (text: string) => void;
    onSendMessage: () => void;
    isPending: boolean;
    onAudioCall?: () => void;
    // onVideoCall?: () => void;
}

export const ChatInputWidget = ({
    chatId,
    otherUserId,
    messageText,
    onMessageTextChange,
    onSendMessage,
    isPending,
    onAudioCall,
    // onVideoCall,
}: ChatInputWidgetProps) => {
    const handleSend = () => {
        if (messageText.trim() && !isPending) {
            onSendMessage();
        }
    };

    return (
        <View className="border-t p-4 bg-white flex-shrink-0">
            <View className="flex-row gap-2 items-center">
                {/* Кнопки звонков */}
                {onAudioCall && (
                    <TouchableOpacity
                        onPress={onAudioCall}
                        className="flex-shrink-0 w-10 h-10 rounded-full items-center justify-center bg-gray-100 border border-gray-300"
                    >
                        <Phone size={20} color="#000" />
                    </TouchableOpacity>
                )}
                {/* {onVideoCall && (
                    <TouchableOpacity
                        onPress={onVideoCall}
                        className="flex-shrink-0 w-10 h-10 rounded-full items-center justify-center bg-blue-500"
                    >
                        <Video size={20} color="#fff" />
                    </TouchableOpacity>
                )} */}
                <VideoCallInitButton chatId={chatId || ''} otherUserId={otherUserId || ''} />
                <TextInput
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 min-h-[40px] max-h-[120px]"
                    placeholder="Введите сообщение..."
                    value={messageText}
                    onChangeText={onMessageTextChange}
                    multiline
                    textAlignVertical="top"
                />
                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!messageText.trim() || isPending}
                    className={`flex-shrink-0 w-10 h-10 rounded-full items-center justify-center ${!messageText.trim() || isPending
                        ? 'bg-gray-300'
                        : 'bg-blue-500'
                        }`}
                >
                    <Send
                        size={20}
                        color={!messageText.trim() || isPending ? '#999' : '#fff'}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};
