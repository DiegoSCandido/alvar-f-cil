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

export interface FileWithExtractedData {
  file: File;
  extractedData?: ExtractedData;
  editedData?: Partial<ExtractedData>;
  isEditing?: boolean;
}

export function useIntelligentUploadMultiple() {
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadResults, setUploadResults] = useState<MultipleUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filesWithData, setFilesWithData] = useState<FileWithExtractedData[]>([]);

  const extractAllPDFs = async (files: File[]): Promise<FileWithExtractedData[]> => {
    setIsExtracting(true);
    setError(null);
    
    try {
      const filesWithExtractedData: FileWithExtractedData[] = [];
      
      for (const file of files) {
        if (file.type !== 'application/pdf') {
          filesWithExtractedData.push({ file });
          continue;
        }

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

          if (response.ok && data.extractedData) {
            filesWithExtractedData.push({
              file,
              extractedData: data.extractedData,
            });
          } else {
            filesWithExtractedData.push({
              file,
              extractedData: data.extractedData || undefined,
            });
          }
        } catch (err) {
          filesWithExtractedData.push({ file });
        }
      }

      setFilesWithData(filesWithExtractedData);
      return filesWithExtractedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao extrair dados';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExtracting(false);
    }
  };

  const updateFileData = (index: number, editedData: Partial<ExtractedData>) => {
    const updated = [...filesWithData];
    updated[index] = {
      ...updated[index],
      editedData: { ...updated[index].editedData, ...editedData },
    };
    setFilesWithData(updated);
  };

  const uploadPDFs = async (filesWithExtracted: FileWithExtractedData[]): Promise<MultipleUploadResponse> => {
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Adiciona os arquivos
      filesWithExtracted.forEach((item, index) => {
        formData.append('files', item.file);
        
        // Adiciona dados editados se houver
        const dataToUse = item.editedData || item.extractedData;
        if (dataToUse) {
          if (dataToUse.tipo) formData.append(`editedData[${index}][tipo]`, dataToUse.tipo);
          if (dataToUse.cnpj) formData.append(`editedData[${index}][cnpj]`, dataToUse.cnpj);
          if (dataToUse.razaoSocial) formData.append(`editedData[${index}][razaoSocial]`, dataToUse.razaoSocial);
          if (dataToUse.dataVencimento) formData.append(`editedData[${index}][dataVencimento]`, dataToUse.dataVencimento);
          if (dataToUse.dataEmissao) formData.append(`editedData[${index}][dataEmissao]`, dataToUse.dataEmissao);
        }
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
    setFilesWithData([]);
  };

  return { 
    extractAllPDFs, 
    uploadPDFs, 
    isUploading, 
    isExtracting,
    uploadResults, 
    error, 
    filesWithData,
    updateFileData,
    reset 
  };
}
