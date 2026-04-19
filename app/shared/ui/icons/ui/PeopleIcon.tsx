'use client'
import { EIconColor } from '../type/icon-type';


interface PeopleIconProps {
    size?: number;
    color?: EIconColor;

}
export default function PeopleIcon({ size, color }: PeopleIconProps) {

    return (
        <svg
            // onMouseEnter={() => setIsHovered(true)}
            // onMouseLeave={() => setIsHovered(false)}
            width={`${size}px`} height={`${size}px`}
            className={`h-[${size}px] w-[${size}px]`}
            viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M8 14.58C6.5 14 6 13.5905 6 12.37C6 11.1494 6.89543 10.16 8 10.16L8.99994 10.1599M8 14.58C8 14.58 9.5 15 12 15C14.5 15 16 14.58 16 14.58M8 14.58H6C4.89543 14.58 4 15.5694 4 16.79C4 18.0105 4.89543 19 6 19C6 19 8.5 19.5 12 19.5C15.5 19.5 18 19 18 19C19.1046 19 20 18.0105 20 16.79C20 15.5694 19.1046 14.58 18 14.58H16M16 14.58C17.5 14 18 13.5905 18 12.37C18 11.1494 17.1046 10.16 16 10.16L14.9999 10.1599M14.9999 10.1599C14.9999 10.1599 15.9999 9.85954 15.9999 6.97098C15.9999 4.08242 12.9999 2.70619 13.4999 5.60432C14 8.50245 7.49997 6.97097 8.99994 10.1599M14.9999 10.1599C14.9999 10.1599 14 10.5 12 10.5C10 10.5 8.99994 10.1599 8.99994 10.1599"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round" />
        </svg>

    )
}
