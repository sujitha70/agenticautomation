import { create } from 'zustand';
import api from '../lib/api';
import { subscribeToUser } from '../lib/socket';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  unsubscribeUserSocket: null,

  toggleDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
  setDrawerOpen: (isOpen) => set({ isOpen }),

  initUserNotifications: (userId) => {
    get().fetchNotifications();

    const prevUnsub = get().unsubscribeUserSocket;
    if (prevUnsub) prevUnsub();

    const unsub = subscribeToUser(userId, (newNotif) => {
      set((state) => ({
        notifications: [newNotif, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));
    });

    set({ unsubscribeUserSocket: unsub });
  },

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      const list = res.data.notifications || [];
      const unread = list.filter((n) => !n.read).length;
      set({ notifications: list, unreadCount: unread });
    } catch (_) {}
  },

  markAllRead: async () => {
    try {
      await api.post('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (_) {}
  },
}));
