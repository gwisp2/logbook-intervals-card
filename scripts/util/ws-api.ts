import { Connection, createConnection, createLongLivedTokenAuth } from 'home-assistant-js-websocket';

import './polyfill-ws';

const DEFAULT_TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA' +
  'wMDAwMDAwMCIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxOTU2MzU1MjAwfQ.JDh_0PKh4DufWnmgdsZEH' +
  '6zjZbnGWyRHSUlWxijAApI';

export class WsApi {
  connection!: Connection;

  static async create(): Promise<WsApi> {
    const wsApi = new WsApi();
    await wsApi.connect();
    return wsApi;
  }

  async connect(): Promise<void> {
    const auth = createLongLivedTokenAuth('http://localhost:8123', DEFAULT_TOKEN);
    this.connection = await createConnection({ auth });
  }

  close(): void {
    this.connection.close();
  }

  async updateLovelaceConfig(uiConfig: unknown): Promise<void> {
    await this.connection.sendMessagePromise({
      type: 'lovelace/config/save',
      config: uiConfig,
      url_path: null,
    });
  }

  async updateLanguage(language: string): Promise<void> {
    await this.connection.sendMessagePromise({
      type: 'frontend/set_user_data',
      key: 'language',
      value: {
        language: language,
        number_format: 'language',
        time_format: 'language',
      },
    });
  }
}
