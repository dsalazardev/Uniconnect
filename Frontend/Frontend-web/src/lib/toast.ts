/**
 * showToast — Web implementation
 * Replaces react-native-flash-message for the web platform.
 * TODO: integrate react-hot-toast or similar in a future phase.
 */
const toast = (type: 'success' | 'error' | 'info', title: string, message?: string): void => {
  const text = message ? `${title}: ${message}` : title;
  if (type === 'error') {
    console.error(`[Toast Error] ${text}`);
  } else {
    console.info(`[Toast ${type}] ${text}`);
  }
};

export const showToast = {
  success: (title: string, message?: string): void => toast('success', title, message),
  error: (title: string, message?: string): void => toast('error', title, message),
  info: (title: string, message?: string): void => toast('info', title, message),
};
