import { formatDateTime } from 'custom-card-helpers';
import { array, defaulted, enums, Infer, object, optional, string } from 'superstruct';

import { FormatContext } from './format-context';

export enum AttributeFormatType {
  DEFAULT = 'default',
  DATE = 'date',
}
export const ATTRIBUTE_FORMAT_TYPES = [AttributeFormatType.DATE, AttributeFormatType.DEFAULT] as const;
export const ATTRIBUTE_FORMAT_CONFIG = defaulted(
  array(
    object({
      name: string(),
      displayName: optional(string()),
      type: defaulted(enums(ATTRIBUTE_FORMAT_TYPES), AttributeFormatType.DEFAULT),
    }),
  ),
  [],
);

export interface FormattedAttribute {
  name: string;
  value: string;
}

export class AttributeFormat {
  constructor(private configs: Infer<typeof ATTRIBUTE_FORMAT_CONFIG>, private ctx: FormatContext) {}

  formatAttributes(attrs: Record<string, unknown>) {
    return Object.entries(attrs).flatMap(([name, value]) => this.formatAttribute(name, value));
  }

  formatAttribute(name: string, value: unknown): FormattedAttribute[] {
    const config = this.configs.find((c) => c.name === name);
    if (value === null || value === undefined || config === undefined) {
      return [];
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      const keys = Object.keys(value);
      return keys.map((key) => ({
        name: key,
        value: this.formatAttributeValue(value[key], undefined),
      }));
    } else if (Array.isArray(value)) {
      return [
        {
          name: config.displayName ?? name,
          value: this.formatAttributeValue(value.join(','), undefined),
        },
      ];
    } else {
      return [
        {
          name: config.displayName ?? name,
          value: this.formatAttributeValue(value, undefined),
        },
      ];
    }
  }

  private formatAttributeValue(value: any, type: string | undefined): string {
    if (type === 'date') {
      return this.formatDate(new Date(value));
    }
    return value;
  }

  private formatDate(date: Date): string {
    // if (this.config?.date_format) {
    //   return format(date, this.config?.date_format ?? undefined);
    // }
    return formatDateTime(date, this.ctx.locale);
  }
}
