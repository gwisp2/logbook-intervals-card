import { array, Infer, string, union } from 'superstruct';
import wcmatch from 'wildcard-match';

export const ENTITY_ID_FILTER_CONFIG = union([array(string()), string()]);
export type EntityIdFilterConfig = Infer<typeof ENTITY_ID_FILTER_CONFIG>;

export class EntityIdFilter {
  private patterns: ReturnType<typeof wcmatch>[];

  constructor(config: EntityIdFilterConfig) {
    const patterns = Array.isArray(config) ? config : [config];
    this.patterns = patterns.map((pattern) => wcmatch(pattern, '.'));
  }

  matches(entityId: string): boolean {
    return this.patterns.some((r) => r(entityId));
  }
}
