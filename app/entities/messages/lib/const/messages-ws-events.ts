/** Должно совпадать с apps/api messages-socket.constants.ts */
export const MessagesWsClientEvent = {
  SEND: 'message:send',
  CHAT_JOIN: 'chat:join',
  CHAT_LEAVE: 'chat:leave',
  MESSAGE_TYPING: 'message:typing',
} as const;

export const MessagesWsServerEvent = {
  NEW_MESSAGE: 'message:new',
  USER_TYPING: 'user:typing',
  CHAT_READ: 'message:chat-read',
} as const;
