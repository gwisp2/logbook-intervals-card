import { html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators';

import { DurationFormat } from './format/duration.format';

@customElement('time-since-date')
export class TimeSinceDate extends LitElement {
  @property() format!: DurationFormat;
  @property() date!: Date;

  private intervalHandle?: ReturnType<typeof setInterval>;
  private timeoutHandle?: ReturnType<typeof setTimeout>;

  shouldUpdate(oldProps: PropertyValues): boolean {
    if (oldProps.has('date')) {
      // Reset timers if date was changed
      this.setTimers();
    }
    return true;
  }

  render(): TemplateResult {
    const displayedText = this.format.format(this.timePassed());
    return html` ${displayedText} `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setTimers();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.clearTimers();
  }

  private clearTimers() {
    clearTimeout(this.timeoutHandle);
    clearInterval(this.intervalHandle);
    this.timeoutHandle = undefined;
    this.intervalHandle = undefined;
  }

  private setTimers() {
    this.clearTimers();
    const timeToSecondsChange = this.mod(1000 - this.timePassed(), 1000);
    this.timeoutHandle = setTimeout(() => {
      this.requestUpdate();
      this.intervalHandle = setInterval(() => this.requestUpdate(), 1000);
      this.timeoutHandle = undefined;
    }, timeToSecondsChange);
  }

  private mod(a: number, b: number) {
    return ((a % b) + b) % b;
  }

  private timePassed() {
    return new Date().getTime() - this.date.getTime();
  }
}
