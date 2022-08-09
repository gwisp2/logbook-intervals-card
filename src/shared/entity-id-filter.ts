import { array, Infer, string, union } from 'superstruct';

export const EntityIdFilterConfig = union([array(string()), string()]);
export type EntityIdFilterConfig = Infer<typeof EntityIdFilterConfig>;

export class EntityIdFilter {
  private regexps: RegExp[];

  constructor(config: EntityIdFilterConfig) {
    const globs = Array.isArray(config) ? config : [config];
    this.regexps = globs.map((g) => RegExp(g));
  }

  matches(entityId: string): boolean {
    return this.regexps.some((r) => r.test(entityId));
  }
}
