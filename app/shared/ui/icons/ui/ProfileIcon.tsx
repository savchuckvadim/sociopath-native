'use client'
import React, { useState } from 'react'
import { EIconColor } from '../type/icon-type';
import { useTheme } from 'next-themes';


interface ProfileIconProps {
    size?: number;
    color?: EIconColor;
}
export default function ProfileIcon({ size, color = EIconColor.RED }: ProfileIconProps) {

    const [isHovered, setIsHovered] = useState(false);
    const { theme } = useTheme()
    const iconColor = isHovered ? EIconColor.RED : theme?.includes('dark') ? EIconColor.LIGHT : EIconColor.DARK;

    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M14.4749 4.52513C15.8417 5.89197 15.8417 8.10804 14.4749 9.47488C13.1081 10.8417 10.892 10.8417 9.52515 9.47488C8.15831 8.10804 8.15831 5.89197 9.52515 4.52513C10.892 3.15829 13.1081 3.15829 14.4749 4.52513Z"
                stroke={color || iconColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round" />
            <path
                d="M4 18.5V19.5C4 20.052 4.448 20.5 5 20.5H19C19.552 20.5 20 20.052 20 19.5V18.5C20 15.474 16.048 13.508 12 13.508C7.952 13.508 4 15.474 4 18.5Z"
                stroke={color || iconColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round" />
        </svg>

    )
}
