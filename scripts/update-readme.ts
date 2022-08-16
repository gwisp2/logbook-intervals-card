#!/usr/bin/env ts-node
import ejs from 'ejs';
import fs from 'fs/promises';

import { withHaBrowser } from './util/ha-browser';
import { parseYaml } from './util/lovelace';
import { runMain } from './util/script-helpers';

export function removeMargin(text: string): string {
  const nonBlankLines = text.split('\n').filter((line) => line.trim().length !== 0);
  const leftMargins = nonBlankLines.map((line) => line.length - line.trimStart().length);
  const minLeftMargin = Math.min(...leftMargins);
  return nonBlankLines.map((line) => line.substring(minLeftMargin)).join('\n');
}

runMain(async () => {
  const templateStr = (await fs.readFile('./docs/template/README.template.md')).toString('utf-8');
  const template = ejs.compile(templateStr, { async: true });

  const exampleTemplate = ejs.compile(
    `
<details>
<summary><%- name %></summary>

![](<%- screenshotPath %>)

\`\`\`yaml
<%- code %>
\`\`\`
</details>`.trim(),
  );

  await withHaBrowser({}, async ({ browser, wsApi }) => {
    await wsApi.updateLanguage('en');

    const makeScreenshot = async (code: string): Promise<string> => {
      const cardConfig = parseYaml(code);
      await wsApi.updateLovelaceConfig({
        title: 'Home',
        views: [
          {
            path: 'default_view',
            title: 'Home',
            cards: [cardConfig],
          },
        ],
      });
      const screenshotPath = 'docs/generated/x.png';
      await browser.makeCardScreenshot('ha-card', { path: screenshotPath });
      return screenshotPath;
    };

    const makeExample = async (options: { code: string; name: string }): Promise<string> => {
      const screenshotPath = await makeScreenshot(options.code);
      return exampleTemplate({
        name: options.name,
        code: removeMargin(options.code),
        screenshotPath: screenshotPath,
      });
    };

    const result = await template({
      example: makeExample,
    });
    await fs.writeFile('README.md', result, { encoding: 'utf-8' });
  });
});
