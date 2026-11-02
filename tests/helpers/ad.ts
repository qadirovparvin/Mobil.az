/**
 * tests/helpers/ad.ts
 * Ad catalogue helpers for testing ad search, listings, and details
 */

import { apiRequest } from './api';

export interface AdItem {
  _id: string;
  id?: number | string;
  title: string;
  price: number;
  category: string;
  brand?: string;
  city?: string;
  images?: string[];
  views?: number;
  isVip?: boolean;
}

export async function fetchAds(params: Record<string, string | number> = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    query.set(k, String(v));
  });
  const qs = query.toString();
  const endpoint = qs ? `/api/ads?${qs}` : '/api/ads';
  return apiRequest(endpoint);
}

export async function fetchPhoneAds() {
  return fetchAds({ category: 'phone' });
}

export async function fetchAdDetails(id: string) {
  return apiRequest(`/api/ads/${id}`);
}
