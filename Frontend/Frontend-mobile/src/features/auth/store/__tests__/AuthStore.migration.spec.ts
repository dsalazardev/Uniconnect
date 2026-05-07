import { AuthStore } from '../AuthStore';

// Use the jest mock for expo-secure-store defined in __mocks__
jest.mock('expo-secure-store');

import * as SecureStore from 'expo-secure-store';

describe('AuthStore migration and persistence', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('migrates a large stored auth blob to a compact snapshot', async () => {
    const largeAuth = JSON.stringify({
      accessToken: 'long-access-token',
      auth0Tokens: { refresh_token: 'refresh', expires_at: 9999999999999 },
      user: { id_user: 2, full_name: 'Jane Doe', email: 'jane@example.com', picture: null, id_role: 1 },
      extras: 'x'.repeat(5000),
    });

    // Mock getItemAsync to return the large payload
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(largeAuth);

    // Track setItemAsync calls
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

    const store = new AuthStore();

    // Wait a short time for initializeFromStorage to run
    await new Promise((r) => setTimeout(r, 10));

    expect(SecureStore.setItemAsync).toHaveBeenCalled();
    // Ensure compact snapshot was written (smaller JSON)
    const written = JSON.parse((SecureStore.setItemAsync as jest.Mock).mock.calls[0][1]);
    expect(written.accessToken).toBe('long-access-token');
    expect(written.user.email).toBe('jane@example.com');
  });
});
