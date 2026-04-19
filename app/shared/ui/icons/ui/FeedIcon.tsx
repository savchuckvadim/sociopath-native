import React from 'react'
import { EIconColor } from '../type/icon-type';


interface FeedIconProps {
    size?: number;
    color?: EIconColor;

}
export default function FeedIcon({ size, color = EIconColor.DARK }: FeedIconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M17 8L19.0047 8.00476V8.00476C20.1075 8.00738 21 8.90204 21 10.0048V19C21 20.1046 20.1046 21 19 21V21C17.8954 21 17 20.1046 17 19V6C17 4.89543 16.1046 4 15 4H5H5C3.89543 4 3 4.89543 3 6V19V19C3 20.1046 3.89543 21 5 21H19"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round" />
            <path
                d="M13.5 17H6.5"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round" />
            <path
                d="M13.5 14H6.5"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round" />
            <path
                d="M13.2239 8H6.77614C6.62363 8 6.5 8.12363 6.5 8.27614V10.7239C6.5 10.8764 6.62363 11 6.77614 11H13.2239C13.3764 11 13.5 10.8764 13.5 10.7239V8.27614C13.5 8.12363 13.3764 8 13.2239 8Z"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round" />
        </svg>


    )
}
