import { reaction } from 'mobx';
import { authStore } from '../store/AuthStore';

const AUTH_INIT_TIMEOUT_MS = 5000;

export async function waitForAuth(): Promise<void> {
  if (authStore.isInitialized) return;

  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      disposer();
      resolve();
    }, AUTH_INIT_TIMEOUT_MS);

    const disposer = reaction(
      () => authStore.isInitialized,
      (initialized) => {
        if (initialized) {
          clearTimeout(timer);
          disposer();
          resolve();
        }
      },
      { fireImmediately: true }
    );
  });
}
