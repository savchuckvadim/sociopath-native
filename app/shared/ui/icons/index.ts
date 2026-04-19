// Новый универсальный компонент Icon
export { Icon } from './Icon';
export type { IconProps } from './Icon';

// Экспорт спрайта
export type { IconName, PathDefinition, IconDefinition } from './icons-sprite';
export { iconDefinitions } from './icons-sprite';

// Экспорт типов и констант
export { EIconColor } from './type/icon-type';

// Старые компоненты (для обратной совместимости)
export { default as FeedIcon } from './ui/FeedIcon';
export { default as MessageIcon } from './ui/MessageIcon';
export { default as PeopleIcon } from './ui/PeopleIcon';
export { default as ProfileIcon } from './ui/ProfileIcon';
export { default as LogoIcon } from './ui/LogoIcon';
export { default as LikeIcon } from './ui/LikeIcon';
export { default as EyeIcon } from './ui/EyeIcon';
export { default as RepostIcon } from './ui/RepostIcon';
export { default as EmptyIcon } from './ui/EmptyIcon';
