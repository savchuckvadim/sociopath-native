'use client'
import React, { useState } from 'react'
import { EIconColor } from '../type/icon-type';
import { useTheme } from 'next-themes';


export default function RepostIcon({ isActive }: { isActive: boolean }) {
    const [isHovered, setIsHovered] = useState(false);
    const {theme} = useTheme()
    const iconColor = isHovered || isActive ? EIconColor.RED : theme === 'dark' ? EIconColor.DARK : EIconColor.LIGHT;

    return (
        // <div
        //     className='cursor-pointer bg-gray-200 rounded-3xl p-2'
        //     onMouseEnter={() => setIsHovered(true)}
        //     onMouseLeave={() => setIsHovered(false)}
        // >

        <svg
            className='cursor-pointer'
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            width="56" height="40" viewBox="0 0 56 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="40" rx="12" fill="bg-background" />
            <path d="M27 22.329C31.594 22.329 35.499 24.692 37 28V26.993C37 20.977 32.579 16.07 27 15.702V11L19 19L27 27V22.333"
                stroke={iconColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
        // </div>
    )
}
