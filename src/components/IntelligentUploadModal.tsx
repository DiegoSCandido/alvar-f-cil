import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Scan, X, Files } from 'lucide-react';
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
import { useIntelligentUploadMultiple } from '@/hooks/useIntelligentUploadMultiple';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface IntelligentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function IntelligentUploadModal({ open, onOpenChange, onSuccess }: IntelligentUploadModalProps) {
  const { extractPDF, uploadPDF, isUploading, isExtracting, extractedData, error, reset } = useIntelligentUpload();
  const { uploadPDFs, isUploading: isUploadingMultiple, uploadResults, error: errorMultiple, reset: resetMultiple } = useIntelligentUploadMultiple();
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

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

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      alert('Por favor, selecione pelo menos um arquivo PDF');
      return;
    }
    
    if (pdfFiles.length !== selectedFiles.length) {
      alert(`${selectedFiles.length - pdfFiles.length} arquivo(s) não são PDF e foram ignorados`);
    }
    
    setFiles(pdfFiles);
    resetMultiple();
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUploadMultiple = async () => {
    if (files.length === 0) return;

    try {
      const result = await uploadPDFs(files);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 3000);
      }
    } catch (err) {
      // Erro já está sendo tratado pelo hook
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
    setFiles([]);
    reset();
    resetMultiple();
    setUploadResult(null);
    setMode('single');
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
            Faça upload de PDF(s) de alvará e o sistema extrairá automaticamente as informações
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => setMode(value as 'single' | 'multiple')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Arquivo Único</TabsTrigger>
            <TabsTrigger value="multiple">Múltiplos Arquivos</TabsTrigger>
          </TabsList>

          {/* Modo Arquivo Único */}
          <TabsContent value="single" className="space-y-4 mt-4">
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
                  {uploadResult.tipoHabilitadoAutomaticamente && (
                    <p className="text-xs text-green-700 mt-2 italic">
                      ℹ️ O tipo "{uploadResult.extractedData.tipo}" foi habilitado automaticamente para este cliente.
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
          </TabsContent>

          {/* Modo Múltiplos Arquivos */}
          <TabsContent value="multiple" className="space-y-4 mt-4">
            {/* Seleção de múltiplos arquivos */}
            {!uploadResults && (
              <div className="space-y-3">
                <label htmlFor="pdf-upload-multiple" className="block">
                  <div className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Files className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      {files.length > 0 ? (
                        <div>
                          <p className="font-medium">{files.length} arquivo(s) selecionado(s)</p>
                          <p className="text-sm text-muted-foreground">
                            Total: {(files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium">Clique para selecionar múltiplos PDFs</p>
                          <p className="text-sm text-muted-foreground">
                            Você pode selecionar até 10 arquivos PDF de uma vez
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
                  id="pdf-upload-multiple"
                  ref={filesInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFilesSelect}
                  className="hidden"
                />

                {/* Lista de arquivos selecionados */}
                {files.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botão para processar múltiplos arquivos */}
                {files.length > 0 && !isUploadingMultiple && (
                  <Button 
                    onClick={handleUploadMultiple} 
                    className="w-full"
                    disabled={files.length === 0 || isUploadingMultiple}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Processar {files.length} Arquivo(s) e Criar Alvarás
                  </Button>
                )}
              </div>
            )}

            {/* Loading - Processamento múltiplo */}
            {isUploadingMultiple && (
              <div className="flex items-center justify-center gap-2 p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Processando {files.length} arquivo(s)...
                </p>
              </div>
            )}

            {/* Erro múltiplo */}
            {errorMultiple && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold">{errorMultiple}</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Resultados múltiplos */}
            {uploadResults && (
              <div className="space-y-3">
                <Alert className={uploadResults.summary.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <p className="font-semibold mb-2">{uploadResults.message}</p>
                    <div className="text-sm space-y-1">
                      <p>Total: {uploadResults.summary.total} arquivo(s)</p>
                      <p className="text-green-700">Sucesso: {uploadResults.summary.success}</p>
                      {uploadResults.summary.failed > 0 && (
                        <p className="text-red-700">Falhas: {uploadResults.summary.failed}</p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Lista de resultados */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {uploadResults.results.map((result, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded border text-sm ${
                        result.success 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.fileName}</p>
                          {result.success ? (
                            <div className="mt-1 space-y-0.5 text-xs">
                              <p>Cliente: {result.cliente?.razaoSocial}</p>
                              <p>Tipo: {result.extractedData?.tipo}</p>
                              {result.tipoHabilitadoAutomaticamente && (
                                <p className="text-green-700 italic">
                                  Tipo habilitado automaticamente
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-red-700 mt-1 text-xs">{result.error}</p>
                          )}
                        </div>
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            {uploadResult || uploadResults ? 'Fechar' : 'Cancelar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
