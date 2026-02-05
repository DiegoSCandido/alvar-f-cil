import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Scan, X, Files, Edit2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIntelligentUpload, ExtractedData } from '@/hooks/useIntelligentUpload';
import { useIntelligentUploadMultiple } from '@/hooks/useIntelligentUploadMultiple';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ALVARA_TYPES } from '@/types/alvara';

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
  const [isConfirmed, setIsConfirmed] = useState(false); // Estado para controlar confirmação
  const [isEditing, setIsEditing] = useState(false); // Estado para controlar edição
  const [editedData, setEditedData] = useState<Partial<ExtractedData>>({}); // Dados editados
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  // Reseta confirmação e edição quando novos dados são extraídos
  useEffect(() => {
    if (extractedData) {
      setIsConfirmed(false);
      setIsEditing(false);
      setEditedData({});
    }
  }, [extractedData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      reset();
      setUploadResult(null);
      setIsConfirmed(false); // Reseta confirmação ao selecionar novo arquivo
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
      setIsConfirmed(false); // Reseta confirmação ao extrair novamente
      setUploadResult(null); // Limpa resultado anterior
      await extractPDF(file);
    } catch (err) {
      // Erro já está sendo tratado pelo hook
      setIsConfirmed(false); // Garante reset mesmo em caso de erro
    }
  };

  const handleConfirmData = () => {
    // Marca os dados como confirmados
    setIsConfirmed(true);
  };

  const handleUpload = async () => {
    // Esta função só é chamada quando isConfirmed é true
    // Cria o alvará no banco de dados com dados editados (se houver)
    try {
      const result = await uploadPDF(Object.keys(editedData).length > 0 ? editedData : undefined);
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

  const handleEdit = () => {
    setIsEditing(true);
    // Inicializa editedData com os dados extraídos
    setEditedData({
      tipo: extractedData?.tipo,
      cnpj: extractedData?.cnpj,
      razaoSocial: extractedData?.razaoSocial,
      dataVencimento: extractedData?.dataVencimento,
      dataEmissao: extractedData?.dataEmissao,
    });
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    setIsConfirmed(false); // Reseta confirmação para permitir revisão
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleClose = () => {
    setFile(null);
    setFiles([]);
    reset();
    resetMultiple();
    setUploadResult(null);
    setMode('single');
    setIsConfirmed(false); // Reseta confirmação ao fechar
    setIsEditing(false);
    setEditedData({});
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
                <div className="flex items-center gap-2">
                  <Badge className={getConfidenceColor(extractedData.confianca)}>
                    {extractedData.confianca}% confiança
                  </Badge>
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                      className="h-7"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
              
              {isEditing ? (
                // Formulário de edição
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-tipo">Tipo de Alvará *</Label>
                      <Select
                        value={editedData.tipo || extractedData.tipo || ''}
                        onValueChange={(value) => setEditedData({ ...editedData, tipo: value })}
                      >
                        <SelectTrigger id="edit-tipo">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALVARA_TYPES.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>
                              {tipo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-cnpj">CNPJ *</Label>
                      <Input
                        id="edit-cnpj"
                        value={editedData.cnpj || extractedData.cnpj || ''}
                        onChange={(e) => setEditedData({ ...editedData, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-razao-social">Razão Social</Label>
                      <Input
                        id="edit-razao-social"
                        value={editedData.razaoSocial || extractedData.razaoSocial || ''}
                        onChange={(e) => setEditedData({ ...editedData, razaoSocial: e.target.value })}
                        placeholder="Nome da empresa"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="edit-data-emissao">Data de Emissão</Label>
                        <Input
                          id="edit-data-emissao"
                          type="date"
                          value={
                            editedData.dataEmissao
                              ? format(new Date(editedData.dataEmissao), 'yyyy-MM-dd')
                              : extractedData.dataEmissao
                              ? format(new Date(extractedData.dataEmissao), 'yyyy-MM-dd')
                              : ''
                          }
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              dataEmissao: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-data-vencimento">Data de Vencimento</Label>
                        <Input
                          id="edit-data-vencimento"
                          type="date"
                          value={
                            editedData.dataVencimento
                              ? format(new Date(editedData.dataVencimento), 'yyyy-MM-dd')
                              : extractedData.dataVencimento
                              ? format(new Date(extractedData.dataVencimento), 'yyyy-MM-dd')
                              : ''
                          }
                          onChange={(e) =>
                            setEditedData({
                              ...editedData,
                              dataVencimento: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                            })
                          }
                        />
                      </div>
                    </div>

                    {extractedData.numeroAlvara && (
                      <div className="space-y-2">
                        <Label>Número do Alvará</Label>
                        <p className="text-sm text-muted-foreground">{extractedData.numeroAlvara}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} className="flex-1" variant="default">
                      Salvar Alterações
                    </Button>
                    <Button onClick={handleCancelEdit} className="flex-1" variant="outline">
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                // Visualização dos dados
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tipo de Alvará</p>
                    <p className="font-medium">{editedData.tipo || extractedData.tipo || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CNPJ</p>
                    <p className="font-medium">{editedData.cnpj || extractedData.cnpj || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Razão Social</p>
                    <p className="font-medium">{editedData.razaoSocial || extractedData.razaoSocial || '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Data de Vencimento</p>
                    <p className="font-medium">
                      {formatDate(editedData.dataVencimento || extractedData.dataVencimento)}
                    </p>
                  </div>
                  {extractedData.numeroAlvara && (
                    <div>
                      <p className="text-muted-foreground">Número do Alvará</p>
                      <p className="font-medium">{extractedData.numeroAlvara}</p>
                    </div>
                  )}
                </div>
              )}

              {!error && !isEditing && (
                <div className="space-y-2">
                  {!isConfirmed ? (
                    <Button onClick={handleConfirmData} className="w-full" variant="default">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Dados e Prosseguir
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertDescription className="text-blue-800 text-sm">
                          Dados confirmados. Clique no botão abaixo para criar o alvará.
                        </AlertDescription>
                      </Alert>
                      <Button onClick={handleUpload} className="w-full" disabled={isUploading} variant="default">
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Criando Alvará...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Criar Alvará
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={() => setIsConfirmed(false)} 
                        className="w-full" 
                        variant="outline"
                        disabled={isUploading}
                      >
                        Voltar e Revisar
                      </Button>
                    </div>
                  )}
                </div>
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
