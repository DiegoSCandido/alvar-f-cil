import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Scan, X, Files, Edit2, Eye } from 'lucide-react';
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
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface IntelligentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function IntelligentUploadModal({ open, onOpenChange, onSuccess }: IntelligentUploadModalProps) {
  const { extractPDF, uploadPDF, isUploading, isExtracting, extractedData, error, reset } = useIntelligentUpload();
  const { 
    extractAllPDFs, 
    uploadPDFs, 
    isUploading: isUploadingMultiple, 
    isExtracting: isExtractingMultiple,
    uploadResults, 
    error: errorMultiple, 
    filesWithData,
    updateFileData,
    reset: resetMultiple 
  } = useIntelligentUploadMultiple();
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const [isConfirmed, setIsConfirmed] = useState(false); // Estado para controlar confirmação
  const [isEditing, setIsEditing] = useState(false); // Estado para controlar edição
  const [editedData, setEditedData] = useState<Partial<ExtractedData>>({}); // Dados editados
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null); // Índice do arquivo sendo editado
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // URL do PDF para pré-visualização
  const [previewFileName, setPreviewFileName] = useState<string>(''); // Nome do arquivo sendo visualizado
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

  const handleExtractMultiple = async () => {
    if (files.length === 0) return;

    try {
      await extractAllPDFs(files);
    } catch (err) {
      // Erro já está sendo tratado pelo hook
    }
  };

  const handleEditFile = (index: number) => {
    setEditingFileIndex(index);
  };

  const handleSaveFileEdit = (index: number) => {
    const fileData = filesWithData[index];
    if (fileData && fileData.editedData) {
      updateFileData(index, fileData.editedData);
    }
    setEditingFileIndex(null);
  };

  const handleCancelFileEdit = (index: number) => {
    const updated = [...filesWithData];
    updated[index] = {
      ...updated[index],
      editedData: undefined,
    };
    setEditingFileIndex(null);
  };

  const handleUploadMultiple = async () => {
    if (filesWithData.length === 0) return;

    try {
      const result = await uploadPDFs(filesWithData);
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

  const handlePreview = (fileToPreview: File) => {
    // Cria uma URL de objeto (blob URL) para o arquivo
    const url = URL.createObjectURL(fileToPreview);
    setPreviewUrl(url);
    setPreviewFileName(fileToPreview.name);
  };

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl); // Libera a memória
    }
    setPreviewUrl(null);
    setPreviewFileName('');
  };

  const handleClose = () => {
    // Limpa a pré-visualização se estiver aberta
    handleClosePreview();
    
    setFile(null);
    setFiles([]);
    reset();
    resetMultiple();
    setUploadResult(null);
    setMode('single');
    setIsConfirmed(false); // Reseta confirmação ao fechar
    setIsEditing(false);
    setEditedData({});
    setEditingFileIndex(null);
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

  // Função auxiliar para converter ISO string ou Date para formato YYYY-MM-DD sem problemas de timezone
  const formatDateForInput = (dateValue?: string | Date): string => {
    if (!dateValue) return '';
    
    try {
      let date: Date;
      
      if (typeof dateValue === 'string') {
        // Se for ISO string, extrai apenas a parte da data (YYYY-MM-DD)
        if (dateValue.includes('T')) {
          // É ISO string, extrai apenas a parte da data
          return dateValue.split('T')[0];
        }
        // Se já for formato YYYY-MM-DD, retorna direto
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        // Tenta converter de string
        date = new Date(dateValue);
      } else {
        date = dateValue;
      }
      
      if (isNaN(date.getTime())) return '';
      
      // Usa métodos locais para evitar problemas de timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  // Função auxiliar para converter valor do input para ISO string
  const parseDateFromInput = (value: string): string | undefined => {
    if (!value) return undefined;
    
    try {
      // O valor já vem no formato YYYY-MM-DD do input type="date"
      // Cria a data em UTC para evitar problemas de timezone
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      
      if (isNaN(date.getTime())) return undefined;
      
      // Retorna como ISO string
      return date.toISOString();
    } catch {
      return undefined;
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
                  {!isEditing && file && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(file)}
                        className="h-7"
                        title="Pré-visualizar PDF"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver PDF
                      </Button>
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
                    </>
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
                          value={formatDateForInput(editedData.dataEmissao || extractedData?.dataEmissao)}
                          onChange={(e) => {
                            const isoString = parseDateFromInput(e.target.value);
                            setEditedData({
                              ...editedData,
                              dataEmissao: isoString,
                            });
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-data-vencimento">Data de Vencimento</Label>
                        <Input
                          id="edit-data-vencimento"
                          type="date"
                          value={formatDateForInput(editedData.dataVencimento || extractedData?.dataVencimento)}
                          onChange={(e) => {
                            const isoString = parseDateFromInput(e.target.value);
                            setEditedData({
                              ...editedData,
                              dataVencimento: isoString,
                            });
                          }}
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
            {!uploadResults && filesWithData.length === 0 && (
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

                {/* Botão para extrair dados de todos os arquivos */}
                {files.length > 0 && !isExtractingMultiple && (
                  <Button 
                    onClick={handleExtractMultiple} 
                    className="w-full"
                    disabled={files.length === 0 || isExtractingMultiple}
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Extrair Dados de {files.length} Arquivo(s)
                  </Button>
                )}
              </div>
            )}

            {/* Loading - Extração múltipla */}
            {isExtractingMultiple && (
              <div className="flex items-center justify-center gap-2 p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Extraindo dados de {files.length} arquivo(s)...
                </p>
              </div>
            )}

            {/* Lista de arquivos com dados extraídos */}
            {filesWithData.length > 0 && !uploadResults && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Arquivos e Dados Extraídos</h4>
                  <Badge>{filesWithData.length} arquivo(s)</Badge>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filesWithData.map((fileData, index) => {
                    const dataToShow = fileData.editedData || fileData.extractedData;
                    const isEditingThis = editingFileIndex === index;
                    
                    return (
                      <div key={index} className="p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{fileData.file.name}</p>
                            {dataToShow && (
                              <Badge className={getConfidenceColor(dataToShow.confianca || 0)}>
                                {dataToShow.confianca || 0}% confiança
                              </Badge>
                            )}
                          </div>
                          {!isEditingThis && (
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handlePreview(fileData.file)}
                                className="h-7"
                                title="Pré-visualizar PDF"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              {dataToShow && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditFile(index)}
                                  className="h-7"
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  Editar
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {isEditingThis ? (
                          // Formulário de edição para este arquivo
                          <div className="space-y-3 mt-3">
                            <div className="grid grid-cols-1 gap-3">
                              <div className="space-y-2">
                                <Label>Tipo de Alvará *</Label>
                                <Select
                                  value={fileData.editedData?.tipo || fileData.extractedData?.tipo || ''}
                                  onValueChange={(value) => {
                                    const current = fileData.editedData || {};
                                    updateFileData(index, { ...current, tipo: value });
                                  }}
                                >
                                  <SelectTrigger>
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
                                <Label>CNPJ *</Label>
                                <Input
                                  value={fileData.editedData?.cnpj || fileData.extractedData?.cnpj || ''}
                                  onChange={(e) => {
                                    const current = fileData.editedData || {};
                                    updateFileData(index, { ...current, cnpj: e.target.value });
                                  }}
                                  placeholder="00.000.000/0000-00"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Razão Social</Label>
                                <Input
                                  value={fileData.editedData?.razaoSocial || fileData.extractedData?.razaoSocial || ''}
                                  onChange={(e) => {
                                    const current = fileData.editedData || {};
                                    updateFileData(index, { ...current, razaoSocial: e.target.value });
                                  }}
                                  placeholder="Nome da empresa"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Data de Emissão</Label>
                                  <Input
                                    type="date"
                                    value={formatDateForInput(fileData.editedData?.dataEmissao || fileData.extractedData?.dataEmissao)}
                                    onChange={(e) => {
                                      const isoString = parseDateFromInput(e.target.value);
                                      const current = fileData.editedData || {};
                                      updateFileData(index, {
                                        ...current,
                                        dataEmissao: isoString,
                                      });
                                    }}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Data de Vencimento</Label>
                                  <Input
                                    type="date"
                                    value={formatDateForInput(fileData.editedData?.dataVencimento || fileData.extractedData?.dataVencimento)}
                                    onChange={(e) => {
                                      const isoString = parseDateFromInput(e.target.value);
                                      const current = fileData.editedData || {};
                                      updateFileData(index, {
                                        ...current,
                                        dataVencimento: isoString,
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button onClick={() => handleSaveFileEdit(index)} className="flex-1" variant="default" size="sm">
                                Salvar
                              </Button>
                              <Button onClick={() => handleCancelFileEdit(index)} className="flex-1" variant="outline" size="sm">
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Visualização dos dados
                          dataToShow ? (
                            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                              <div>
                                <p className="text-muted-foreground">Tipo</p>
                                <p className="font-medium">{dataToShow.tipo || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">CNPJ</p>
                                <p className="font-medium">{dataToShow.cnpj || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Razão Social</p>
                                <p className="font-medium">{dataToShow.razaoSocial || '-'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Vencimento</p>
                                <p className="font-medium">{formatDate(dataToShow.dataVencimento)}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Dados não extraídos</p>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Botão para processar todos os arquivos */}
                {!isUploadingMultiple && (
                  <Button 
                    onClick={handleUploadMultiple} 
                    className="w-full"
                    disabled={isUploadingMultiple || editingFileIndex !== null}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Processar {filesWithData.length} Arquivo(s) e Criar Alvarás
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

      {/* Modal de Pré-visualização do PDF */}
      <DocumentPreviewModal
        open={!!previewUrl}
        onOpenChange={(open) => {
          if (!open) {
            handleClosePreview();
          }
        }}
        documentUrl={previewUrl}
        documentName={previewFileName}
      />
    </Dialog>
  );
}
