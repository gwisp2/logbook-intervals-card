import { defaultI18n, format } from 'fecha';
import { defaulted, Infer, string } from 'superstruct';

import { FormatContext } from './format-context';

export const DateFormatConfig = defaulted(string(), 'MMM DD YYYY HH:mm');
export type DateFormatConfig = Infer<typeof DateFormatConfig>;

export class DateFormat {
  constructor(private config: DateFormatConfig, private ctx: FormatContext) {}

  format(date: Date): string {
    return format(date, this.config, defaultI18n);
  }
}
