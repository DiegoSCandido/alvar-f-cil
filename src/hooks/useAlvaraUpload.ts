import { useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function useAlvaraUpload() {
  // Função para upload do documento do alvará usando o endpoint correto
  const uploadAlvaraDocument = useCallback(async (alvaraId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nomeDocumento', 'Alvará PDF');
    // Adiciona o token de autenticação
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/documentos-alvara/upload/${alvaraId}`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }
    return await response.json();
  }, []);

  return { uploadAlvaraDocument };
}
