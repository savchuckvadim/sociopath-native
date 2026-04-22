import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { IconName, iconDefinitions, PathDefinition } from './icons-sprite';
import { EIconColor } from './type/icon-type';

export interface IconProps {
    name: IconName;
    size?: number;
    color?: string | EIconColor;
    strokeWidth?: number;
}

export const Icon: React.FC<IconProps> = ({
    name,
    size = 24,
    color = EIconColor.DARK,
    strokeWidth,
}) => {
    const iconDef = iconDefinitions[name];

    if (!iconDef) {
        console.warn(`Icon "${name}" not found`);
        return null;
    }

    const {
        viewBox,
        paths,
        defaultStrokeWidth = 1.5,
        defaultColor,
    } = iconDef;

    const finalColor = color || defaultColor || EIconColor.DARK;
    const finalStrokeWidth = strokeWidth || defaultStrokeWidth;

    return (
        <Svg
            width={size}
            height={size}
            viewBox={viewBox}
            fill="none"
        >
            {paths.map((pathDef: PathDefinition, index: number) => {
                if (typeof pathDef === 'string') {
                    return (
                        <Path
                            key={index}
                            d={pathDef}
                            stroke={finalColor}
                            strokeWidth={finalStrokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    );
                }

                // Handle complex path objects
                const {
                    d,
                    fill,
                    stroke = finalColor,
                    strokeWidth: pathStrokeWidth = finalStrokeWidth,
                    fillRule,
                    clipRule,
                    opacity,
                    ...rest
                } = pathDef;

                if (fill) {
                    return (
                        <Path
                            key={index}
                            d={d}
                            fill={fill === true ? finalColor : fill}
                            fillRule={fillRule}
                            clipRule={clipRule}
                            opacity={opacity}
                            {...rest}
                        />
                    );
                }

                return (
                    <Path
                        key={index}
                        d={d}
                        stroke={stroke}
                        strokeWidth={pathStrokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={opacity}
                        {...rest}
                    />
                );
            })}
        </Svg>
    );
};
