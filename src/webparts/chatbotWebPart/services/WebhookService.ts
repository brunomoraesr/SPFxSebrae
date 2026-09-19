import { HttpClient, HttpClientResponse } from '@microsoft/sp-http';
import { IWebhookRequest, IWebhookSuccessResponse, IWebhookErrorResponse } from '../models/IChatModels';

const REQUEST_TIMEOUT_MS = 30000;
const GENERIC_ERROR_MESSAGE = 'Não foi possível obter uma resposta no momento. Tente novamente em instantes.';
const TIMEOUT_ERROR_MESSAGE = 'A resposta demorou demais e foi cancelada. Tente novamente.';
const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar ao serviço do chatbot. Verifique sua conexão e tente novamente.';

function isWebhookErrorResponse(value: unknown): value is IWebhookErrorResponse {
  return !!value && typeof (value as IWebhookErrorResponse).error === 'string';
}

function isWebhookSuccessResponse(value: unknown): value is IWebhookSuccessResponse {
  return !!value && typeof (value as IWebhookSuccessResponse).answer === 'string';
}

export async function sendChatMessage(
  httpClient: HttpClient,
  webhookUrl: string,
  request: IWebhookRequest
): Promise<IWebhookSuccessResponse> {
  const abortController: AbortController = new AbortController();
  const timeoutHandle: ReturnType<typeof setTimeout> = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);

  let response: HttpClientResponse;
  try {
    response = await httpClient.post(webhookUrl, HttpClient.configurations.v1, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request),
      signal: abortController.signal
    });
  } catch {
    if (abortController.signal.aborted) {
      throw new Error(TIMEOUT_ERROR_MESSAGE);
    }
    throw new Error(NETWORK_ERROR_MESSAGE);
  } finally {
    clearTimeout(timeoutHandle);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    if (isWebhookErrorResponse(body)) {
      throw new Error(body.error);
    }
    throw new Error(GENERIC_ERROR_MESSAGE);
  }

  if (isWebhookSuccessResponse(body)) {
    return body;
  }

  throw new Error(GENERIC_ERROR_MESSAGE);
}
