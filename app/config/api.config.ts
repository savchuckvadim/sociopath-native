import { isDev } from "@/shared/lib/utils/is-dev.util";

export const SERVER_URL = isDev() ? process.env.DEV_API_URL : process.env.PROD_API_URL;
export const API_URL = `${SERVER_URL}/api`;
export const SOCKET_URL = SERVER_URL;
export const LIVEKIT_URL = process.env.LIVEKIT_URL || 'undefined';
console.log('API_URL', API_URL);
console.log('LIVEKIT_URL', LIVEKIT_URL);
console.log('SERVER_URL', SERVER_URL);
console.log('SOCKET_URL', SOCKET_URL);
console.log('isDev', isDev());
