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
  findMinimalCoordinates: () => api.post('/api/operations/minimal-coordinates'),
  groupByRating: () => api.post('/api/operations/group-by-rating'),
  countByType: (type) => api.post(`/api/operations/count-by-type?type=${type}`),
  dismissEmployees: (id) => api.post(`/api/operations/dismiss-employees?organizationId=${id}`),
  absorb: (absorbingId, absorbedId) => 
    api.post(`/api/operations/absorb?absorbingId=${absorbingId}&absorbedId=${absorbedId}`),
};

export const referencesApi = {
  getCoordinates: () => api.get('/api/organizations/coordinates'),
  getAddresses: () => api.get('/api/organizations/addresses'),
  getLocations: () => api.get('/api/organizations/locations'),
  getTypes: () => api.get('/api/organizations/types'),
};

