import * as React from 'react';
import { Stack, TextField, PrimaryButton } from '@fluentui/react';
import styles from './ChatContainer.module.scss';

export interface IMessageInputProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

const MessageInput: React.FunctionComponent<IMessageInputProps> = (props: IMessageInputProps) => {
  const { value, disabled, onChange, onSend } = props;

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim().length > 0) {
        onSend();
      }
    }
  };

  return (
    <Stack horizontal verticalAlign="end" tokens={{ childrenGap: 8 }} className={styles.messageInput}>
      <Stack.Item grow>
        <TextField
          multiline
          autoAdjustHeight
          resizable={false}
          placeholder="Digite sua pergunta..."
          value={value}
          disabled={disabled}
          onChange={(_event, newValue) => onChange(newValue || '')}
          onKeyDown={onKeyDown}
          rows={1}
        />
      </Stack.Item>
      <PrimaryButton
        text="Enviar"
        disabled={disabled || value.trim().length === 0}
        onClick={onSend}
      />
    </Stack>
  );
};

export default MessageInput;
