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

export interface IntelligentUploadResponse {
  alvara: any;
  extractedData: ExtractedData;
  cliente: {
    id: string;
    razaoSocial: string;
    cnpj: string;
  };
  message: string;
}

export function useIntelligentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const extractPDF = async (file: File): Promise<ExtractedData> => {
    setIsExtracting(true);
    setError(null);
    setCurrentFile(file);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/alvaras/extract-pdf`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        setExtractedData(data.extractedData || null);
        throw new Error(data.error || 'Erro ao extrair dados do PDF');
      }

      setExtractedData(data.extractedData);
      return data.extractedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao extrair dados';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExtracting(false);
    }
  };

  const uploadPDF = async (): Promise<IntelligentUploadResponse> => {
    if (!currentFile) throw new Error('Nenhum arquivo selecionado');
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', currentFile);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/alvaras/intelligent-upload`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar alvará');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar alvará';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setExtractedData(null);
    setError(null);
    setCurrentFile(null);
  };

  return { extractPDF, uploadPDF, isUploading, isExtracting, extractedData, error, reset };
}
