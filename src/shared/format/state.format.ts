import { computeStateDisplay } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { array, defaulted, Infer, object, optional, regexp, string } from 'superstruct';

import { FormatContext } from './format-context';

export const StateFormatConfig = defaulted(
  array(
    object({
      value: string(),
      label: optional(string()),
      icon: optional(string()),
    }),
  ),
  [],
);
export type StateFormatConfig = Infer<typeof StateFormatConfig>;

export class StateFormat {
  config: (Infer<typeof StateFormatConfig.schema> & { regexp: RegExp })[];

  constructor(config: StateFormatConfig, private ctx: FormatContext) {
    this.config = config.map((c) => ({ ...c, regexp: RegExp(c.value) }));
  }

  format(entity: HassEntity): string {
    const s = this.config.find((s) => s.regexp.test(entity.state));
    return s !== undefined && s.label ? s.label : computeStateDisplay(this.ctx.localize, entity, this.ctx.locale);
  }

  getIcon(entity: HassEntity): string | undefined {
    const s = this.config.find((s) => s.regexp.test(entity.state));
    return s !== undefined && s.icon ? s.icon : undefined;
  }
}
