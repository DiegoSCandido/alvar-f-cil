import { useState } from 'react';
import { DocumentoCliente } from '@/types/documentoCliente';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function useDocumentosCliente(clienteId: string) {
  const [documentos, setDocumentos] = useState<DocumentoCliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocumentos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/documentos-cliente/cliente/${clienteId}`);
      if (!response.ok) throw new Error('Erro ao carregar documentos');
      const data = await response.json();
      setDocumentos(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar documentos';
      setError(message);
      console.error('Erro:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocumento = async (formData: FormData) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/documentos-cliente/upload/${clienteId}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Erro ao fazer upload');
      const newDocumento = await response.json();
      setDocumentos((prev) => [...prev, newDocumento]);
      return newDocumento;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload';
      setError(message);
      throw err;
    }
  };

  const deleteDocumento = async (id: string) => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/documentos-cliente/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar documento');
      setDocumentos((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar documento';
      setError(message);
      throw err;
    }
  };

  const downloadDocumento = (id: string) => {
    window.location.href = `${API_BASE_URL}/documentos-cliente/download/${id}`;
  };

  return {
    documentos,
    isLoading,
    error,
    loadDocumentos,
    uploadDocumento,
    deleteDocumento,
    downloadDocumento,
  };
}
