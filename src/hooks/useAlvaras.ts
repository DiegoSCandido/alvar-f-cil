import { useState, useEffect, useMemo } from 'react';
import { Alvara, AlvaraFormData, AlvaraStatus } from '@/types/alvara';
import { calculateAlvaraStatus } from '@/lib/alvara-utils';
import { alvaraAPI } from '@/lib/api-client';

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
      // Recalculate status for each alvara
      const updated = data.map((a: Alvara) => ({
        ...a,
        requestDate: new Date(a.requestDate),
        issueDate: a.issueDate ? new Date(a.issueDate) : undefined,
        expirationDate: a.expirationDate ? new Date(a.expirationDate) : undefined,
        status: calculateAlvaraStatus(a),
      }));
      setAlvaras(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar alvarás';
      setError(message);
      console.error('Erro ao carregar alvarás:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addAlvara = async (data: AlvaraFormData) => {
    try {
      setError(null);
      const newAlvara = await alvaraAPI.create(data);
      const updated = {
        ...newAlvara,
        requestDate: new Date(newAlvara.requestDate),
        issueDate: newAlvara.issueDate ? new Date(newAlvara.issueDate) : undefined,
        expirationDate: newAlvara.expirationDate ? new Date(newAlvara.expirationDate) : undefined,
        status: calculateAlvaraStatus(newAlvara),
      };
      setAlvaras((prev) => [...prev, updated]);
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar alvará';
      setError(message);
      throw err;
    }
  };

  const updateAlvara = async (id: string, data: AlvaraFormData) => {
    try {
      setError(null);
      const updatedAlvara = await alvaraAPI.update(id, data);
      const updated = {
        ...updatedAlvara,
        requestDate: new Date(updatedAlvara.requestDate),
        issueDate: updatedAlvara.issueDate ? new Date(updatedAlvara.issueDate) : undefined,
        expirationDate: updatedAlvara.expirationDate ? new Date(updatedAlvara.expirationDate) : undefined,
        status: calculateAlvaraStatus(updatedAlvara),
      };
      setAlvaras((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      );
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar alvará';
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
      const message = err instanceof Error ? err.message : 'Erro ao deletar alvará';
      setError(message);
      throw err;
    }
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
    error,
    addAlvara,
    updateAlvara,
    deleteAlvara,
    refetch: loadAlvaras,
  };
}
