import { Connection, MessageBase } from 'home-assistant-js-websocket';
import playwright, { devices } from 'playwright';

import { WsApi, WsApiBackend } from './ws-api';

export interface HaBrowserOptions {
  url: string;
  credentials: {
    username: string;
    password: string;
  };
  viewport: {
    width: number;
    height: number;
  };
}

export class HaBrowser {
  private options: HaBrowserOptions;
  private browser!: playwright.Browser;
  private browserContext!: playwright.BrowserContext;
  private page!: playwright.Page;

  constructor(options: Partial<HaBrowserOptions>) {
    this.options = {
      url: 'http://localhost:8123',
      credentials: {
        username: 'dev',
        password: 'dev',
      },
      viewport: {
        width: 1280,
        height: 720,
      },
      ...options,
    };
  }

  async init(): Promise<void> {
    this.browser = await playwright.chromium.launch();
    this.browserContext = await this.browser.newContext({
      ...devices['Desktop Chrome'],
      viewport: {
        width: this.options.viewport.width,
        height: this.options.viewport.height,
      },
    });
    this.page = await this.browserContext.newPage();
    await this.login();
  }

  async makeCardScreenshot(
    cardSelector: string,
    options: { path?: string; includeCardMargin?: boolean },
  ): Promise<Buffer> {
    const cardElement = await this.page.locator(cardSelector).elementHandle();
    if (cardElement === null) {
      throw Error('elementHandle() returned null');
    }
    const boundingBox = await cardElement.boundingBox();
    if (boundingBox === null) {
      throw Error('boundingBox is null, element became hidden?');
    }
    if (options.includeCardMargin ?? true) {
      boundingBox.x -= 4;
      boundingBox.y -= 4;
      boundingBox.width += 8;
      boundingBox.height += 8;
    }
    return await this.page.screenshot({ path: options.path, clip: boundingBox });
  }

  async sendWsMessage(message: { type: string; [key: string]: unknown }): Promise<unknown> {
    const result: { success: unknown } | { error: unknown } = await this.page.evaluate(async (message) => {
      try {
        const w = window as unknown as { hassConnection: Promise<{ conn: Connection }> };
        const conn = (await w.hassConnection).conn;
        return { success: await conn.sendMessagePromise(message) };
      } catch (e) {
        return { error: e };
      }
    }, message);
    if ('error' in result) {
      throw result.error;
    }
    return result.success;
  }

  close(): void {
    if (this.browser !== undefined) {
      this.browser.close();
    }
  }

  private async login() {
    await this.page.goto(this.options.url);
    await this.page.check('input[type=checkbox]');
    await this.page.fill('input[type=text]', 'dev');
    await this.page.fill('input[type=password]', 'dev');
    await this.page.click('mwc-button');
    await this.page.waitForSelector('#view');
  }
}

// Backend that uses home-assistant-js-websocket to connect directly to Home Assistant server
export class HaBrowserWsApiBackend implements WsApiBackend {
  constructor(private browser: HaBrowser) {}

  async connect(): Promise<void> {
    // nop
  }

  async sendRequest(message: MessageBase): Promise<unknown> {
    return this.browser.sendWsMessage(message);
  }

  close(): void {
    // nop
  }
}

export async function withHaBrowser<T>(
  options: Partial<HaBrowserOptions>,
  fn: (options: { browser: HaBrowser; wsApi: WsApi }) => Promise<T>,
): Promise<T> {
  const haBrowser = new HaBrowser(options);
  try {
    await haBrowser.init();
    return await fn({
      browser: haBrowser,
      wsApi: await WsApi.create({ backend: new HaBrowserWsApiBackend(haBrowser) }),
    });
  } finally {
    haBrowser.close();
  }
}
