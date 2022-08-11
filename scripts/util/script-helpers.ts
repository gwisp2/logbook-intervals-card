import { exit } from 'process';

import { WsApi } from './ws-api';

export async function runMain(main: (args: string[]) => Promise<void>) {
  try {
    await main(process.argv.slice(2));
    console.log('Completed');
  } catch (e) {
    console.trace(e);
    exit(2);
  }
}

export async function withWsApi(fn: (api: WsApi) => Promise<void>) {
  const api = await WsApi.create();
  try {
    await fn(api);
  } finally {
    api.close();
  }
}
