import { HassEntity } from 'home-assistant-js-websocket';
import * as _ from 'lodash-es';

import { EntityIdFilter } from '../../../shared/entity-id-filter';
import { EntityHistoryTracker } from './entity-history-tracker';
import { History } from './history';

export class MultiEntityHistoryTracker {
  private entityHistoryTrackers = new Map<string, EntityHistoryTracker>();
  private history?: History;
  private dirty: boolean = false;

  constructor(private entityFilter: EntityIdFilter) {}

  addStates(states: HassEntity[]): void {
    for (const state of states) {
      this.addState(state);
    }
  }

  addState(state: HassEntity) {
    if (!this.entityFilter.matches(state.entity_id)) {
      return;
    }

    let tracker = this.entityHistoryTrackers.get(state.entity_id);
    if (tracker === undefined) {
      tracker = new EntityHistoryTracker(state.entity_id);
      this.entityHistoryTrackers.set(state.entity_id, tracker);
    }

    this.dirty = tracker.addState(state) || this.dirty;
  }

  getHistory(): History {
    if (this.history !== undefined && !this.dirty) {
      return this.history;
    }

    const items = [...this.entityHistoryTrackers.values()].flatMap((tracker) => tracker.buildHistoryItems());
    const sortedItems = _.sortBy(items, (item) => item.start.getTime());

    this.history = {
      items: sortedItems,
      entityIds: [...this.entityHistoryTrackers.keys()],
    };
    this.dirty = false;
    return this.history;
  }
}
