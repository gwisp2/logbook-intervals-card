import { HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import * as _ from 'lodash-es';

import { EntityIdFilter } from '../../../shared/entity-id-filter';

export class HistoryItem {
  entity: HassEntity;
  end: Date | null; // null means that state is actual now

  constructor(options: { entity: HassEntity; end: Date | null }) {
    this.entity = options.entity;
    this.end = options.end;
  }

  get entityId(): string {
    return this.entity.entity_id;
  }

  get state(): string {
    return this.entity.state;
  }

  get start(): Date {
    return new Date(this.entity.last_changed);
  }

  get attributes(): Record<string, unknown> {
    return this.entity.attributes;
  }

  get durationMs(): number | null {
    return this.end !== null ? this.end.getTime() - this.start.getTime() : null;
  }
}

export interface History {
  items: Array<HistoryItem>;
  entityIds: string[];
}

export interface HistoryLoadOptions {
  entityFilter: EntityIdFilter;
  start: Date;
}

export const loadStateHistory = async (hass: HomeAssistant, options: HistoryLoadOptions): Promise<HassEntity[]> => {
  const allEntityIds = Object.keys(hass.states);
  const neededEntityIds = allEntityIds.filter((e) => options.entityFilter.matches(e));

  let stateList: HassEntity[] = [];
  if (neededEntityIds.length !== 0) {
    // add a minute to compensate small clock difference between server and client
    const endExtraMs = 60000;
    const uri =
      'history/period/' +
      options.start.toISOString() +
      '?filter_entity_id=' +
      neededEntityIds.join(',') +
      '&end_time=' +
      new Date(new Date().getTime() + endExtraMs).toISOString();

    const response = (await hass.callApi('GET', uri)) as HassEntity[][];
    stateList = response.flatMap((states) => states);
  }
  return stateList;
};
