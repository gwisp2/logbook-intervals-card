import { HomeAssistant, stateIcon } from 'custom-card-helpers';
import { LitElement, html, CSSResultGroup, TemplateResult, css, PropertyValues } from 'lit';
import { repeat } from 'lit-html/directives/repeat.js';
import { styleMap } from 'lit-html/directives/style-map';
import { customElement, property, state } from 'lit/decorators';
import _ from 'lodash-es';
import { create } from 'superstruct';

import { registerCustomCard } from '../../shared/custom-cards';
import { CustomizerChain } from '../../shared/customizers/customizer';
import { EntityIdFilter } from '../../shared/entity-id-filter';
import { DateFormat } from '../../shared/format/date.format';
import { DurationFormat } from '../../shared/format/duration.format';
import { LogbookCardConfig, LOGBOOK_CARD_CONFIG_STRUCT } from './config';
import { DisplayedHistoryItem, ItemCustomizerFactory } from './customizers';
import './history-item-view';
import { loadStateHistory, History, HistoryItem } from './history/history';
import { MultiEntityHistoryTracker } from './history/multi-entity-history-tracker';

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
  private itemCustomizerChain!: CustomizerChain<DisplayedHistoryItem>;

  setConfig(configObj: unknown): void {
    // configObj is frozen.
    // Due to the following issue we need to clone configObj.
    // https://github.com/ianstormtaylor/superstruct/issues/1096
    const config = create(_.cloneDeep(configObj), LOGBOOK_CARD_CONFIG_STRUCT);
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
      this.tracker = new MultiEntityHistoryTracker(this.entityFilter);
      this.itemCustomizerChain = ItemCustomizerFactory.createCustomizerChain(this.config.itemCustomizers);
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
        <div class="card-content grid">${this.renderHistory()}</div>
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

    // Remove hidden entities
    const customizedItems = history.items.map((item) => this.customizeHistoryItem(item));
    const visibleItems = customizedItems.filter((i) => !i.hidden);

    // Remove oldest items if there are too many of them
    let itemsFromNewToOld = [...visibleItems].reverse();
    if (itemsFromNewToOld.length > this.config.maxItems) {
      itemsFromNewToOld = itemsFromNewToOld.slice(0, this.config.maxItems);
    }

    // Split into collapsed and shown
    let collapsedItems: DisplayedHistoryItem[];
    let shownItems: DisplayedHistoryItem[];
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

  private customizeHistoryItem(item: HistoryItem): DisplayedHistoryItem {
    const displayItem: DisplayedHistoryItem = {
      item: item,
      entity: item.entity,
      icon: stateIcon(item.entity),
      stateLabel: item.state,
      hidden: false,
      attributes: {},
      iconColor: '#44739e',
      iconBackgroundColor: 'rgba(189, 189, 189, 0.2)',
      show: {
        state: true,
        duration: true,
        start_date: true,
        end_date: true,
        icon: true,
        entity_name: true,
        separator: false,
      },
    };
    this.itemCustomizerChain.apply(displayItem);
    return displayItem;
  }

  private renderHistoryItems(items: DisplayedHistoryItem[]): TemplateResult {
    const separatorStyles = {
      'border-top': this.config.separator.style,
    };
    return html` ${repeat(
      items,
      (item) => `${item.entity.entity_id}, ${item.entity.last_changed}`,
      (item, index) => html`
        <logbook-history-item-view
          .item=${item}
          .dateFormat=${this.dateFormat}
          .durationFormat=${this.durationFormat}
        ></logbook-history-item-view>
        ${this.config.separator.show && index !== items.length - 1
          ? html`<hr class="separator" style=${styleMap(separatorStyles)} />`
          : ''}
      `,
    )}`;
  }

  static get styles(): CSSResultGroup {
    return css`
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
    `;
  }
}
