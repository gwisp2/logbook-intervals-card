import { exit } from 'process';

import { SimpleWsApiBackend, WsApi } from './ws-api';

export async function runMain(main: (args: string[]) => Promise<void>) {
  try {
    await main(process.argv.slice(2));
    console.log('Completed');
  } catch (e) {
    console.log(e);
    console.trace(e);
    exit(2);
  }
}

export async function withSimpleWsApi(fn: (api: WsApi) => Promise<void>) {
  const api = await WsApi.create({ backend: new SimpleWsApiBackend() });
  try {
    await fn(api);
  } finally {
    api.close();
  }
}
