import { useEffect, useState } from 'react';
import type { Message } from '../../lib/types/messages.types';
import {
  decryptSignalMessageContentSerialized,
  ensureLocalSignalDeviceRegistered,
} from '@/entities/encryption/lib/messenger-e2ee';
import { getLocalMessengerServerDeviceId } from '@/entities/encryption/lib/messenger-device-meta';
import { getIncomingPlaintext, rememberIncomingPlaintext } from '@/entities/encryption/lib/signal-incoming-plaintext-cache';
import { getSentPlaintext } from '@/entities/encryption/lib/signal-sent-plaintext-cache';
import {
  isIncomingForOtherDeviceSync,
  isOutgoingPending,
  isOwnUndisplayableEncrypted,
} from '../../lib/utils/message-item-display.util';

export function useMessageBubbleDisplay(message: Message, isOwn: boolean) {
  const [displayContent, setDisplayContent] = useState(message.content);
  const [hideIncomingWrongDevice, setHideIncomingWrongDevice] = useState(false);

  const hideOwnElsewhere = isOwnUndisplayableEncrypted(message, isOwn);
  const hideIncomingOtherDeviceSync = isIncomingForOtherDeviceSync(message, isOwn);
  const hidden = hideOwnElsewhere || hideIncomingOtherDeviceSync || hideIncomingWrongDevice;

  useEffect(() => {
    setHideIncomingWrongDevice(false);
  }, [message.id]);

  useEffect(() => {
    let cancelled = false;
    if (!message.isEncrypted) {
      setDisplayContent(message.content);
      return;
    }
    if (!message.senderClientDeviceId) {
      setDisplayContent('[E2EE: нет метаданных устройства отправителя]');
      return;
    }
    if (message.isEncrypted && isOwn && !getSentPlaintext(message.id)) {
      return;
    }
    const localId = getLocalMessengerServerDeviceId();
    if (!isOwn && message.toDeviceId && localId && message.toDeviceId !== localId) {
      return;
    }
    if (isOwn) {
      const cached = getSentPlaintext(message.id);
      if (cached) {
        setDisplayContent(cached);
      }
      return;
    }
    const cachedIncoming = getIncomingPlaintext(message.id);
    if (cachedIncoming) {
      setDisplayContent(cachedIncoming);
      return;
    }
    void (async () => {
      try {
        const { serverDeviceId } = await ensureLocalSignalDeviceRegistered();
        if (cancelled) return;
        if (message.toDeviceId && serverDeviceId !== message.toDeviceId) {
          setHideIncomingWrongDevice(true);
          return;
        }
        const text = await decryptSignalMessageContentSerialized({
          senderId: message.senderId,
          senderClientDeviceId: message.senderClientDeviceId,
          content: message.content,
          signalMessageType: message.signalMessageType,
        });
        if (!cancelled) {
          rememberIncomingPlaintext(message.id, text);
          setDisplayContent(text);
        }
      } catch {
        if (!cancelled) {
          // Message belongs to another device/session chain: don't show decrypt-error stub in UI.
          setHideIncomingWrongDevice(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    message.id,
    message.content,
    message.isEncrypted,
    message.senderClientDeviceId,
    message.signalMessageType,
    message.senderId,
    message.toDeviceId,
    isOwn,
  ]);

  const readByPeer =
    isOwn && Boolean(message.readBy?.some((id) => id !== message.senderId));

  const pending = isOwn && isOutgoingPending(message, message._clientStatus);
  const failed = message._clientStatus === 'failed';
  const showDeliveryTicks =
    isOwn && !failed && !pending && !message.id.startsWith('temp-');

  return {
    hidden,
    displayContent,
    readByPeer,
    pending,
    failed,
    showDeliveryTicks,
  };
}
