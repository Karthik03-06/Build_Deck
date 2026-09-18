import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Lightweight Frontend API Activity Log for Reproducible Bug Reports
export const clientActivityLog = [];

api.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
    const logItem = {
      timestamp: new Date().toISOString(),
      method: response.config.method?.toUpperCase(),
      path: response.config.url,
      statusCode: response.status,
      duration: `${duration}ms`
    };
    clientActivityLog.unshift(logItem);
    if (clientActivityLog.length > 25) clientActivityLog.pop();
    return response;
  },
  (error) => {
    const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
    const logItem = {
      timestamp: new Date().toISOString(),
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
      path: error.config?.url || 'UNKNOWN',
      statusCode: error.response?.status || 500,
      duration: `${duration}ms`
    };
    clientActivityLog.unshift(logItem);
    if (clientActivityLog.length > 25) clientActivityLog.pop();
    return Promise.reject(error);
  }
);

export default api;
