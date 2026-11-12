import { api, fetchCsrfToken, setUnauthorizedHandler } from './api.js';
import { setState, store } from './state.js';

setUnauthorizedHandler(() => {
  if (store.user) {
    setState({ user: null, unreadCount: 0 });
  }
});

export async function initAuth() {
  try {
    await fetchCsrfToken();
    const res = await api.get('/auth/me');
    setState({ user: res.data.user, authChecked: true });
    refreshUnreadCount();
  } catch {
    setState({ user: null, authChecked: true, unreadCount: 0 });
  }
}

export async function refreshUnreadCount() {
  if (!store.user) {
    setState({ unreadCount: 0 });
    return;
  }
  try {
    const res = await api.get('/notifications?limit=1');
    setState({ unreadCount: res.data?.unreadCount || 0 });
  } catch {
    // ignore background badge refresh failure
  }
}

export async function login(credentials) {
  const res = await api.post('/auth/login', credentials);
  setState({ user: res.data.user, authChecked: true });
  await refreshUnreadCount();
  return res.data.user;
}

export async function register(payload) {
  const res = await api.post('/auth/register', payload);
  setState({ user: res.data.user, authChecked: true });
  await refreshUnreadCount();
  return res.data.user;
}

export async function logout() {
  try {
    await api.post('/auth/logout', {});
  } finally {
    setState({ user: null, unreadCount: 0 });
  }
}

export async function refreshCurrentUser() {
  try {
    const res = await api.get('/auth/me');
    setState({ user: res.data.user });
    return res.data.user;
  } catch {
    setState({ user: null, unreadCount: 0 });
    return null;
  }
}

