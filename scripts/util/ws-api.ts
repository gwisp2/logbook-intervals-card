import { Connection, createConnection, createLongLivedTokenAuth, MessageBase } from 'home-assistant-js-websocket';

import './polyfill-ws';

const DEFAULT_TOKEN =
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA' +
  'wMDAwMDAwMCIsImlhdCI6MTY0MDk5NTIwMCwiZXhwIjoxOTU2MzU1MjAwfQ.JDh_0PKh4DufWnmgdsZEH' +
  '6zjZbnGWyRHSUlWxijAApI';

export interface WsApiBackend {
  connect(): Promise<void>;
  sendRequest(message: MessageBase): Promise<unknown>;
  close(): void;
}

// Backend that uses home-assistant-js-websocket to connect directly to Home Assistant server
export class SimpleWsApiBackend implements WsApiBackend {
  connection!: Connection;

  async connect(): Promise<void> {
    const auth = createLongLivedTokenAuth('http://localhost:8123', DEFAULT_TOKEN);
    this.connection = await createConnection({ auth });
  }

  sendRequest(message: MessageBase): Promise<unknown> {
    return this.connection.sendMessagePromise(message);
  }

  close(): void {
    this.connection.close();
  }
}

export class WsApi {
  backend: WsApiBackend | null;

  private constructor(backend: WsApiBackend) {
    this.backend = backend;
  }

  static async create(options: { backend?: WsApiBackend }): Promise<WsApi> {
    const backend = options.backend ?? new SimpleWsApiBackend();
    await backend.connect();
    return new WsApi(backend);
  }

  close(): void {
    this.backend?.close();
    this.backend = null;
  }

  async sendRequest(message: MessageBase): Promise<unknown> {
    if (this.backend === null) {
      throw new Error("Can't use closed WsApi");
    }
    return await this.backend.sendRequest(message);
  }

  async updateLovelaceConfig(uiConfig: unknown): Promise<void> {
    await this.sendRequest({
      type: 'lovelace/config/save',
      config: uiConfig,
      url_path: null,
    });
  }

  async updateLanguage(language: string): Promise<void> {
    await this.sendRequest({
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
