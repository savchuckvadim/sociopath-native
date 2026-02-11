import { RefObject } from 'react';
import { ScrollView } from 'react-native';

export const scrollToBottom = (messagesEndRef: RefObject<ScrollView | null>) => {
    if (messagesEndRef.current) {
        setTimeout(() => {
            messagesEndRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }
};
