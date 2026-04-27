import { create } from 'zustand';

interface NotificationsState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decreaseUnread: () => void;
  resetUnread: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: count }),

  decreaseUnread: () =>
    set((state) => ({
      unreadCount: Math.max(state.unreadCount - 1, 0),
    })),

  resetUnread: () => set({ unreadCount: 0 }),
}));