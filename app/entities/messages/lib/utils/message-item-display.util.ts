import type { ClientOutgoingStatus, Message } from '../types/messages.types';
import { getLocalMessengerServerDeviceId } from '@/entities/encryption/lib/messenger-device-meta';
import { getSentPlaintext } from '@/entities/encryption/lib/signal-sent-plaintext-cache';

export function isOwnUndisplayableEncrypted(message: Message, isOwn: boolean): boolean {
  return Boolean(message.isEncrypted) && isOwn && !getSentPlaintext(message.id);
}

export function isIncomingForOtherDeviceSync(message: Message, isOwn: boolean): boolean {
  if (!message.isEncrypted || isOwn || !message.toDeviceId) return false;
  const localId = getLocalMessengerServerDeviceId();
  return Boolean(localId) && localId !== message.toDeviceId;
}

export function isOutgoingPending(
  message: Message,
  status: ClientOutgoingStatus | undefined,
): boolean {
  if (status === 'failed') return false;
  if (status === 'sending') return true;
  return message.id.startsWith('temp-') && status !== 'failed';
}
