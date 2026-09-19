import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MessageBar, MessageBarType, Icon } from '@fluentui/react';
import styles from './ChatContainer.module.scss';
import { IChatbotWebPartProps } from './IChatbotWebPartProps';
import { IChatMessage } from '../models/IChatModels';
import { sendChatMessage } from '../services/WebhookService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatContainer: React.FunctionComponent<IChatbotWebPartProps> = (props: IChatbotWebPartProps) => {
  const { webhookUrl, chatTitle, displayMode, botAvatarUrl, chatWidth, chatHeight, userEmail, httpClient } = props;

  const sessionIdRef = React.useRef<string>(uuidv4());
  const [messages, setMessages] = React.useState<IChatMessage[]>([]);
  const [draft, setDraft] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isFloatingOpen, setIsFloatingOpen] = React.useState<boolean>(false);

  const onSend = async (): Promise<void> => {
    const question = draft.trim();
    if (!question || isLoading) {
      return;
    }

    const userMessage: IChatMessage = { id: uuidv4(), role: 'user', text: question };
    setMessages(previous => [...previous, userMessage]);
    setDraft('');
    setIsLoading(true);

    try {
      const result = await sendChatMessage(httpClient, webhookUrl, {
        question,
        sessionId: sessionIdRef.current,
        userEmail
      });

      const botMessage: IChatMessage = {
        id: uuidv4(),
        role: 'bot',
        text: result.answer,
        sources: result.sources
      };
      setMessages(previous => [...previous, botMessage]);
    } catch (err) {
      const errorMessage: IChatMessage = {
        id: uuidv4(),
        role: 'bot',
        text: err instanceof Error ? err.message : 'Ocorreu um erro inesperado.',
        isError: true
      };
      setMessages(previous => [...previous, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const chatContainerStyle: React.CSSProperties = displayMode === 'floating'
    ? { height: chatHeight }
    : { height: chatHeight, width: chatWidth };

  const renderChatPanel = (): React.ReactElement => {
    if (!webhookUrl) {
      return (
        <div className={styles.chatContainer} style={chatContainerStyle}>
          <MessageBar messageBarType={MessageBarType.warning}>
            Configure a URL do Webhook n8n nas propriedades do web part para habilitar o chat.
          </MessageBar>
        </div>
      );
    }

    return (
      <div className={styles.chatContainer} style={chatContainerStyle}>
        <div className={styles.header}>
          {botAvatarUrl && <img src={botAvatarUrl} alt="" className={styles.headerAvatar} />}
          <h2 className={styles.title}>{chatTitle}</h2>
        </div>
        <MessageList messages={messages} isLoading={isLoading} botAvatarUrl={botAvatarUrl} />
        <MessageInput value={draft} disabled={isLoading} onChange={setDraft} onSend={onSend} />
      </div>
    );
  };

  if (displayMode !== 'floating') {
    return renderChatPanel();
  }

  return (
    <div className={styles.floatingWrapper}>
      {isFloatingOpen && (
        <div className={styles.floatingPanel} style={{ width: chatWidth }}>{renderChatPanel()}</div>
      )}
      <div className={styles.floatingButtonContainer}>
        <button
          type="button"
          className={isFloatingOpen ? `${styles.floatingButton} ${styles.floatingButtonSmall}` : styles.floatingButton}
          title={isFloatingOpen ? 'Fechar chat' : chatTitle}
          aria-label={isFloatingOpen ? 'Fechar chat' : chatTitle}
          onClick={() => setIsFloatingOpen(previous => !previous)}
        >
          {isFloatingOpen ? (
            <Icon iconName="ChromeClose" />
          ) : botAvatarUrl ? (
            <img src={botAvatarUrl} alt="" className={styles.floatingButtonImage} />
          ) : (
            <Icon iconName="Chat" />
          )}
        </button>
        {!isFloatingOpen && <span className={styles.floatingBadge} />}
      </div>
    </div>
  );
};

export default ChatContainer;
