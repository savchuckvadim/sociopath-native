import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface ChatInputWidgetProps {
    messageText: string;
    onMessageTextChange: (text: string) => void;
    onSendMessage: () => void;
    isPending: boolean;
    onAudioCall?: () => void;
    onVideoCall?: () => void;
}

export const ChatInputWidget = ({
    messageText,
    onMessageTextChange,
    onSendMessage,
    isPending,
    onAudioCall,
    onVideoCall,
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
                        className="flex-shrink-0 w-10 h-10 rounded-full items-center justify-center bg-green-500"
                    >
                        <Feather name="phone" size={20} color="#fff" />
                    </TouchableOpacity>
                )}
                {onVideoCall && (
                    <TouchableOpacity
                        onPress={onVideoCall}
                        className="flex-shrink-0 w-10 h-10 rounded-full items-center justify-center bg-blue-500"
                    >
                        <Feather name="video" size={20} color="#fff" />
                    </TouchableOpacity>
                )}

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
                    <Feather
                        name="send"
                        size={20}
                        color={!messageText.trim() || isPending ? '#999' : '#fff'}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};
