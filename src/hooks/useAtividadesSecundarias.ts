import { useState } from 'react';
import { AtividadeSecundaria, AtividadeSecundariaFormData } from '@/types/atividadeSecundaria';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function useAtividadesSecundarias(clienteId: string) {
  const [atividades, setAtividades] = useState<AtividadeSecundaria[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAtividades = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/atividades-secundarias/cliente/${clienteId}`);
      if (!response.ok) throw new Error('Erro ao carregar atividades');
      const data = await response.json();
      setAtividades(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar atividades';
      setError(message);
      console.error('Erro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addAtividade = async (data: AtividadeSecundariaFormData) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/atividades-secundarias/${clienteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Erro ao criar atividade');
      const newAtividade = await response.json();
      setAtividades((prev) => [...prev, newAtividade]);
      return newAtividade;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar atividade';
      setError(message);
      throw err;
    }
  };

  const deleteAtividade = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/atividades-secundarias/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar atividade');
      setAtividades((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar atividade';
      setError(message);
      throw err;
    }
  };

  return {
    atividades,
    isLoading,
    error,
    loadAtividades,
    addAtividade,
    deleteAtividade,
  };
}
