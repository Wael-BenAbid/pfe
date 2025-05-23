import { tracedFetch, createSpan } from './zipkin';

// URL de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
console.log('API Base URL:', API_BASE_URL);

// Fonction pour construire l'URL complète
const buildUrl = (endpoint: string): string => {
  // Si l'endpoint commence déjà par http, on le retourne tel quel
  if (endpoint.startsWith('http')) {
    return endpoint;
  }

  // Sinon, on construit l'URL complète
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

// Fonction pour effectuer une requête GET avec traçage
export const get = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = buildUrl(endpoint);

  return createSpan(`GET ${endpoint}`, async () => {
    const response = await tracedFetch(url, {
      method: 'GET',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  });
};

// Fonction pour effectuer une requête POST avec traçage
export const post = async <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> => {
  const url = buildUrl(endpoint);

  return createSpan(`POST ${endpoint}`, async () => {
    const response = await tracedFetch(url, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  });
};

// Fonction pour effectuer une requête PUT avec traçage
export const put = async <T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> => {
  const url = buildUrl(endpoint);

  return createSpan(`PUT ${endpoint}`, async () => {
    const response = await tracedFetch(url, {
      method: 'PUT',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  });
};

// Fonction pour effectuer une requête DELETE avec traçage
export const del = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = buildUrl(endpoint);

  return createSpan(`DELETE ${endpoint}`, async () => {
    const response = await tracedFetch(url, {
      method: 'DELETE',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  });
};

export default {
  get,
  post,
  put,
  delete: del
};
