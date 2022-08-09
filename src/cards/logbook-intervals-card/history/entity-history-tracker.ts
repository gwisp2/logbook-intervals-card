import { HassEntity } from 'home-assistant-js-websocket';
import * as _ from 'lodash-es';

import { HistoryItem } from './history';

export class EntityHistoryTracker {
  private states: HassEntity[] = [];
  private stateInstants: Set<string> = new Set();

  constructor(private entityId: string) {
    this.states = [];
  }

  addState(state: HassEntity): boolean {
    if (state.entity_id !== this.entityId) {
      throw Error(`Entity id doesn't match, expected ${this.entityId}, found ${state.entity_id}`);
    }
    if (!this.stateInstants.has(state.last_changed)) {
      this.states.push(state);
      this.stateInstants.add(state.last_changed);
      return true;
    }
    return false;
  }

  buildHistoryItems(): HistoryItem[] {
    // Sort by start date
    this.states = _.sortBy(this.states, (ent) => ent.last_changed);

    // Compute ends
    const items = this.states.map(
      (ent, index) =>
        new HistoryItem({
          entity: ent,
          end: index + 1 < this.states.length ? new Date(this.states[index + 1].last_changed) : null,
        }),
    );

    // Squash items
    const squashedItems: HistoryItem[] = [];
    items.forEach((item) => {
      if (squashedItems.length === 0 || squashedItems[squashedItems.length - 1].state !== item.state) {
        // New state
        squashedItems.push(item);
      } else {
        // State is the same, just prolong the previous item
        squashedItems[squashedItems.length - 1].end = item.end;
      }
    });

    // Add to list
    return squashedItems;
  }
}
