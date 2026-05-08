export const WEBSOCKET_URL =
  (import.meta.env.VITE_WEBSOCKET_URL as string | undefined) ?? 'http://localhost:8007';

export function getServerUrl(): string {
  return WEBSOCKET_URL;
}
