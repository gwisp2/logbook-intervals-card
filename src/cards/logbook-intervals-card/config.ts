import { record, boolean, defaulted, enums, Infer, number, object, optional, string, nullable } from 'superstruct';

import { EntityIdFilterConfig } from '../../shared/entity-id-filter';
import { AttributeFormatConfig } from '../../shared/format/attribute.format';
import { DateFormatConfig } from '../../shared/format/date.format';
import { DurationFormatConfig } from '../../shared/format/duration.format';
import { StateFormatConfig } from '../../shared/format/state.format';

export const SHOW_ELEMENTS = [
  'state',
  'duration',
  'start_date',
  'end_date',
  'icon',
  'separator',
  'entity_name',
] as const;
export const DEFAULT_SHOWN_ELEMENTS = ['state', 'duration', 'start_date', 'end_date', 'icon', 'entity_name'];
export type ShowElement = typeof SHOW_ELEMENTS[number];

export const ORDERS = ['old-to-new', 'new-to-old'] as const;
export type Order = typeof ORDERS[number];

export const LOGBOOK_CARD_CONFIG_STRUCT = object({
  type: string(),
  title: optional(string()),
  days: defaulted(number(), 5),
  order: defaulted(enums(ORDERS), 'new-to-old'),
  icon: optional(nullable(string())),
  entities: EntityIdFilterConfig,
  messages: defaulted(
    object({
      loading: string(),
      noEvents: string(),
      noEntities: string(),
      error: string(),
    }),
    { noEvents: 'No events', noEntities: 'No entities matched', loading: 'Loading', error: 'Error' },
  ),
  maxItemsBeforeCollapse: optional(number()),
  maxItems: defaulted(number(), 50),
  attributes: AttributeFormatConfig,
  states: StateFormatConfig,
  show: defaulted(
    record(enums(SHOW_ELEMENTS), boolean()),
    Object.fromEntries(SHOW_ELEMENTS.map((e) => [e, DEFAULT_SHOWN_ELEMENTS.includes(e)])),
  ),
  dateFormat: DateFormatConfig,
  durationFormat: DurationFormatConfig,
  // TODO: actions
});

export type LogbookCardConfig = Infer<typeof LOGBOOK_CARD_CONFIG_STRUCT>;
