const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function toIsoString(value: unknown): string | undefined {
  if (!value) return undefined;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  }

  return undefined;
}

function removeUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => removeUndefined(item)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const entries = Object.entries(value)
    .filter(([, entryValue]) => entryValue !== undefined)
    .map(([key, entryValue]) => [key, removeUndefined(entryValue)]);

  return Object.fromEntries(entries) as T;
}

function serializeAlvaraPayload(body: Record<string, unknown>) {
  const clienteId = body.clienteId;
  const serializedClienteId =
    typeof clienteId === "string" && /^\d+$/.test(clienteId)
      ? Number(clienteId)
      : clienteId;

  const taxasPorAno = Array.isArray(body.taxasPorAno)
    ? body.taxasPorAno.map((taxa) => {
        if (!isPlainObject(taxa)) return taxa;

        return removeUndefined({
          ...taxa,
          dataTaxaEnviada: toIsoString(taxa.dataTaxaEnviada),
          dataTaxaPaga: toIsoString(taxa.dataTaxaPaga),
        });
      })
    : body.taxasPorAno;

  return removeUndefined({
    ...body,
    clienteId: serializedClienteId,
    requestDate: toIsoString(body.requestDate),
    issueDate: toIsoString(body.issueDate),
    expirationDate: toIsoString(body.expirationDate),
    taxasPorAno,
  });
}

function serializeRequestBody(body: any) {
  if (!isPlainObject(body)) {
    return body;
  }

  if ("clienteId" in body && "type" in body && "requestDate" in body) {
    return serializeAlvaraPayload(body);
  }

  return removeUndefined(body);
}

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function apiCall<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  // Adiciona token ao header se existir
  const token = localStorage.getItem("authToken");
  console.log(`[apiCall] Endpoint: ${endpoint}, Token disponível: ${!!token}`);
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const config: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(serializeRequestBody(body));
  }

  const response = await fetch(url, config);

  // Se receber 401, significa que o token expirou
  if (response.status === 401) {
    // Limpa o localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loginTime");

    // Só redireciona se não estiver já na página de login para evitar loops
    if (
      window.location.pathname !== "/" &&
      !window.location.pathname.includes("/login")
    ) {
      window.location.href = "/";
    }

    throw new Error("Sessão expirada. Por favor, faça login novamente.");
  }

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    // Se for erro de validação do Zod, mostrar detalhes
    if (errorBody.details && Array.isArray(errorBody.details)) {
      const details = errorBody.details
        .map((d: any) => `${d.path.join(".")}: ${d.message}`)
        .join(", ");
      throw new Error(`Erro de validação: ${details}`);
    }
    const errorMsg =
      typeof errorBody.message === "string"
        ? errorBody.message
        : typeof errorBody.error === "string"
          ? errorBody.error
          : `API error: ${response.statusText}`;
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null as any;
  }

  return response.json();
}

// Auth
export const authAPI = {
  changePassword: (currentPassword: string, newPassword: string) =>
    apiCall("/auth/change-password", {
      method: "PUT",
      body: { currentPassword, newPassword },
    }),
};

// Clientes
export const clienteAPI = {
  list: (params?: { coluna?: string; opcao?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.coluna) searchParams.set("coluna", params.coluna);
    if (params?.opcao) searchParams.set("opcao", params.opcao);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return apiCall(`/clientes${qs}`);
  },
  get: (id: string) => apiCall(`/clientes/${id}`),
  create: (data: any) => apiCall("/clientes", { method: "POST", body: data }),
  update: (id: string, data: any) =>
    apiCall(`/clientes/${id}`, { method: "PUT", body: data }),
  delete: (id: string) => apiCall(`/clientes/${id}`, { method: "DELETE" }),
  getByCnpj: (cnpj: string) => apiCall(`/clientes/search/cnpj/${cnpj}`),
};

// Alvaras
export const alvaraAPI = {
  list: () => apiCall("/alvaras"),
  get: (id: string) => apiCall(`/alvaras/${id}`),
  create: (data: any) => apiCall("/alvaras", { method: "POST", body: data }),
  update: (id: string, data: any) =>
    apiCall(`/alvaras/${id}`, { method: "PUT", body: data }),
  delete: (id: string) => apiCall(`/alvaras/${id}`, { method: "DELETE" }),
  listByCliente: (clienteId: string) =>
    apiCall(`/alvaras/cliente/${clienteId}`),
};

// Documents
export const documentAPI = {
  list: () => apiCall("/documents"),
  listByAlvara: (alvaraId: string) => apiCall(`/documents/alvara/${alvaraId}`),
  listByCliente: (clienteId: string) =>
    apiCall(`/documents/cliente/${clienteId}`),
  delete: (id: string) => apiCall(`/documents/${id}`, { method: "DELETE" }),
  download: (id: string) => `${API_BASE_URL}/documents/${id}/download`,
  upload: async (formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || "Upload failed");
    }

    return response.json();
  },
};
// Atividades Secundárias
export const atividadeSecundariaAPI = {
  listByCliente: (clienteId: string) =>
    apiCall(`/atividades-secundarias/cliente/${clienteId}`),
  create: (clienteId: string, data: any) =>
    apiCall(`/atividades-secundarias/${clienteId}`, {
      method: "POST",
      body: data,
    }),
  update: (id: string, data: any) =>
    apiCall(`/atividades-secundarias/${id}`, { method: "PUT", body: data }),
  delete: (id: string) =>
    apiCall(`/atividades-secundarias/${id}`, { method: "DELETE" }),
};

// Documentos do Cliente
export const documentoClienteAPI = {
  listByCliente: (clienteId: string) =>
    apiCall(`/documentos-cliente/cliente/${clienteId}`),
  create: (clienteId: string, data: any) =>
    apiCall(`/documentos-cliente/${clienteId}`, { method: "POST", body: data }),
  delete: (id: string) =>
    apiCall(`/documentos-cliente/${id}`, { method: "DELETE" }),
  download: (id: string) => `${API_BASE_URL}/documentos-cliente/download/${id}`,
};

// Taxas de Funcionamento
export const taxaAPI = {
  list: (ano?: number) => apiCall(`/taxas${ano ? `?ano=${ano}` : ""}`),
  get: (id: string) => apiCall(`/taxas/${id}`),
  create: (data: any) => apiCall("/taxas", { method: "POST", body: data }),
  update: (id: string, data: any) =>
    apiCall(`/taxas/${id}`, { method: "PUT", body: data }),
  delete: (id: string) => apiCall(`/taxas/${id}`, { method: "DELETE" }),
};
