import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { usePresence } from '@/entities/presence';

interface AvatarProps {
    src?: string | null;
    name?: string;
    size?: 'sm' | 'md' | 'lg';
    isOnline?: boolean; // Можно передать напрямую
    className?: string;
    userId?: string; // Для автоматического определения isOnline через usePresence
}

const sizeMap = {
    sm: { width: 32, height: 32, fontSize: 12 },
    md: { width: 48, height: 48, fontSize: 16 },
    lg: { width: 64, height: 64, fontSize: 20 },
};

const indicatorSizeMap = {
    sm: 8,
    md: 12,
    lg: 16,
};

export const Avatar: React.FC<AvatarProps> = ({
    src,
    name,
    size = 'md',
    isOnline: isOnlineProp,
    className,
    userId,
}) => {
    const { getIsUserOnline } = usePresence();
    const sizeStyle = sizeMap[size];
    const indicatorSize = indicatorSizeMap[size];
    const initials = name?.charAt(0)?.toUpperCase() || '?';

    // Если передан userId, используем usePresence для автоматического определения isOnline
    // Иначе используем переданный isOnline напрямую
    const isOnline = userId ? getIsUserOnline(userId) : isOnlineProp;

    return (
        <View style={[styles.container, { width: sizeStyle.width, height: sizeStyle.height }, className && {}]}>
            {src ? (
                <Image
                    source={{ uri: src }}
                    style={[styles.image, { width: sizeStyle.width, height: sizeStyle.height }]}
                    resizeMode="cover"
                />
            ) : (
                <View
                    style={[
                        styles.fallback,
                        {
                            width: sizeStyle.width,
                            height: sizeStyle.height,
                        },
                    ]}
                >
                    <Text style={[styles.initials, { fontSize: sizeStyle.fontSize }]}>
                        {initials}
                    </Text>
                </View>
            )}
            {(isOnline !== undefined || userId) && (
                <View
                    style={[
                        styles.indicator,
                        {
                            width: indicatorSize,
                            height: indicatorSize,
                            backgroundColor: isOnline ? '#F44848' : '#9CA3AF',
                        },
                    ]}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    image: {
        borderRadius: 9999,
    },
    fallback: {
        borderRadius: 9999,
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    indicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: 9999,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
});
