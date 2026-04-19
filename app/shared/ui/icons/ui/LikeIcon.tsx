'use client'
import React, { useState } from 'react'
import { EIconColor } from '../type/icon-type';
import { useTheme } from 'next-themes';


export default function LikeIcon({ isLiked }: { isLiked: boolean }) {
    const [isHovered, setIsHovered] = useState(false);
    const { theme } = useTheme()
    const iconColor = isHovered && !isLiked
        ? EIconColor.RED
        : isLiked
            ? EIconColor.LIGHT
            : !isLiked && theme?.includes('dark')
                ? EIconColor.RED
                : EIconColor.RED;

    return (

        <svg
            className='cursor-pointer  '
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            width="56" height="40" viewBox="0 0 56 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="56" height="40" rx="12" fill="bg-background" />
            <path d="M18 27.7477L33.0743 12.6735C33.9724 11.7755 35.4284 11.7755 36.3265 12.6735C37.2245 13.5716 37.2245 15.0276 36.3264 15.9257C36.2625 15.9896 36.1949 16.0497 36.124 16.1056L30.2373 20.7458M27.6253 18.1428L31.7142 22.2317C31.9094 22.427 31.9094 22.7436 31.7142 22.9388M31.7142 22.9388C31.7142 22.9388 31.7142 22.9388 31.7142 22.9388ZM31.7142 22.9388L29.8465 24.8065C25.7574 28.8956 20.4535 30.2216 18 27.7681M18 27.7699V27.7499"
                stroke={iconColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round" />
        </svg>




    )
}
