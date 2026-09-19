import { HttpClient } from '@microsoft/sp-http';

export type ChatDisplayMode = 'inline' | 'floating';

export interface IChatbotWebPartProps {
  webhookUrl: string;
  chatTitle: string;
  displayMode: ChatDisplayMode;
  botAvatarUrl: string;
  chatWidth: number;
  chatHeight: number;
  userEmail: string;
  httpClient: HttpClient;
}
