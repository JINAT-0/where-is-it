import { api } from './api.js';
import { setState, store } from './state.js';

function buildQs(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      qs.set(k, String(v).trim());
    }
  });
  const s = qs.toString();
  return s ? `?${s}` : '';
}

// User Dashboard & Profile APIs
export async function getUserDashboard() {
  const res = await api.get('/users/dashboard');
  return res.data;
}

export async function getProfile() {
  const res = await api.get('/users/profile');
  return res.data.user;
}

export async function updateProfile(payload) {
  const res = await api.put('/users/profile', payload);
  if (res.data?.user) {
    setState({ user: res.data.user });
  }
  return res.data.user;
}

export async function changePassword(payload) {
  return api.put('/users/change-password', payload);
}

// Admin Dashboard APIs
export async function getAdminDashboard() {
  const res = await api.get('/admin/dashboard');
  return res.data;
}

export async function getAdminUsers(params = {}) {
  const res = await api.get(`/admin/users${buildQs(params)}`);
  return {
    users: res.data?.users || [],
    pagination: res.meta?.pagination,
  };
}

export async function updateAdminUserStatus(userId, account_status) {
  const res = await api.patch(`/admin/users/${userId}/status`, { account_status });
  return res.data.user;
}

export async function getAdminItems(params = {}) {
  const res = await api.get(`/admin/items${buildQs(params)}`);
  return {
    items: res.data?.items || [],
    pagination: res.meta?.pagination,
  };
}

export async function approveAdminItem(itemId) {
  const res = await api.patch(`/admin/items/${itemId}/approve`, {});
  return res.data.item;
}

export async function rejectAdminItem(itemId, rejection_reason) {
  const res = await api.patch(`/admin/items/${itemId}/reject`, { rejection_reason });
  return res.data.item;
}

export async function markAdminItemReturned(itemId) {
  const res = await api.patch(`/admin/items/${itemId}/return`, {});
  return res.data.item;
}

export async function deleteAdminItem(itemId) {
  return api.delete(`/admin/items/${itemId}`);
}

export async function getAdminClaims(params = {}) {
  const res = await api.get(`/admin/claims${buildQs(params)}`);
  return {
    claims: res.data?.claims || [],
    pagination: res.meta?.pagination,
  };
}

export async function approveAdminClaim(claimId, admin_notes = '') {
  const res = await api.patch(`/admin/claims/${claimId}/approve`, { admin_notes });
  return res.data.claim;
}

export async function rejectAdminClaim(claimId, admin_notes = '') {
  const res = await api.patch(`/admin/claims/${claimId}/reject`, { admin_notes });
  return res.data.claim;
}

export async function completeAdminClaimReturn(claimId, admin_notes = '') {
  const res = await api.patch(`/admin/claims/${claimId}/complete`, { admin_notes });
  return res.data.claim;
}

export async function getAdminCategories() {
  const res = await api.get('/admin/categories');
  return res.data?.categories || [];
}

export async function createAdminCategory(payload) {
  const res = await api.post('/admin/categories', payload);
  setState({ categories: [] });
  return res.data.category;
}

export async function updateAdminCategory(id, payload) {
  const res = await api.put(`/admin/categories/${id}`, payload);
  setState({ categories: [] });
  return res.data.category;
}

export async function deleteAdminCategory(id) {
  const res = await api.delete(`/admin/categories/${id}`);
  if (store.categories.length > 0) setState({ categories: [] });
  return res;
}

export async function getAdminActivityLogs(params = {}) {
  const res = await api.get(`/admin/activity-logs${buildQs(params)}`);
  return {
    logs: res.data?.logs || [],
    pagination: res.meta?.pagination,
  };
}

export async function getAdminSettings() {
  const res = await api.get('/admin/settings');
  return res.data?.settings || {};
}

export async function updateAdminSettings(settings) {
  const res = await api.put('/admin/settings', { settings });
  return res.data?.settings || {};
}

export async function broadcastAdminAnnouncement(payload) {
  return api.post('/admin/announcements', payload);
}

