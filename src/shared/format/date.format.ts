import { defaultI18n, format } from 'fecha';
import { defaulted, Infer, string } from 'superstruct';

import { FormatContext } from './format-context';

export const DATE_FORMAT_CONFIG = defaulted(string(), 'MMM DD YYYY HH:mm');
export type DateFormatConfig = Infer<typeof DATE_FORMAT_CONFIG>;

export class DateFormat {
  constructor(private config: DateFormatConfig, private ctx: FormatContext) {}

  format(date: Date): string {
    return format(date, this.config, defaultI18n);
  }
}
