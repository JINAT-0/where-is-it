import { api } from './api.js';

export async function getMyClaims(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== '') {
      qs.set(k, String(v).trim());
    }
  });
  const queryStr = qs.toString();
  const res = await api.get(`/claims/my${queryStr ? `?${queryStr}` : ''}`);
  return {
    claims: res.data?.claims || [],
    pagination: res.meta?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export async function createClaim(formData) {
  const res = await api.post('/claims', formData);
  return res.data?.claim;
}

export async function getClaimById(id) {
  const res = await api.get(`/claims/${id}`);
  return res.data?.claim;
}

export async function withdrawClaim(id) {
  const res = await api.put(`/claims/${id}/withdraw`, {});
  return res.data?.claim;
}

