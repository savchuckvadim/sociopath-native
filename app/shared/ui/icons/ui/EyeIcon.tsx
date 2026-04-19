import { useTheme } from 'next-themes';
import React from 'react'
import { EIconColor } from '../type/icon-type';

export default function EyeIcon() {
    const {theme} = useTheme()
    const iconColor = theme === 'dark' ? EIconColor.DARK : EIconColor.LIGHT;
    return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M14.122 9.87999C15.293 11.051 15.293 12.952 14.122 14.125C12.951 15.296 11.05 15.296 9.877 14.125C8.706 12.954 8.706 11.053 9.877 9.87999C11.05 8.70699 12.95 8.70699 14.122 9.87999Z"
                stroke={iconColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round" />
            <path
                d="M2 12C2 11 5 5 12 5C19 5 22 11 22 12C22 13 19 19 12 19C5 19 2 13 2 12Z"
                stroke={iconColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round" />
        </svg>

    )
}
