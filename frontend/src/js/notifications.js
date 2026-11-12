import { api } from './api.js';
import { setState } from './state.js';

export async function getNotifications(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      qs.set(k, String(v).trim());
    }
  });
  const queryStr = qs.toString();
  const res = await api.get(`/notifications${queryStr ? `?${queryStr}` : ''}`);
  const unreadCount = res.data?.unreadCount ?? 0;
  setState({ unreadCount });
  return {
    notifications: res.data?.notifications || [],
    unreadCount,
    pagination: res.meta?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
  };
}

export async function markNotificationRead(id) {
  return api.patch(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead() {
  const res = await api.patch('/notifications/read-all', {});
  setState({ unreadCount: 0 });
  return res;
}

