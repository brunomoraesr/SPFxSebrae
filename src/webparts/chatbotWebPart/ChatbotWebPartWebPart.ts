import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
  PropertyPaneChoiceGroup,
  PropertyPaneSlider
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { HttpClient } from '@microsoft/sp-http';

import * as strings from 'ChatbotWebPartWebPartStrings';
import ChatContainer from './components/ChatContainer';
import { IChatbotWebPartProps, ChatDisplayMode } from './components/IChatbotWebPartProps';

export interface IChatbotWebPartWebPartProps {
  webhookUrl: string;
  chatTitle: string;
  displayMode: ChatDisplayMode;
  botAvatarUrl: string;
  chatWidth: number;
  chatHeight: number;
}

const DEFAULT_CHAT_TITLE = 'Assistente de Documentos';
const DEFAULT_DISPLAY_MODE: ChatDisplayMode = 'inline';
const DEFAULT_CHAT_WIDTH = 360;
const DEFAULT_CHAT_HEIGHT = 650;

export default class ChatbotWebPartWebPart extends BaseClientSideWebPart<IChatbotWebPartWebPartProps> {

  public render(): void {
    const element: React.ReactElement<IChatbotWebPartProps> = React.createElement(
      ChatContainer,
      {
        webhookUrl: this.properties.webhookUrl,
        chatTitle: this.properties.chatTitle || DEFAULT_CHAT_TITLE,
        displayMode: this.properties.displayMode || DEFAULT_DISPLAY_MODE,
        botAvatarUrl: this.properties.botAvatarUrl,
        chatWidth: this.properties.chatWidth || DEFAULT_CHAT_WIDTH,
        chatHeight: this.properties.chatHeight || DEFAULT_CHAT_HEIGHT,
        userEmail: this.context.pageContext.user.email,
        httpClient: this.context.httpClient as HttpClient
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  private _validateWebhookUrl(value: string): string {
    if (!value) {
      return strings.WebhookUrlRequiredError;
    }

    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return strings.WebhookUrlInvalidError;
      }
    } catch {
      return strings.WebhookUrlInvalidError;
    }

    return '';
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('webhookUrl', {
                  label: strings.WebhookUrlFieldLabel,
                  description: strings.WebhookUrlFieldDescription,
                  onGetErrorMessage: this._validateWebhookUrl.bind(this)
                }),
                PropertyPaneTextField('chatTitle', {
                  label: strings.ChatTitleFieldLabel,
                  placeholder: DEFAULT_CHAT_TITLE
                }),
                PropertyPaneChoiceGroup('displayMode', {
                  label: strings.DisplayModeFieldLabel,
                  options: [
                    { key: 'inline', text: strings.DisplayModeInlineOption },
                    { key: 'floating', text: strings.DisplayModeFloatingOption }
                  ]
                }),
                PropertyPaneTextField('botAvatarUrl', {
                  label: strings.BotAvatarUrlFieldLabel,
                  description: strings.BotAvatarUrlFieldDescription
                }),
                PropertyPaneSlider('chatWidth', {
                  label: strings.ChatWidthFieldLabel,
                  min: 280,
                  max: 800,
                  step: 10,
                  value: DEFAULT_CHAT_WIDTH
                }),
                PropertyPaneSlider('chatHeight', {
                  label: strings.ChatHeightFieldLabel,
                  min: 350,
                  max: 900,
                  step: 10,
                  value: DEFAULT_CHAT_HEIGHT
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
