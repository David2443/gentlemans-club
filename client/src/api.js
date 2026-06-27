const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

export const apiFetch = async (path, options = {}) => {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {})
    }
  });

  const data = await safeJson(response);

  if (!response.ok || data?.succes === false) {
    throw new ApiError(
      data?.mesaj || data?.message || 'Eroare la cererea către server.',
      response.status,
      data
    );
  }

  return data;
};

export const apiGet = (path, options = {}) => {
  return apiFetch(path, {
    ...options,
    method: 'GET'
  });
};

export const apiPost = (path, body, options = {}) => {
  return apiFetch(path, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body || {})
  });
};

export const apiPatch = (path, body, options = {}) => {
  return apiFetch(path, {
    ...options,
    method: 'PATCH',
    body: body instanceof FormData ? body : JSON.stringify(body || {})
  });
};

export const apiDelete = (path, options = {}) => {
  return apiFetch(path, {
    ...options,
    method: 'DELETE'
  });
};

export const getMe = () => {
  return apiGet('/api/me');
};

export const loginRequest = (username, password) => {
  return apiPost('/api/login', {
    username,
    password
  });
};

export const logoutRequest = () => {
  return apiPost('/api/logout', {});
};

export const getApiBase = () => API_BASE;