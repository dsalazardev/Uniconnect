import { makeAutoObservable } from 'mobx';

export class NotificationsStore {
  unreadCount: number = 0;

  constructor() {
    makeAutoObservable(this);
  }

  setUnreadCount(count: number) {
    this.unreadCount = count;
  }

  increment() {
    this.unreadCount++;
  }

  decreaseUnread() {
    this.unreadCount = Math.max(this.unreadCount - 1, 0);
  }

  reset() {
    this.unreadCount = 0;
  }
}

export const notificationsStore = new NotificationsStore();