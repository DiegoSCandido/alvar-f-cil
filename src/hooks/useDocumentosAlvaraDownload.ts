import { useCallback, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function useDocumentosAlvaraDownload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca o documento de alvará (primeiro da lista)
  const getDownloadUrl = useCallback(async (alvaraId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Busca lista de documentos do alvará
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/documentos-alvara/alvara/${alvaraId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Erro ao buscar documentos do alvará');
      const docs = await res.json();
      if (!docs || !docs.length) throw new Error('Nenhum documento encontrado');
      // Busca signedUrl do primeiro documento
      const docId = docs[0].id;
      const res2 = await fetch(`${API_BASE_URL}/documentos-alvara/download/${docId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res2.ok) throw new Error('Erro ao gerar link de download');
      const { signedUrl, originalName } = await res2.json();
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
