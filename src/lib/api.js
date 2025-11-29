import axios from 'axios';

const API_BASE_URL = 'http://localhost:35000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  getAll: () => api.get('/api/coordinates'),
  getById: (id) => api.get(`/api/coordinates/${id}`),
  create: (data) => api.post('/api/coordinates', data),
  update: (id, data) => api.put(`/api/coordinates/${id}`, data),
  delete: (id) => api.delete(`/api/coordinates/${id}`),
};

export const addressesApi = {
  getAll: () => api.get('/api/addresses'),
  getById: (id) => api.get(`/api/addresses/${id}`),
  create: (data) => api.post('/api/addresses', data),
  update: (id, data) => api.put(`/api/addresses/${id}`, data),
  delete: (id) => api.delete(`/api/addresses/${id}`),
};

export const locationsApi = {
  getAll: () => api.get('/api/locations'),
  getById: (id) => api.get(`/api/locations/${id}`),
  create: (data) => api.post('/api/locations', data),
  update: (id, data) => api.put(`/api/locations/${id}`, data),
  delete: (id) => api.delete(`/api/locations/${id}`),
};
