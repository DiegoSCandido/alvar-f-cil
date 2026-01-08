import { useState, useEffect, useMemo } from 'react';
import { Alvara, AlvaraFormData, AlvaraStatus } from '@/types/alvara';
import { calculateAlvaraStatus, generateId } from '@/lib/alvara-utils';

const STORAGE_KEY = 'alvaras-data';

// Sample data for demonstration - removido pois agora precisa de clienteId válido
const sampleAlvaras: Alvara[] = [];

export function useAlvaras() {
  const [alvaras, setAlvaras] = useState<Alvara[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Recalculate status for each alvara
        const updated = parsed.map((a: Alvara) => ({
          ...a,
          requestDate: new Date(a.requestDate),
          issueDate: a.issueDate ? new Date(a.issueDate) : undefined,
          expirationDate: a.expirationDate ? new Date(a.expirationDate) : undefined,
          status: calculateAlvaraStatus(a),
        }));
        setAlvaras(updated);
      } catch (e) {
        setAlvaras(sampleAlvaras);
      }
    } else {
      // Use sample data for demonstration
      setAlvaras(sampleAlvaras.map((a) => ({ ...a, status: calculateAlvaraStatus(a) })));
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage when alvaras change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alvaras));
    }
  }, [alvaras, isLoading]);

  const addAlvara = (data: AlvaraFormData, getClienteById?: (id: string) => { nomeFantasia: string; cnpj: string } | undefined) => {
    const cliente = getClienteById?.(data.clienteId);
    const newAlvara: Alvara = {
      id: generateId(),
      clienteId: data.clienteId,
      clientName: cliente?.nomeFantasia || '',
      clientCnpj: cliente?.cnpj || '',
      type: data.type,
      requestDate: data.requestDate,
      issueDate: data.issueDate,
      expirationDate: data.expirationDate,
      notes: data.notes,
      status: 'pending',
    };
    newAlvara.status = calculateAlvaraStatus(newAlvara);
    setAlvaras((prev) => [...prev, newAlvara]);
  };

  const updateAlvara = (id: string, data: AlvaraFormData, getClienteById?: (id: string) => { nomeFantasia: string; cnpj: string } | undefined) => {
    setAlvaras((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const cliente = getClienteById?.(data.clienteId);
          const updated: Alvara = {
            ...a,
            clienteId: data.clienteId,
            clientName: cliente?.nomeFantasia || a.clientName,
            clientCnpj: cliente?.cnpj || a.clientCnpj,
            type: data.type,
            requestDate: data.requestDate,
            issueDate: data.issueDate,
            expirationDate: data.expirationDate,
            notes: data.notes,
          };
          updated.status = calculateAlvaraStatus(updated);
          return updated;
        }
        return a;
      })
    );
  };

  const deleteAlvara = (id: string) => {
    setAlvaras((prev) => prev.filter((a) => a.id !== id));
  };

  const stats = useMemo(() => {
    return {
      total: alvaras.length,
      pending: alvaras.filter((a) => a.status === 'pending').length,
      valid: alvaras.filter((a) => a.status === 'valid').length,
      expiring: alvaras.filter((a) => a.status === 'expiring').length,
      expired: alvaras.filter((a) => a.status === 'expired').length,
    };
  }, [alvaras]);

  return {
    alvaras,
    stats,
    isLoading,
    addAlvara,
    updateAlvara,
    deleteAlvara,
  };
}
