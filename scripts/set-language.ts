#!/usr/bin/env ts-node
import { exit } from 'process';

import './util/polyfill-ws';
import { withWsApi, runMain } from './util/script-helpers';

runMain(async (args) => {
  if (args.length > 1) {
    console.log('Expected one or zero arguments');
    exit(1);
  }
  const language = args.length !== 0 ? args[0] : 'en';
  withWsApi((api) => api.updateLanguage(language));
});
