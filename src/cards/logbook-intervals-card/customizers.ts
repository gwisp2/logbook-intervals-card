import { HassEntity } from 'home-assistant-js-websocket';
import { boolean, defaulted, enums, object, optional, record, string } from 'superstruct';

import {
  CombinedActionFactory,
  assignFn,
  PropertyActionFactory,
  replaceFn,
  mergeFn,
} from '../../shared/customizers/action';
import {
  CombinedConditionFactory,
  DelegatingConditionFactory,
  WildcardConditionFactory,
} from '../../shared/customizers/condition';
import { CustomizerFactory } from '../../shared/customizers/customizer';
import { HistoryItem } from './history/history';
import { ShowElement, SHOW_ELEMENTS } from './show-elements';

export interface DisplayedHistoryItem {
  item: HistoryItem;
  entity: HassEntity;

  iconColor: string;
  iconBackgroundColor: string;

  icon: string;
  stateLabel: string;
  hidden: boolean;
  attributes: Record<string, { label?: string; hidden: boolean }>;
  show: Record<ShowElement, boolean>;
}

export const ItemConditionFactory = new CombinedConditionFactory([
  new DelegatingConditionFactory('state', (d: DisplayedHistoryItem) => d.entity.state, new WildcardConditionFactory()),
] as const);

export const ItemActionFactory = new CombinedActionFactory([
  new PropertyActionFactory('iconColor', string(), replaceFn),
  new PropertyActionFactory('iconBackgroundColor', string(), replaceFn),
  new PropertyActionFactory('stateLabel', string(), replaceFn),
  new PropertyActionFactory('icon', string(), replaceFn),
  new PropertyActionFactory('hidden', boolean(), replaceFn),
  new PropertyActionFactory(
    'attributes',
    record(
      string(),
      defaulted(
        object({
          label: optional(string()),
          hidden: boolean(),
        }),
        { hidden: false },
      ),
    ),
    mergeFn,
  ),
  new PropertyActionFactory('show', record(enums(SHOW_ELEMENTS), boolean()), assignFn),
] as const);

export const ItemCustomizerFactory = new CustomizerFactory(ItemConditionFactory, ItemActionFactory);
