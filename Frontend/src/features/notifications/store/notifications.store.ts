import { create } from 'zustand';
import { notificationsService } from '../services/notifications.service';

interface NotificationsState {
  unreadCount: number;
  lastUpdated: number;
  setUnreadCount: (count: number) => void;
  decreaseUnread: () => void;
  resetUnread: () => void;
  fetchUnreadCount: (token: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  unreadCount: 0,
  lastUpdated: 0,

  setUnreadCount: (count) => {
    const timestamp = Date.now();
    set({ unreadCount: count, lastUpdated: timestamp });
  },

  decreaseUnread: () => {
    const timestamp = Date.now();
    set((state) => ({
      unreadCount: Math.max(state.unreadCount - 1, 0),
      lastUpdated: timestamp,
    }));
  },

  resetUnread: () => {
    const timestamp = Date.now();
    set({ unreadCount: 0, lastUpdated: timestamp });
  },

  fetchUnreadCount: async (token: string) => {
    const timestamp = Date.now();
    try {
      const { count } = await notificationsService.getUnreadCount(token);
      
      // Only update if this is newer than last update (prevent race conditions)
      if (timestamp > get().lastUpdated) {
        set({ unreadCount: count, lastUpdated: timestamp });
      } else {
        console.log('🔍 [Notifications] Ignoring stale update:', { timestamp, lastUpdated: get().lastUpdated });
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      set({ unreadCount: 0, lastUpdated: timestamp });
    }
  },
}));