import { defaulted, enums, Infer, number, object, optional, string, nullable, boolean } from 'superstruct';

import { ENTITY_ID_FILTER_CONFIG } from '../../shared/entity-id-filter';
import { DATE_FORMAT_CONFIG } from '../../shared/format/date.format';
import { DURATION_FORMAT_CONFIG } from '../../shared/format/duration.format';
import { ItemCustomizerFactory } from './customizers';

export const ORDERS = ['old-to-new', 'new-to-old'] as const;
export type Order = typeof ORDERS[number];

export const LOGBOOK_CARD_CONFIG_STRUCT = object({
  type: string(),
  title: optional(string()),
  days: defaulted(number(), 5),
  order: defaulted(enums(ORDERS), 'new-to-old'),
  icon: optional(nullable(string())),
  entities: ENTITY_ID_FILTER_CONFIG,
  itemCustomizers: ItemCustomizerFactory.customizerChainSchema,
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
  dateFormat: DATE_FORMAT_CONFIG,
  durationFormat: DURATION_FORMAT_CONFIG,
  separator: defaulted(
    object({
      show: boolean(),
      style: string(),
    }),
    { show: false, style: 'gray 1px dashed' },
  ),
  // TODO: actions
});

export type LogbookCardConfig = Infer<typeof LOGBOOK_CARD_CONFIG_STRUCT>;
