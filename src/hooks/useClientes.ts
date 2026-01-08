import { useState, useEffect } from 'react';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { generateId } from '@/lib/alvara-utils';

const STORAGE_KEY = 'clientes-data';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setClientes(parsed);
      } catch (e) {
        setClientes([]);
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage when clientes change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
    }
  }, [clientes, isLoading]);

  const addCliente = (data: ClienteFormData) => {
    const newCliente: Cliente = {
      id: generateId(),
      ...data,
    };
    setClientes((prev) => [...prev, newCliente]);
  };

  const updateCliente = (id: string, data: ClienteFormData) => {
    setClientes((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          return { ...c, ...data };
        }
        return c;
      })
    );
  };

  const deleteCliente = (id: string) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
  };

  const getClienteById = (id: string): Cliente | undefined => {
    return clientes.find((c) => c.id === id);
  };

  return {
    clientes,
    isLoading,
    addCliente,
    updateCliente,
    deleteCliente,
    getClienteById,
  };
}
