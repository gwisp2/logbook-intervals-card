import { HomeAssistant, stateIcon } from 'custom-card-helpers';
import { LitElement, html, CSSResult, TemplateResult, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import { create } from 'superstruct';

import { loadStateHistory, History, HistoryItem } from '../../history/history';
import { MultiEntityHistoryTracker } from '../../history/multi-entity-history-tracker';
import { registerCustomCard } from '../../shared/custom-cards';
import { EntityIdFilter } from '../../shared/entity-id-filter';
import { AttributeFormat, FormattedAttribute } from '../../shared/format/attribute.format';
import { DateFormat } from '../../shared/format/date.format';
import { DurationFormat } from '../../shared/format/duration.format';
import { StateFormat } from '../../shared/format/state.format';
import { LogbookCardConfig, LOGBOOK_CARD_CONFIG_STRUCT } from './config';

registerCustomCard({
  type: 'logbook-intervals-card',
  name: 'Logbook Intervals Card',
  description: 'A custom card to display history of entities',
});

@customElement('logbook-intervals-card')
export class LogbookCard extends LitElement {
  public static getStubConfig(_hass: HomeAssistant, entities: Array<string>): object {
    return {
      entities: entities[0],
    };
  }

  @property() public hass!: HomeAssistant;
  @state() private config!: LogbookCardConfig;

  // Assigned in shouldUpdate
  private history?: History;
  private tracker!: MultiEntityHistoryTracker;
  private entityFilter!: EntityIdFilter;
  private dateFormat!: DateFormat;
  private durationFormat!: DurationFormat;
  private attrFormat!: AttributeFormat;
  private stateFormat!: StateFormat;

  setConfig(configObj: unknown): void {
    const config = create(configObj, LOGBOOK_CARD_CONFIG_STRUCT);
    this.config = config;
  }

  /**
   * Allows update (rerender) only if history was updated.
   * Also triggers history reload if needed.
   */
  protected shouldUpdate(oldProps: PropertyValues): boolean {
    const hassUpdated = oldProps.has('hass');
    const oldHass = oldProps.get('hass') as HomeAssistant | undefined;

    if (
      (hassUpdated &&
        (oldHass === undefined || oldHass.locale !== this.hass.locale || oldHass.localize !== this.hass.localize)) ||
      oldProps.has('config')
    ) {
      // Update helpers
      const formatContext = {
        localize: this.hass.localize,
        locale: this.hass.locale,
      };
      this.entityFilter = new EntityIdFilter(this.config.entities);
      this.dateFormat = new DateFormat(this.config.dateFormat, formatContext);
      this.durationFormat = new DurationFormat(this.config.durationFormat, formatContext);
      this.attrFormat = new AttributeFormat(this.config.attributes, formatContext);
      this.stateFormat = new StateFormat(this.config.states, formatContext);
      this.tracker = new MultiEntityHistoryTracker(this.entityFilter);
    }

    if (hassUpdated) {
      if (oldHass === undefined || oldProps.has('config')) {
        // Perform initial load
        this.loadHistory();
      }
    }

    this.tracker.addStates(Object.values(this.hass.states));
    const newHistory = this.tracker.getHistory();
    const historyChanged = newHistory !== this.history;
    this.history = newHistory;

    return historyChanged;
  }

  private async loadHistory(): Promise<void> {
    const startDate = new Date(new Date().setDate(new Date().getDate() - this.config.days));
    const states = await loadStateHistory(this.hass, {
      entityFilter: this.entityFilter,
      start: startDate,
    });
    this.tracker.addStates(states);
    this.requestUpdate();
  }

  protected render(): TemplateResult | void {
    return html`
      <ha-card .header=${this.config.title} tabindex="0" aria-label=${`${this.config.title}`}>
        <div class="card-content grid" style="[[contentStyle]]">${this.renderHistory()}</div>
      </ha-card>
    `;
  }

  private renderHistory(): TemplateResult {
    const history = this.history;
    if (history === undefined) {
      return html``;
    }

    if (history.entityIds.length === 0) {
      return html` <p>${this.config.messages.noEntities}</p> `;
    } else if (history.items.length === 0) {
      return html` <p>${this.config.messages.noEvents}</p> `;
    }

    // Remove oldest items if there are too many of them
    let itemsFromNewToOld = [...history.items].reverse();
    if (itemsFromNewToOld.length > this.config.maxItems) {
      itemsFromNewToOld = itemsFromNewToOld.slice(0, this.config.maxItems);
    }

    // Split into collapsed and shown
    let collapsedItems: HistoryItem[];
    let shownItems: HistoryItem[];
    if (
      this.config.maxItemsBeforeCollapse === undefined ||
      this.config.maxItemsBeforeCollapse < itemsFromNewToOld.length
    ) {
      shownItems = itemsFromNewToOld.slice(0, this.config.maxItemsBeforeCollapse);
      collapsedItems = itemsFromNewToOld.slice(this.config.maxItemsBeforeCollapse);
    } else {
      // No items are collapsed
      shownItems = itemsFromNewToOld;
      collapsedItems = [];
    }

    // Apply order
    if (this.config.order === 'old-to-new') {
      shownItems.reverse();
      collapsedItems.reverse();
    }

    // Render items
    const renderedShownItems = this.renderHistoryItems(shownItems);
    const renderedCollapsedItems =
      collapsedItems.length !== 0
        ? html`
            <input type="checkbox" class="expand" id="expand" />
            <label for="expand"><div>&lsaquo;</div></label>
            <div>${this.renderHistoryItems(collapsedItems)}</div>
          `
        : html``;

    if (this.config.order === 'new-to-old') {
      return html` ${renderedShownItems}${renderedCollapsedItems} `;
    } else {
      return html` ${renderedCollapsedItems}${renderedShownItems} `;
    }
  }

  private renderHistoryItems(items: HistoryItem[]): TemplateResult {
    return html` ${items.map((item, index, array) => this.renderHistoryItem(item, index + 1 === array.length))} `;
  }

  private renderHistoryItem(item: HistoryItem, isLast: boolean): TemplateResult {
    return html`
      <div class="item">
        ${this.renderIcon(item)}
        <div class="item-content">
          <b>
            ${this.config.show['entity_name'] && html`${this.renderEntityName(item)}: `}
            ${this.config.show['state'] ? html` <span>${item.state}</span> ` : html``}
          </b>
          ${this.config.show['duration'] ? html` <span class="duration">${this.renderDuration(item)}</span> ` : html``}
          ${this.renderHistoryDate(item)}${this.renderAttributes(item.attributes)}
        </div>
      </div>
      ${!isLast ? this.renderSeparator() : ``}
    `;
  }

  private renderEntityName(item: HistoryItem): TemplateResult {
    return html`${item.attributes['friendly_name'] ?? item.entityId}`;
  }

  private renderDuration(item: HistoryItem): TemplateResult | undefined {
    const duration = item.durationMs;
    if (duration !== null) {
      return html` ${this.durationFormat.format(duration)} `;
    } else {
      return html` <time-since-date .format=${this.durationFormat} .date=${item.start} /> `;
    }
  }

  private renderSeparator(): TemplateResult | void {
    if (this.config.show['separator']) {
      return html` <hr class="separator' aria-hidden="true" /> `;
    }
  }

  private renderIcon(item: HistoryItem): TemplateResult | void {
    if (this.config.show['icon']) {
      const iconFromState = this.stateFormat.getIcon(item.entity);
      const icon = iconFromState !== undefined ? iconFromState : this.config.icon;
      return html`
        <div class="item-icon">
          <ha-icon .icon="${icon ?? ''}"></ha-icon>
        </div>
      `;
    }
  }

  private renderHistoryDate(item: HistoryItem): TemplateResult {
    const formattedStart = this.dateFormat.format(item.start);
    const formattedEnd = item.end !== null ? this.dateFormat.format(item.end) : 'now';
    if (this.config.show['start_date'] && this.config.show['end_date']) {
      return html` <div class="date">${formattedStart} - ${formattedEnd}</div> `;
    } else if (this.config.show['end_date']) {
      return html` <div class="date">${formattedEnd}</div> `;
    } else if (this.config.show['start_date']) {
      return html` <div class="date">${formattedStart}</div> `;
    }
    return html``;
  }

  private renderAttributes(attributes: Record<string, unknown>): TemplateResult {
    const formattedAttrs = this.attrFormat.formatAttributes(attributes);
    return html` ${formattedAttrs.map((attr) => this.renderAttribute(attr))} `;
  }

  private renderAttribute(attr: FormattedAttribute): TemplateResult {
    return html`
      <div class="attribute">
        <div class="key">${attr.name}</div>
        <div class="value">${attr.value}</div>
      </div>
    `;
  }

  static get styles(): CSSResult {
    return css`
      .warning {
        display: block;
        color: black;
        background-color: #fce588;
        padding: 8px;
      }
      .item {
        clear: both;
        padding: 5px 0;
        display: flex;
        line-height: var(--paper-font-body1_-_line-height);
      }
      .item-content {
        flex: 1;
      }
      .item-icon {
        flex: 0 0 40px;
        color: var(--paper-item-icon-color, #44739e);
      }
      .duration {
        font-size: 0.85em;
        font-style: italic;
        float: right;
      }
      .date,
      .attribute {
        font-size: 0.7em;
      }
      .attribute {
        display: flex;
        justify-content: space-between;
      }
      .expand {
        display: none;
      }
      .expand + label {
        display: block;
        text-align: right;
        cursor: pointer;
      }
      .expand + label > div {
        display: inline-block;
        transform: rotate(-90deg);
        font-size: 26px;
        height: 29px;
        width: 29px;
        text-align: center;
      }
      .expand + label > div,
      .expand + label + div {
        transition: 0.5s ease-in-out;
      }
      .expand:checked + label > div {
        transform: rotate(-90deg) scaleX(-1);
      }
      .expand + label + div {
        max-height: 0;
        overflow: hidden;
      }
      .expand:checked + label + div {
        max-height: none;
      }
      .separator {
        border-top: 1px solid var(--divider-color);
      }
    `;
  }
}
