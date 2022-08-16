import fs from 'fs/promises';
import YAML from 'yaml';

export async function readYamlFile(path: string): Promise<unknown> {
  const content = (await fs.readFile(path)).toString('utf-8');
  return YAML.parse(content);
}

export function parseYaml(content: string): Promise<unknown> {
  return YAML.parse(content);
}
