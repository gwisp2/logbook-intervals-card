#!/usr/bin/env ts-node
import fs from 'fs/promises';
import { exit } from 'process';
import YAML from 'yaml';

import { runMain, withWsApi } from './util/script-helpers';

async function readYaml(path: string) {
  const content = (await fs.readFile(path)).toString('utf-8');
  return YAML.parse(content);
}

runMain(async (args) => {
  if (args.length !== 1) {
    console.log('Expected exactly one command-line argument - YAML file describing lovelace ui');
    exit(1);
  }
  const uiConfig = await readYaml(args[0]);
  withWsApi((api) => api.updateLovelaceConfig(uiConfig));
});
