/**
 * Axios instance for Frontend-web
 *
 * NOTE: This is a provisional implementation.
 * The full AuthProvider integration will be completed in Phase 14-15
 * once AuthStore and AuthController are copied and adapted.
 */
import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8007/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const WEBSOCKET_URL = (import.meta.env.VITE_WEBSOCKET_URL as string | undefined) ?? 'http://localhost:8007';
