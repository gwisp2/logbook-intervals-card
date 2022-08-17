import { CSSResultGroup, html, LitElement, TemplateResult, css } from 'lit';
import { customElement, property } from 'lit/decorators';

import { DateFormat } from '../../shared/format/date.format';
import { DurationFormat } from '../../shared/format/duration.format';
import { DisplayedHistoryItem } from './customizers';

@customElement('logbook-history-item-view')
export class HistoryItemView extends LitElement {
  @property() public item!: DisplayedHistoryItem;
  @property() public durationFormat!: DurationFormat;
  @property() public dateFormat!: DateFormat;

  protected render(): TemplateResult {
    const item = this.item;
    const sep = item.show['entity_name'] && item.show['state'] ? html`: ` : html``;
    return html`
      <style>
        .item-icon {
          --icon-color: ${item.iconColor};
          --icon-background-color: ${item.iconBackgroundColor};
        }
      </style>

      ${item.show['icon'] && this.renderIcon(item.icon)}
      <div class="item-content">
        <b>
          ${item.show['entity_name'] && html`${this.renderEntityName(item)}`}${sep}
          ${item.show['state'] ? html` <span>${item.stateLabel}</span> ` : html``}
        </b>
        ${item.show['duration'] ? html`<span class="duration">${this.renderDuration(item)}</span> ` : html``}
        ${this.renderHistoryDate(item)}${this.renderAttributes(item, item.item.attributes)}
      </div>
    `;
  }

  private renderEntityName(item: DisplayedHistoryItem): TemplateResult {
    return html`${item.item.attributes['friendly_name'] ?? item.item.entityId}`;
  }

  private renderDuration(item: DisplayedHistoryItem): TemplateResult | undefined {
    const duration = item.item.durationMs;
    if (duration !== null) {
      return html` ${this.durationFormat.format(duration)} `;
    } else {
      return html` <time-since-date .format=${this.durationFormat} .date=${item.item.start} /> `;
    }
  }

  private renderIcon(icon: string): TemplateResult | void {
    return html`
      <div class="item-icon">
        <ha-icon .icon="${icon}"></ha-icon>
      </div>
    `;
  }

  private renderHistoryDate(displayedItem: DisplayedHistoryItem): TemplateResult {
    const item = displayedItem.item;
    const formattedStart = this.dateFormat.format(item.start);
    const formattedEnd = item.end !== null ? this.dateFormat.format(item.end) : 'now';
    if (displayedItem.show['start_date'] && displayedItem.show['end_date']) {
      return html` <div class="date">${formattedStart} - ${formattedEnd}</div> `;
    } else if (displayedItem.show['end_date']) {
      return html` <div class="date">${formattedEnd}</div> `;
    } else if (displayedItem.show['start_date']) {
      return html` <div class="date">${formattedStart}</div> `;
    }
    return html``;
  }

  private renderAttributes(item: DisplayedHistoryItem, attributes: Record<string, unknown>): TemplateResult {
    const notHiddenAttrs = Object.entries(attributes).filter(([key, _]) => !(item.attributes[key]?.hidden ?? true));
    const formattedAttrs = notHiddenAttrs.map(([key, value]) => {
      const attrDisplayConfig = item.attributes[key];
      const formattedValue = typeof value === 'string' ? value : JSON.stringify(value);
      return { name: attrDisplayConfig.label ?? key, value: formattedValue };
    });
    return html` ${formattedAttrs.map((attr) => this.renderAttribute(attr))} `;
  }

  private renderAttribute(attr: { name: string; value: string }): TemplateResult {
    return html`
      <div class="attribute">
        <div class="key">${attr.name}</div>
        <div class="value">${attr.value}</div>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        clear: both;
        padding: 5px 0;
        display: flex;
        line-height: var(--paper-font-body1_-_line-height);
      }
      .item-content {
        flex: 1;
      }
      .item-icon {
        margin-right: 12px;
        align-self: start;

        display: flex;
        align-items: center;
        justify-content: center;

        width: 40px;
        height: 40px;

        color: var(--icon-color);
        background-color: var(--icon-background-color);
        border-radius: 50%;
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
    `;
  }
}
