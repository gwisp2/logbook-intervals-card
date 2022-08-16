#!/usr/bin/env ts-node
import { withHaBrowser } from './util/ha-browser';
import { readYamlFile } from './util/lovelace';
import { runMain } from './util/script-helpers';

runMain(async () => {
  await withHaBrowser({}, async ({ browser, wsApi }) => {
    await wsApi.updateLanguage('en');
    await wsApi.updateLovelaceConfig(await readYamlFile('./test/ui-lovelace.yaml'));
    await browser.makeCardScreenshot('logbook-intervals-card', { path: './test/screenshot1.png' });
  });
});
