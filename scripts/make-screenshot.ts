#!/usr/bin/env ts-node
import fs from 'fs/promises';
import YAML from 'yaml';

import { withHaBrowser } from './util/ha-browser';
import { runMain } from './util/script-helpers';

async function readYaml(path: string) {
  const content = (await fs.readFile(path)).toString('utf-8');
  return YAML.parse(content);
}

runMain(async () => {
  await withHaBrowser({}, async ({ browser, wsApi }) => {
    await wsApi.updateLanguage('en');
    await wsApi.updateLovelaceConfig(await readYaml('./test/ui-lovelace.yaml'));
    await browser.makeCardScreenshot('logbook-intervals-card', { path: './test/screenshot1.png' });
  });
});
