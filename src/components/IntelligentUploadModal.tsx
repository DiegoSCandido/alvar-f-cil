import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useIntelligentUpload, ExtractedData } from '@/hooks/useIntelligentUpload';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IntelligentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function IntelligentUploadModal({ open, onOpenChange, onSuccess }: IntelligentUploadModalProps) {
  const { extractPDF, uploadPDF, isUploading, isExtracting, extractedData, error, reset } = useIntelligentUpload();
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      reset();
      setUploadResult(null);
    } else {
      alert('Por favor, selecione um arquivo PDF');
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    try {
      await extractPDF(file);
    } catch (err) {
      // Erro já está sendo tratado pelo hook
    }
  };

  const handleUpload = async () => {
    try {
      const result = await uploadPDF();
      setUploadResult(result);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (err) {
      // Erro já está sendo tratado pelo hook
    }
  };

  const handleClose = () => {
    setFile(null);
    reset();
    setUploadResult(null);
    onOpenChange(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getConfidenceColor = (confianca: number) => {
    if (confianca >= 70) return 'bg-green-100 text-green-800';
    if (confianca >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Inteligente de Alvará
          </DialogTitle>
          <DialogDescription>
            Faça upload do PDF do alvará e o sistema extrairá automaticamente as informações
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de arquivo */}
          {!uploadResult && (
            <div className="space-y-3">
              <label htmlFor="pdf-upload" className="block">
                <div className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    {file ? (
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">Clique para selecionar um PDF</p>
                        <p className="text-sm text-muted-foreground">
                          Apenas arquivos PDF são aceitos
                        </p>
                      </div>
                    )}
                  </div>
                  <Button type="button" variant="outline" size="sm">
                    Selecionar
                  </Button>
                </div>
              </label>
              <input
                id="pdf-upload"
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {/* Botão para ler PDF */}
              {file && !extractedData && !isExtracting && (
                <Button 
                  onClick={handleExtract} 
                  className="w-full"
                  disabled={!file || isExtracting}
                >
                  <Scan className="h-4 w-4 mr-2" />
                  Ler PDF e Extrair Dados
                </Button>
              )}
            </div>
          )}

          {/* Loading - Extração */}
          {isExtracting && (
            <div className="flex items-center justify-center gap-2 p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-muted-foreground">Lendo PDF e extraindo dados...</p>
            </div>
          )}

          {/* Loading - Criação */}
          {isUploading && (
            <div className="flex items-center justify-center gap-2 p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-muted-foreground">Criando alvará...</p>
            </div>
          )}

          {/* Erro */}
          {error && extractedData && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">{error}</p>
                  <div className="text-sm space-y-1">
                    {extractedData.cnpj && (
                      <p>CNPJ encontrado: {extractedData.cnpj}</p>
                    )}
                    {extractedData.tipo && (
                      <p>Tipo identificado: {extractedData.tipo}</p>
                    )}
                    {extractedData.confianca > 0 && (
                      <p>Confiança: {extractedData.confianca}%</p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Dados extraídos */}
          {extractedData && !isUploading && !uploadResult && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Dados Extraídos do PDF</h4>
                <Badge className={getConfidenceColor(extractedData.confianca)}>
                  {extractedData.confianca}% confiança
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo de Alvará</p>
                  <p className="font-medium">{extractedData.tipo || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{extractedData.cnpj || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Razão Social</p>
                  <p className="font-medium">{extractedData.razaoSocial || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data de Vencimento</p>
                  <p className="font-medium">{formatDate(extractedData.dataVencimento)}</p>
                </div>
                {extractedData.numeroAlvara && (
                  <div>
                    <p className="text-muted-foreground">Número do Alvará</p>
                    <p className="font-medium">{extractedData.numeroAlvara}</p>
                  </div>
                )}
              </div>

              {!error && (
                <Button onClick={handleUpload} className="w-full" disabled={isUploading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar e Criar Alvará
                </Button>
              )}
            </div>
          )}

          {/* Sucesso */}
          {uploadResult && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-semibold mb-2">Alvará criado com sucesso!</p>
                <div className="text-sm space-y-1">
                  <p>Cliente: {uploadResult.cliente.razaoSocial}</p>
                  <p>Tipo: {uploadResult.extractedData.tipo}</p>
                  {uploadResult.extractedData.dataVencimento && (
                    <p>Vencimento: {formatDate(uploadResult.extractedData.dataVencimento)}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            {uploadResult ? 'Fechar' : 'Cancelar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
