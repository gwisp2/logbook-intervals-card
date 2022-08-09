import { array, Infer, string, union } from 'superstruct';
import wcmatch from 'wildcard-match';

export const EntityIdFilterConfig = union([array(string()), string()]);
export type EntityIdFilterConfig = Infer<typeof EntityIdFilterConfig>;

export class EntityIdFilter {
  private regexps: ReturnType<typeof wcmatch>[];

  constructor(config: EntityIdFilterConfig) {
    const patterns = Array.isArray(config) ? config : [config];
    this.regexps = patterns.map((pattern) => wcmatch(pattern, '.'));
  }

  matches(entityId: string): boolean {
    return this.regexps.some((r) => r(entityId));
  }
}
