import type { Message } from '../../lib/types/messages.types';

export interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onRetryFailed?: (tempMessageId: string) => void;
}
