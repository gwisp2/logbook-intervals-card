declare global {
  interface Window {
    customCards: { type: string; name: string; preview: boolean; description: string }[];
  }
}

export function registerCustomCard(options: { type: string; name: string; description: string; preview?: boolean }) {
  window.customCards = window.customCards ?? [];
  window.customCards.push({
    type: options.type,
    name: options.name,
    preview: options.preview ?? false,
    description: options.description,
  });
}
