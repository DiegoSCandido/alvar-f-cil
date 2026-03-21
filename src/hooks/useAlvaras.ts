import { useState, useEffect, useMemo } from "react";
import { Alvara, AlvaraFormData, AlvaraStatus } from "@/types/alvara";
import { calculateAlvaraStatus } from "@/lib/alvara-utils";
import { alvaraAPI } from "@/lib/api-client";

type ApiAlvara = Partial<Alvara> & {
  id?: string | number;
  clienteId?: string | number;
  cliente_id?: string | number;
  clientName?: string;
  client_name?: string;
  clientCnpj?: string;
  client_cnpj?: string;
  type?: string;
  tipo?: string;
  requestDate?: string | Date;
  request_date?: string | Date;
  issueDate?: string | Date | null;
  issue_date?: string | Date | null;
  expirationDate?: string | Date | null;
  expiration_date?: string | Date | null;
  processingStatus?: Alvara["processingStatus"];
  processing_status?: Alvara["processingStatus"];
  notes?: string;
  observacoes?: string;
  taxasPorAno?: Alvara["taxasPorAno"];
  taxas_por_ano?: Alvara["taxasPorAno"];
  isento?: boolean;
  semPontoFixo?: boolean;
  sem_ponto_fixo?: boolean;
  createdAt?: string | Date;
  created_at?: string | Date;
  updatedAt?: string | Date;
  updated_at?: string | Date;
  cliente?: {
    id?: string | number;
    cnpj?: string;
    razaoSocial?: string;
    nomeFantasia?: string;
  };
  client?: {
    id?: string | number;
    cnpj?: string;
    razaoSocial?: string;
    nomeFantasia?: string;
  };
};

const toDateOrUndefined = (value: unknown) => {
  if (!value) return undefined;
  const parsed = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeAlvara = (apiAlvara: ApiAlvara): Alvara => {
  const cliente = apiAlvara.cliente || apiAlvara.client;
  const clienteId =
    apiAlvara.clienteId ?? apiAlvara.cliente_id ?? cliente?.id ?? "";
  const clientName =
    apiAlvara.clientName ??
    apiAlvara.client_name ??
    cliente?.razaoSocial ??
    cliente?.nomeFantasia ??
    "";
  const clientCnpj =
    apiAlvara.clientCnpj ?? apiAlvara.client_cnpj ?? cliente?.cnpj ?? "";
  const requestDate =
    toDateOrUndefined(apiAlvara.requestDate ?? apiAlvara.request_date) ||
    new Date();
  const issueDate = toDateOrUndefined(
    apiAlvara.issueDate ?? apiAlvara.issue_date,
  );
  const expirationDate = toDateOrUndefined(
    apiAlvara.expirationDate ?? apiAlvara.expiration_date,
  );

  const normalized: Alvara = {
    id: String(apiAlvara.id ?? ""),
    clienteId: String(clienteId),
    clientName,
    clientCnpj,
    type: (apiAlvara.type ?? apiAlvara.tipo ?? "") as Alvara["type"],
    requestDate,
    issueDate,
    expirationDate,
    status: "pending",
    processingStatus: apiAlvara.processingStatus ?? apiAlvara.processing_status,
    notes: apiAlvara.notes ?? apiAlvara.observacoes,
    taxasPorAno: apiAlvara.taxasPorAno ?? apiAlvara.taxas_por_ano,
    isento: apiAlvara.isento,
    semPontoFixo: apiAlvara.semPontoFixo ?? apiAlvara.sem_ponto_fixo,
    createdAt: apiAlvara.createdAt ?? apiAlvara.created_at,
    updatedAt: apiAlvara.updatedAt ?? apiAlvara.updated_at,
  };

  return {
    ...normalized,
    status: calculateAlvaraStatus(normalized),
  };
};

export function useAlvaras() {
  const [alvaras, setAlvaras] = useState<Alvara[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load alvaras from API on mount
  useEffect(() => {
    loadAlvaras();
  }, []);

  const loadAlvaras = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await alvaraAPI.list();
      const updated = Array.isArray(data)
        ? data.map((a: ApiAlvara) => normalizeAlvara(a))
        : [];
      setAlvaras(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao carregar alvarás";
      setError(message);
      console.error("Erro ao carregar alvarás:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addAlvara = async (data: AlvaraFormData) => {
    try {
      setError(null);
      const newAlvara = await alvaraAPI.create(data);
      const updated = normalizeAlvara(newAlvara as ApiAlvara);
      setAlvaras((prev) => [...prev, updated]);
      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao criar alvará";
      setError(message);
      throw err;
    }
  };

  const updateAlvara = async (id: string, data: AlvaraFormData) => {
    try {
      setError(null);
      const updatedAlvara = await alvaraAPI.update(id, data);
      const updated = normalizeAlvara(updatedAlvara as ApiAlvara);
      setAlvaras((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao atualizar alvará";
      setError(message);
      throw err;
    }
  };

  const deleteAlvara = async (id: string) => {
    try {
      setError(null);
      await alvaraAPI.delete(id);
      setAlvaras((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao deletar alvará";
      setError(message);
      throw err;
    }
  };

  const stats = useMemo(() => {
    return {
      total: alvaras.length,
      pending: alvaras.filter((a) => a.status === "pending").length,
      valid: alvaras.filter((a) => a.status === "valid").length,
      expiring: alvaras.filter((a) => a.status === "expiring").length,
      expired: alvaras.filter((a) => a.status === "expired").length,
    };
  }, [alvaras]);

  return {
    alvaras,
    stats,
    isLoading,
    error,
    addAlvara,
    updateAlvara,
    deleteAlvara,
    refetch: loadAlvaras,
  };
}
