export function registerCustomCard(options: { type: string; name: string; description: string; preview?: boolean }) {
  (window as any).customCards = (window as any).customCards || [];
  (window as any).customCards.push({
    type: options.type,
    name: options.name,
    preview: options.preview ?? false,
    description: options.description,
  });
}
