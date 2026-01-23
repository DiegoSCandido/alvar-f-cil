import { useState, useEffect } from 'react';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { clienteAPI } from '@/lib/api-client';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clientes from API on mount
  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await clienteAPI.list();
      setClientes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(message);
      console.error('Erro ao carregar clientes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addCliente = async (data: ClienteFormData) => {
    try {
      setError(null);
      const newCliente = await clienteAPI.create(data);
      setClientes((prev) => [...prev, newCliente]);
      return newCliente;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar cliente';
      setError(message);
      throw err;
    }
  };

  const updateCliente = async (id: string, data: ClienteFormData) => {
    try {
      setError(null);
      const updated = await clienteAPI.update(id, data);
      setClientes((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
      setError(message);
      throw err;
    }
  };

  const deleteCliente = async (id: string) => {
    try {
      setError(null);
      await clienteAPI.delete(id);
      setClientes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar cliente';
      setError(message);
      throw err;
    }
  };

  const getClienteById = (id: string): Cliente | undefined => {
    return clientes.find((c) => c.id === id);
  };

  return {
    clientes,
    isLoading,
    error,
    addCliente,
    updateCliente,
    deleteCliente,
    getClienteById,
    refetch: loadClientes,
  };
}
