import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ExtractedData {
  tipo?: string;
  cnpj?: string;
  razaoSocial?: string;
  dataVencimento?: string;
  dataEmissao?: string;
  numeroAlvara?: string;
  confianca: number;
}

export interface FileResult {
  fileName: string;
  success: boolean;
  alvara?: any;
  extractedData?: ExtractedData;
  cliente?: {
    id: string;
    razaoSocial: string;
    cnpj: string;
    alvaras?: string[];
  };
  error?: string;
  tipoHabilitadoAutomaticamente?: boolean;
}

export interface MultipleUploadResponse {
  results: FileResult[];
  summary: {
    total: number;
    success: number;
    failed: number;
  };
  message: string;
}

export function useIntelligentUploadMultiple() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<MultipleUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadPDFs = async (files: File[]): Promise<MultipleUploadResponse> => {
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/alvaras/intelligent-upload-multiple`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer upload dos arquivos');
      }

      setUploadResults(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer upload';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setUploadResults(null);
    setError(null);
  };

  return { uploadPDFs, isUploading, uploadResults, error, reset };
}
