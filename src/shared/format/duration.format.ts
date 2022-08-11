import { HumanizeDuration, HumanizeDurationLanguage, HumanizeDurationOptions } from 'humanize-duration-ts';
import { array, boolean, defaulted, enums, Infer, number, object, optional, string } from 'superstruct';

import { FormatContext } from './format-context';

export const UNITS = ['y', 'mo', 'w', 'd', 'h', 'm', 's', 'ms'] as const;
export const DEFAULT_UNITS = ['d', 'h', 'm', 's'];

export const DURATION_FORMAT_CONFIG = defaulted(
  object({
    language: optional(string()),
    delimiter: optional(string()),
    spacer: optional(string()),
    conjunction: optional(string()),
    serialComma: optional(boolean()),
    units: array(enums(UNITS)),
    largest: number(),
  }),
  {
    delimiter: ' ',
    units: DEFAULT_UNITS,
    largest: 2,
  },
);
export type DurationFormatConfig = Infer<typeof DURATION_FORMAT_CONFIG>;

export class DurationFormat {
  private humanizeDuration: HumanizeDuration;
  private options: HumanizeDurationOptions;

  constructor(config: DurationFormatConfig, private ctx: FormatContext) {
    const selectedLanguage = config.language ?? this.ctx.locale.language;
    const humanizeDuration = new HumanizeDuration(new HumanizeDurationLanguage());
    const language = humanizeDuration.getSupportedLanguages().includes(selectedLanguage) ? selectedLanguage : 'en';
    this.options = this.removeUndefined({
      language,
      delimiter: config.delimiter,
      spacer: config.spacer,
      conjunction: config.conjunction,
      serialComma: config.serialComma,
      units: config.units,
      largest: config.largest,
      round: true,
    });
    this.humanizeDuration = humanizeDuration;
  }

  private removeUndefined<T>(obj: T): T {
    return Object.fromEntries(Object.entries(obj).filter((e) => e[1] !== undefined)) as T;
  }

  format(durationMs: number): string {
    const absDurationMs = Math.abs(durationMs);
    const sign = durationMs < 0 ? '- ' : '';
    return sign + this.humanizeDuration.humanize(absDurationMs, this.options);
  }
}
