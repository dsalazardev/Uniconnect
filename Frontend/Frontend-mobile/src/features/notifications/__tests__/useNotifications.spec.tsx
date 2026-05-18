import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

// Reset modules so our manual mocks apply cleanly
jest.resetModules();

// Mocks for native modules used by the hook
jest.mock('expo-device', () => ({ isDevice: true, osName: 'Android' }));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
}));

// Mock the notifications service to ensure no real network calls
jest.mock('../services', () => ({
  notificationsService: { registerExpoPushToken: jest.fn() },
}));

import * as Notifications from 'expo-notifications';
import { useRegisterPushToken } from '../hooks/useNotifications';

describe('useRegisterPushToken', () => {
  beforeEach(() => {
    // Ensure DEV mode is enabled for the warning path
    (global as any).__DEV__ = true;
    // Prepare mocks: permissions granted, but token call throws
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(new Error('FCM not configured'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('does not throw and logs a developer warning when getExpoPushTokenAsync fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const TestComp: React.FC<{ token: string }> = ({ token }) => {
      useRegisterPushToken(token);
      return null;
    };

    render(<TestComp token="fake-token" />);

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalled();
    });

    warnSpy.mockRestore();
  });
});
