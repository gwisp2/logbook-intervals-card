import { FrontendLocaleData, HomeAssistant, LocalizeFunc } from 'custom-card-helpers';

export interface FormatContext {
  locale: FrontendLocaleData;
  localize: LocalizeFunc;
}

export function createFormatContext(hass: HomeAssistant): FormatContext {
  return {
    locale: hass.locale,
    localize: hass.localize,
  };
}
