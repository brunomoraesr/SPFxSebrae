import * as React from 'react';
import Markdown from 'markdown-to-jsx';
import { Spinner, SpinnerSize } from '@fluentui/react';
import styles from './ChatContainer.module.scss';
import { IChatMessage } from '../models/IChatModels';
import SourcesFooter from './SourcesFooter';

export interface IMessageListProps {
  messages: IChatMessage[];
  isLoading: boolean;
  botAvatarUrl?: string;
}

// O Claude separa linhas com uma única quebra, mas markdown padrão só quebra
// visualmente com linha em branco (\n\n) — sem isso, tudo aparece colado.
function normalizeMarkdownLineBreaks(text: string): string {
  return text.replace(/\n(?!\n)/g, '\n\n');
}

const MessageBubble: React.FunctionComponent<{ message: IChatMessage; botAvatarUrl?: string }> = ({ message, botAvatarUrl }) => {
  const isUser = message.role === 'user';
  const bubbleClassName = [
    styles.bubble,
    isUser ? styles.bubbleUser : styles.bubbleBot,
    message.isError ? styles.bubbleError : ''
  ].join(' ').trim();

  const bubble = (
    <div className={bubbleClassName}>
      {isUser ? (
        <span>{message.text}</span>
      ) : (
        <div className={styles.markdown}>
          <Markdown options={{ forceBlock: true }}>{normalizeMarkdownLineBreaks(message.text)}</Markdown>
        </div>
      )}
      {!isUser && message.sources && message.sources.length > 0 && (
        <SourcesFooter sources={message.sources} />
      )}
    </div>
  );

  if (isUser || !botAvatarUrl) {
    return bubble;
  }

  return (
    <div className={styles.botRow}>
      <img src={botAvatarUrl} alt="" className={styles.messageAvatar} />
      {bubble}
    </div>
  );
};

const MessageList: React.FunctionComponent<IMessageListProps> = (props: IMessageListProps) => {
  const { messages, isLoading, botAvatarUrl } = props;
  const endOfListRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (endOfListRef.current) {
      endOfListRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages.length, isLoading]);

  return (
    <div className={styles.messageList}>
      {messages.map(message => (
        <MessageBubble key={message.id} message={message} botAvatarUrl={botAvatarUrl} />
      ))}
      {isLoading && (
        <div className={botAvatarUrl ? styles.botRow : undefined}>
          {botAvatarUrl && <img src={botAvatarUrl} alt="" className={styles.messageAvatar} />}
          <div className={`${styles.bubble} ${styles.bubbleBot}`}>
            <Spinner size={SpinnerSize.small} label="Pensando..." labelPosition="right" />
          </div>
        </div>
      )}
      <div ref={endOfListRef} />
    </div>
  );
};

export default MessageList;
