import { record, boolean, defaulted, enums, Infer, number, object, optional, string, nullable } from 'superstruct';

import { ENTITY_ID_FILTER_CONFIG } from '../../shared/entity-id-filter';
import { ATTRIBUTE_FORMAT_CONFIG } from '../../shared/format/attribute.format';
import { DATE_FORMAT_CONFIG } from '../../shared/format/date.format';
import { DURATION_FORMAT_CONFIG } from '../../shared/format/duration.format';
import { STATE_FORMAT_CONFIG } from '../../shared/format/state.format';

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
  entities: ENTITY_ID_FILTER_CONFIG,
  messages: defaulted(
    object({
      loading: string(),
      noEvents: string(),
      noEntities: string(),
      error: string(),
    }),
    { noEvents: 'No events', noEntities: 'No entities matched', loading: 'Loading', error: 'Error' },
  ),
  maxItemsBeforeCollapse: defaulted(number(), 5),
  maxItems: defaulted(number(), 20),
  attributes: ATTRIBUTE_FORMAT_CONFIG,
  states: STATE_FORMAT_CONFIG,
  show: defaulted(
    record(enums(SHOW_ELEMENTS), boolean()),
    Object.fromEntries(SHOW_ELEMENTS.map((e) => [e, DEFAULT_SHOWN_ELEMENTS.includes(e)])),
  ),
  dateFormat: DATE_FORMAT_CONFIG,
  durationFormat: DURATION_FORMAT_CONFIG,
  // TODO: actions
});

export type LogbookCardConfig = Infer<typeof LOGBOOK_CARD_CONFIG_STRUCT>;
