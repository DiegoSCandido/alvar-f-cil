import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function useDocumentosAlvara(alvaraId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadDocumento = async (formData: FormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/documentos-alvara/upload/${alvaraId}`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error('Erro ao fazer upload do documento do alvará');
      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Você pode adicionar métodos para listar e deletar documentos do alvará aqui

  return {
    isLoading,
    error,
    uploadDocumento,
  };
}
