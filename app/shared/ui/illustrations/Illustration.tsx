import React from 'react';
import Svg, { G, Path, Defs, Mask, Rect, ClipPath } from 'react-native-svg';
import { View, ViewStyle } from 'react-native';
import { colors } from '../../style/colors';

export interface IllustrationProps {
    width?: number;
    height?: number;
    color?: string;
    opacity?: number;
    style?: ViewStyle;
}

/**
 * Базовый компонент для больших SVG иллюстраций
 * Используется для Empty, Error и других больших изображений
 */
export const Illustration: React.FC<IllustrationProps & { children: React.ReactNode }> = ({
    width = 198,
    height = 233,
    color = colors.dark,
    opacity = 0.5,
    style,
    children,
}) => {
    return (
        <View style={[{ width, height }, style]}>
            <Svg
                width={width}
                height={height}
                viewBox="0 0 198 233"
                preserveAspectRatio="xMidYMid meet"
            >
                {children}
            </Svg>
        </View>
    );
};
