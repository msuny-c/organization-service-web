import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:35000';
const TOKEN_KEY = 'org_app_token';
const USER_KEY = 'org_app_user';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authStorage = {
  set(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};

const toFormData = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
};

export const organizationsApi = {
  getAll: (params) => api.get('/api/organizations', { params }),
  getById: (id) => api.get(`/api/organizations/${id}`),
  create: (data) => api.post('/api/organizations', data),
  update: (id, data) => api.put(`/api/organizations/${id}`, data),
  delete: (id) => api.delete(`/api/organizations/${id}`),
};

export const operationsApi = {
  findMinimalCoordinates: () => api.get('/api/operations/minimal-coordinates'),
  groupByRating: () => api.get('/api/operations/group-by-rating'),
  countByType: (type) => api.get(`/api/operations/count-by-type?type=${type}`),
  dismissEmployees: (id) => api.post(`/api/operations/dismiss-employees?organizationId=${id}`),
  absorb: (absorbingId, absorbedId) => 
    api.post(`/api/operations/absorb?absorbingId=${absorbingId}&absorbedId=${absorbedId}`),
};

export const referencesApi = {
  getCoordinates: () => api.get('/api/coordinates'),
  getAddresses: () => api.get('/api/addresses'),
  getLocations: () => api.get('/api/locations'),
  getTypes: () => api.get('/api/organizations/types'),
};

export const coordinatesApi = {
  getAll: (params) => api.get('/api/coordinates', { params }),
  getById: (id) => api.get(`/api/coordinates/${id}`),
  create: (data) => api.post('/api/coordinates', data),
  update: (id, data) => api.put(`/api/coordinates/${id}`, data),
  delete: (id, body) => api.delete(`/api/coordinates/${id}`, { data: body }),
};

export const addressesApi = {
  getAll: (params) => api.get('/api/addresses', { params }),
  getById: (id) => api.get(`/api/addresses/${id}`),
  create: (data) => api.post('/api/addresses', data),
  update: (id, data) => api.put(`/api/addresses/${id}`, data),
  delete: (id, body) => api.delete(`/api/addresses/${id}`, { data: body }),
};

export const locationsApi = {
  getAll: (params) => api.get('/api/locations', { params }),
  getById: (id) => api.get(`/api/locations/${id}`),
  create: (data) => api.post('/api/locations', data),
  update: (id, data) => api.put(`/api/locations/${id}`, data),
  delete: (id, body) => api.delete(`/api/locations/${id}`, { data: body }),
};

export const importsApi = {
  upload: (file, objectType = 'ORGANIZATION') => {
    const formData = toFormData(file);
    return api.post(`/api/imports?objectType=${encodeURIComponent(objectType)}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  list: () => api.get('/api/imports'),
  getTemplate: (objectType = 'ORGANIZATION') =>
    api.get('/api/imports/template', { responseType: 'blob', params: { objectType } }),
  downloadFile: (id) => api.get(`/api/imports/${id}/file`, { responseType: 'blob' }),
};

export const authApi = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  assumeAdmin: () => api.post('/api/auth/assume-admin'),
  assumeUser: () => api.post('/api/auth/assume-user'),
};

export const cacheApi = {
  getLoggingStatus: () => api.get('/api/cache/statistics/logging'),
  setLoggingStatus: (enabled) => api.post('/api/cache/statistics/logging', null, { params: { enabled } }),
};
