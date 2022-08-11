import { computeStateDisplay, stateIcon } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { array, boolean, defaulted, Infer, nullable, object, optional, string } from 'superstruct';

import { FormatContext } from './format-context';

export const STATE_FORMAT_CONFIG = defaulted(
  array(
    object({
      value: string(),
      label: optional(string()),
      icon: optional(nullable(string())),
      hide: defaulted(boolean(), false),
    }),
  ),
  [],
);
export type StateFormatConfig = Infer<typeof STATE_FORMAT_CONFIG>;

export class StateFormat {
  config: (Infer<typeof STATE_FORMAT_CONFIG.schema> & { regexp: RegExp })[];

  constructor(config: StateFormatConfig, private ctx: FormatContext) {
    this.config = config.map((c) => ({ ...c, regexp: RegExp(c.value) }));
  }

  format(entity: HassEntity): string {
    const s = this.config.find((s) => s.regexp.test(entity.state));
    return s !== undefined && s.label ? s.label : computeStateDisplay(this.ctx.localize, entity, this.ctx.locale);
  }

  isHidden(entity: HassEntity): boolean {
    const s = this.config.find((s) => s.regexp.test(entity.state));
    return s?.hide ?? false;
  }

  getIcon(entity: HassEntity): string | null | undefined {
    const s = this.config.find((s) => s.regexp.test(entity.state));
    return s !== undefined && s.icon !== undefined ? s.icon : stateIcon(entity);
  }
}
