import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:35000';

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
  findMinimalCoordinates: () => api.post('/operations/api/minimal-coordinates'),
  groupByRating: () => api.post('/operations/api/group-by-rating'),
  countByType: (type) => api.post(`/operations/api/count-by-type?type=${type}`),
  dismissEmployees: (id) => api.post(`/operations/api/dismiss-employees?organizationId=${id}`),
  absorb: (absorbingId, absorbedId) => 
    api.post(`/operations/api/absorb?absorbingId=${absorbingId}&absorbedId=${absorbedId}`),
};

export const referencesApi = {
  getCoordinates: () => api.get('/api/organizations/coordinates'),
  getAddresses: () => api.get('/api/organizations/addresses'),
  getLocations: () => api.get('/api/organizations/locations'),
  getTypes: () => api.get('/api/organizations/types'),
};

const getWsUrl = () => {
  const isSecure = window.location.protocol === 'https:';
  
  if (API_BASE_URL.startsWith('/') || API_BASE_URL.startsWith('./')) {
    const wsProtocol = isSecure ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}/ws`;
  }
  
  const url = new URL(API_BASE_URL);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${url.toString()}/ws`;
};

export const WS_URL = getWsUrl();

