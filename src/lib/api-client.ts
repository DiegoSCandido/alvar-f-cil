const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  // Adiciona token ao header se existir
  const token = localStorage.getItem('authToken');
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);

  // Se receber 401, significa que o token expirou
  if (response.status === 401) {
    // Limpa o localStorage e redireciona para login
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/';
    throw new Error('Sessão expirada. Por favor, faça login novamente.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `API error: ${response.statusText}`);
  }

  if (response.status === 204) {
    return null as any;
  }

  return response.json();
}

// Clientes
export const clienteAPI = {
  list: () => apiCall('/clientes'),
  get: (id: string) => apiCall(`/clientes/${id}`),
  create: (data: any) => apiCall('/clientes', { method: 'POST', body: data }),
  update: (id: string, data: any) => apiCall(`/clientes/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiCall(`/clientes/${id}`, { method: 'DELETE' }),
  getByCnpj: (cnpj: string) => apiCall(`/clientes/search/cnpj/${cnpj}`),
};

// Alvaras
export const alvaraAPI = {
  list: () => apiCall('/alvaras'),
  get: (id: string) => apiCall(`/alvaras/${id}`),
  create: (data: any) => apiCall('/alvaras', { method: 'POST', body: data }),
  update: (id: string, data: any) => apiCall(`/alvaras/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiCall(`/alvaras/${id}`, { method: 'DELETE' }),
  listByCliente: (clienteId: string) => apiCall(`/alvaras/cliente/${clienteId}`),
};

// Documents
export const documentAPI = {
  list: () => apiCall('/documents'),
  listByAlvara: (alvaraId: string) => apiCall(`/documents/alvara/${alvaraId}`),
  listByCliente: (clienteId: string) => apiCall(`/documents/cliente/${clienteId}`),
  delete: (id: string) => apiCall(`/documents/${id}`, { method: 'DELETE' }),
  download: (id: string) => `${API_BASE_URL}/documents/${id}/download`,
  upload: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },
};
// Atividades Secundárias
export const atividadeSecundariaAPI = {
  listByCliente: (clienteId: string) => apiCall(`/atividades-secundarias/cliente/${clienteId}`),
  create: (clienteId: string, data: any) => apiCall(`/atividades-secundarias/${clienteId}`, { method: 'POST', body: data }),
  update: (id: string, data: any) => apiCall(`/atividades-secundarias/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) => apiCall(`/atividades-secundarias/${id}`, { method: 'DELETE' }),
};

// Documentos do Cliente
export const documentoClienteAPI = {
  listByCliente: (clienteId: string) => apiCall(`/documentos-cliente/cliente/${clienteId}`),
  create: (clienteId: string, data: any) => apiCall(`/documentos-cliente/${clienteId}`, { method: 'POST', body: data }),
  delete: (id: string) => apiCall(`/documentos-cliente/${id}`, { method: 'DELETE' }),
  download: (id: string) => `${API_BASE_URL}/documentos-cliente/download/${id}`,
};