/**
 * showToast — Web implementation using react-hot-toast
 *
 * Provides success/error/info toast notifications.
 * API matches the existing caller convention: showToast.success(title, message?)
 */

import toast from 'react-hot-toast';

const formatMessage = (title: string, message?: string): string => {
  return message ? `${title}: ${message}` : title;
};

export const showToast = {
  success: (title: string, message?: string): void => {
    toast.success(formatMessage(title, message));
  },
  error: (title: string, message?: string): void => {
    toast.error(formatMessage(title, message));
  },
  info: (title: string, message?: string): void => {
    toast(formatMessage(title, message));
  },
};
