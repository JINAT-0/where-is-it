import { api } from './api.js';
import { setState, store } from './state.js';

export async function getCategories(force = false) {
  if (!force && store.categories.length > 0) {
    return store.categories;
  }
  const res = await api.get('/categories');
  const categories = res.data?.categories || [];
  setState({ categories });
  return categories;
}

export async function getItems(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      qs.set(k, String(v).trim());
    }
  });
  const queryStr = qs.toString();
  const res = await api.get(`/items${queryStr ? `?${queryStr}` : ''}`);
  return {
    items: res.data?.items || [],
    pagination: res.meta?.pagination || { page: 1, limit: 12, total: 0, totalPages: 1 },
  };
}

export async function getMyItems(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      qs.set(k, String(v).trim());
    }
  });
  const queryStr = qs.toString();
  const res = await api.get(`/items/my${queryStr ? `?${queryStr}` : ''}`);
  return {
    items: res.data?.items || [],
    pagination: res.meta?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export async function getItemById(id) {
  const res = await api.get(`/items/${id}`);
  return res.data?.item;
}

export async function createItem(formData) {
  const res = await api.post('/items', formData);
  return res.data?.item;
}

export async function updateItem(id, formData) {
  const res = await api.put(`/items/${id}`, formData);
  return res.data?.item;
}

export async function deleteItem(id) {
  return api.delete(`/items/${id}`);
}

