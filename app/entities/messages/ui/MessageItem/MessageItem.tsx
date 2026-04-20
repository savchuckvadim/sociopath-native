import { MessageType } from '../../lib/types/messages.types';
import { SystemMessageNotice } from '../SystemMessageNotice/SystemMessageNotice';
import { RegularMessageBubble } from './RegularMessageBubble';
import type { MessageItemProps } from './message-item.types';

export const MessageItem = (props: MessageItemProps) => {
  if (props.message.type === MessageType.SYSTEM) {
    return <SystemMessageNotice content={props.message.content} />;
  }
  return <RegularMessageBubble {...props} />;
};
