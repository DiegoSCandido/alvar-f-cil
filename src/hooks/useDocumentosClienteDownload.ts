import { useCallback, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function useDocumentosClienteDownload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca o documento de cliente e retorna a signed URL
  const getDownloadUrl = useCallback(async (documentoId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/documentos-cliente/download/${documentoId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Erro ao buscar documento');
      const { signedUrl, originalName } = await res.json();
      return { signedUrl, originalName };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar documento');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getDownloadUrl, isLoading, error };
}
