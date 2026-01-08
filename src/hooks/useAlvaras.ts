import { useState, useEffect, useMemo } from 'react';
import { Alvara, AlvaraFormData, AlvaraStatus } from '@/types/alvara';
import { calculateAlvaraStatus, generateId } from '@/lib/alvara-utils';

const STORAGE_KEY = 'alvaras-data';

// Sample data for demonstration
const sampleAlvaras: Alvara[] = [
  {
    id: generateId(),
    clientName: 'Padaria Sabor & Arte',
    clientCnpj: '12345678000190',
    type: 'Alvará Sanitário',
    requestDate: new Date('2024-01-15'),
    issueDate: new Date('2024-02-01'),
    expirationDate: new Date('2025-02-01'),
    status: 'valid',
  },
  {
    id: generateId(),
    clientName: 'Restaurante Bom Prato',
    clientCnpj: '98765432000121',
    type: 'Alvará de Funcionamento',
    requestDate: new Date('2024-06-01'),
    issueDate: new Date('2024-06-15'),
    expirationDate: new Date('2025-01-20'),
    status: 'expiring',
  },
  {
    id: generateId(),
    clientName: 'Academia Força Total',
    clientCnpj: '11223344000155',
    type: 'Alvará de Bombeiros',
    requestDate: new Date('2023-08-10'),
    issueDate: new Date('2023-09-01'),
    expirationDate: new Date('2024-09-01'),
    status: 'expired',
  },
  {
    id: generateId(),
    clientName: 'Clínica Saúde Integral',
    clientCnpj: '55667788000199',
    type: 'Alvará Sanitário',
    requestDate: new Date('2025-01-05'),
    status: 'pending',
  },
];

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

  const addAlvara = (data: AlvaraFormData) => {
    const newAlvara: Alvara = {
      id: generateId(),
      ...data,
      status: 'pending',
    };
    newAlvara.status = calculateAlvaraStatus(newAlvara);
    setAlvaras((prev) => [...prev, newAlvara]);
  };

  const updateAlvara = (id: string, data: AlvaraFormData) => {
    setAlvaras((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = { ...a, ...data };
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
