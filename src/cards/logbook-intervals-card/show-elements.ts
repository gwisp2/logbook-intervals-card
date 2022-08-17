export const SHOW_ELEMENTS = [
  'state',
  'duration',
  'start_date',
  'end_date',
  'icon',
  'separator',
  'entity_name',
] as const;
export type ShowElement = typeof SHOW_ELEMENTS[number];
