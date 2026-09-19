// Contrato da API do webhook n8n. Não adicionar campos sem alinhar com o backend.

export interface IWebhookRequest {
  question: string;
  sessionId: string;
  userEmail: string;
}

export interface ISource {
  name: string;
  url: string;
}

export interface IWebhookSuccessResponse {
  answer: string;
  sources?: ISource[];
}

export interface IWebhookErrorResponse {
  error: string;
}

export type ChatRole = 'user' | 'bot';

export interface IChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  sources?: ISource[];
  isError?: boolean;
}
