import { useState, useCallback } from 'react';
import { documentAPI } from '@/lib/api-client';

export interface Document {
  id: string;
  alvaraId: string;
  clienteId: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  documentType?: string;
  uploadedAt?: Date;
}

export function useDocuments() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await documentAPI.list();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar documentos';
      setError(message);
      console.error('Erro ao carregar documentos:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listByAlvara = useCallback(async (alvaraId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await documentAPI.listByAlvara(alvaraId);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar documentos do alvará';
      setError(message);
      console.error('Erro ao carregar documentos:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listByCliente = useCallback(async (clienteId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await documentAPI.listByCliente(clienteId);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar documentos do cliente';
      setError(message);
      console.error('Erro ao carregar documentos:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (formData: FormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await documentAPI.upload(formData);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload do documento';
      setError(message);
      console.error('Erro ao fazer upload:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await documentAPI.delete(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar documento';
      setError(message);
      console.error('Erro ao deletar documento:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getDownloadUrl = useCallback((id: string): string => {
    return documentAPI.download(id);
  }, []);

  return {
    isLoading,
    error,
    listDocuments,
    listByAlvara,
    listByCliente,
    uploadDocument,
    deleteDocument,
    getDownloadUrl,
  };
}
