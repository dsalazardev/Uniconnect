import { makeAutoObservable } from 'mobx';

export class NotificationsStore {
  unreadCount: number = 0;
  lastNotificationId: number | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setUnreadCount(count: number) {
    this.unreadCount = count;
  }

  setLastNotificationId(id: number | null) {
    this.lastNotificationId = id;
  }

  increment() {
    this.unreadCount++;
  }

  decreaseUnread() {
    this.unreadCount = Math.max(this.unreadCount - 1, 0);
  }

  reset() {
    this.unreadCount = 0;
    this.lastNotificationId = null;
  }
}

export const notificationsStore = new NotificationsStore();