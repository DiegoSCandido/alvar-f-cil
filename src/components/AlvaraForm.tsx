import { useState, useEffect, useMemo, useRef } from 'react';
import { Alvara, AlvaraFormData, ALVARA_TYPES, AlvaraType, AlvaraProcessingStatus, TaxaAno } from '@/types/alvara';
import { Cliente } from '@/types/cliente';
import { AlvaraProcessingStatusSelect } from './AlvaraProcessingStatusSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAlvaraUpload } from '@/hooks/useAlvaraUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCnpj } from '@/lib/alvara-utils';
import { Link } from 'react-router-dom';
import { AlertCircle, RotateCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

interface AlvaraFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AlvaraFormData) => Promise<void>;
  editingAlvara?: Alvara | null;
  clientes: Cliente[];
  isRenewing?: boolean;
}

export function AlvaraForm({
  open,
  onOpenChange,
  onSubmit,
  editingAlvara,
  clientes,
  isRenewing = false,
}: AlvaraFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const [renewalExpirationDate, setRenewalExpirationDate] = useState('');
  const [isConfirmingRenewal, setIsConfirmingRenewal] = useState(false);
  const [tempNote, setTempNote] = useState(''); // Campo temporário para nova observação
  // Verificar se é um alvará em abertura (sem data de emissão)
  const isAlvaraEmAbertura = editingAlvara && !editingAlvara.issueDate;

  // Upload para finalização
  const [finalizeFile, setFinalizeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const finalizeFileInputRef = useRef<HTMLInputElement>(null);
  const { uploadAlvaraDocument } = useAlvaraUpload();

  // Estado para seleção de ano das taxas
  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState<number>(anoAtual);
  const [formData, setFormData] = useState<AlvaraFormData>(() => ({
    clienteId: editingAlvara?.clienteId || '',
    type: editingAlvara?.type || ('' as AlvaraType),
    requestDate: editingAlvara?.requestDate || new Date(),
    issueDate: editingAlvara?.issueDate,
    expirationDate: editingAlvara?.expirationDate,
    processingStatus: editingAlvara?.processingStatus,
    notes: editingAlvara?.notes || '',
    taxasPorAno: editingAlvara?.taxasPorAno || [],
  }));

  // Filtrar tipos de alvará permitidos pelo cliente selecionado
  const tiposPermitidos = useMemo(() => {
    const cliente = clientes.find((c) => c.id === formData.clienteId);
    return cliente?.alvaras && cliente.alvaras.length > 0 ? cliente.alvaras : [];
  }, [clientes, formData.clienteId]);

  // Atualizar formData quando editingAlvara mudar ou quando o dialog abrir/fechar
  useEffect(() => {
    if (open) {
      setError(null);
      if (editingAlvara) {
        setFormData({
          clienteId: editingAlvara.clienteId,
          type: editingAlvara.type,
          requestDate: editingAlvara.requestDate,
          issueDate: editingAlvara.issueDate,
          expirationDate: editingAlvara.expirationDate,
          processingStatus: editingAlvara.processingStatus,
          notes: editingAlvara.notes || '',
          taxasPorAno: editingAlvara.taxasPorAno || [],
        });
        setAnoSelecionado(anoAtual);
      } else {
        setFormData({
          clienteId: '',
          type: '' as AlvaraType,
          requestDate: new Date(),
          issueDate: undefined,
          expirationDate: undefined,
          processingStatus: undefined,
          notes: '',
          taxasPorAno: [],
        });
        setAnoSelecionado(anoAtual);
      }
    } else {
      // Quando o Dialog fecha, resetar o formulário completamente
      setFormData({
        clienteId: '',
        type: '' as AlvaraType,
        requestDate: new Date(),
        issueDate: undefined,
        expirationDate: undefined,
        processingStatus: undefined,
        notes: '',
        taxasPorAno: [],
      });
      setTempNote('');
      setRenewalExpirationDate('');
      setIsConfirmingRenewal(false);
      setError(null);
      setAnoSelecionado(anoAtual);
    }
  }, [editingAlvara, open, anoAtual]);
  // Funções auxiliares para manipular taxasPorAno
  const getTaxaAno = (ano: number): TaxaAno => {
    return (
      formData.taxasPorAno?.find((t) => t.ano === ano) || {
        ano,
        taxaEnviada: false,
        dataTaxaEnviada: null,
        taxaPaga: false,
        dataTaxaPaga: null,
      }
    );
  };

  const setTaxaAno = (ano: number, newTaxa: Partial<TaxaAno>) => {
    setFormData((prev) => {
      const taxas = prev.taxasPorAno ? [...prev.taxasPorAno] : [];
      const idx = taxas.findIndex((t) => t.ano === ano);
      if (idx >= 0) {
        taxas[idx] = { ...taxas[idx], ...newTaxa };
      } else {
        taxas.push({ ano, taxaEnviada: false, dataTaxaEnviada: null, taxaPaga: false, dataTaxaPaga: null, ...newTaxa });
      }
      return { ...prev, taxasPorAno: taxas };
    });
  };
  // UI para seleção de ano e status de taxas (apenas para Alvará de Funcionamento)
  const renderStatusTaxas = () => {
    if (formData.type !== 'Alvará de Funcionamento') return null;
    const taxaAno = getTaxaAno(anoSelecionado);
    return (
      <>
        <div className="mb-1 text-sm text-black">Status das Taxas Alvará</div>
        <div className="space-y-3 border rounded-md p-4 mt-0 bg-gray-50 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="ano-taxas" className="text-sm font-medium">Ano:</Label>
            <Input
              id="ano-taxas"
              type="number"
              min={2000}
              max={anoAtual + 2}
              value={anoSelecionado}
              onChange={e => setAnoSelecionado(Number(e.target.value))}
              className="w-24 text-sm"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <input
                id="taxa-enviada"
                type="checkbox"
                checked={taxaAno.taxaEnviada}
                onChange={e => setTaxaAno(anoSelecionado, { taxaEnviada: e.target.checked })}
                className="accent-blue-600 h-4 w-4 transition-colors duration-150 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <Label htmlFor="taxa-enviada" className="text-sm select-none cursor-pointer">Taxas Enviadas</Label>
              <Input
                type="date"
                value={taxaAno.dataTaxaEnviada ? formatDateForInput(taxaAno.dataTaxaEnviada) : ''}
                onChange={e => setTaxaAno(anoSelecionado, { dataTaxaEnviada: e.target.value ? new Date(e.target.value) : null })}
                disabled={!taxaAno.taxaEnviada}
                className="ml-2 w-36 text-xs"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="taxa-paga"
                type="checkbox"
                checked={taxaAno.taxaPaga}
                onChange={e => setTaxaAno(anoSelecionado, { taxaPaga: e.target.checked })}
                className="accent-blue-600 h-4 w-4 transition-colors duration-150 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <Label htmlFor="taxa-paga" className="text-sm select-none cursor-pointer">Taxas Pagas</Label>
              <Input
                type="date"
                value={taxaAno.dataTaxaPaga ? formatDateForInput(taxaAno.dataTaxaPaga) : ''}
                onChange={e => setTaxaAno(anoSelecionado, { dataTaxaPaga: e.target.value ? new Date(e.target.value) : null })}
                disabled={!taxaAno.taxaPaga}
                className="ml-2 w-36 text-xs"
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  // Função utilitária para validar datas
  function isValidDate(d: unknown): boolean {
    if (typeof d === 'string') {
      // Aceita apenas formato yyyy-mm-dd
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
      const date = new Date(d);
      return !isNaN(date.getTime());
    }
    return d instanceof Date && !isNaN(d.getTime());
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validação de datas
    if (!formData.requestDate || !isValidDate(formData.requestDate)) {
      setError('Data de solicitação inválida.');
      return;
    }
    if (formData.issueDate && !isValidDate(formData.issueDate)) {
      setError('Data de emissão inválida.');
      return;
    }
    if (formData.expirationDate && !isValidDate(formData.expirationDate)) {
      setError('Data de vencimento inválida.');
      return;
    }
    // Validação das datas das taxas
    if (formData.taxasPorAno && Array.isArray(formData.taxasPorAno)) {
      for (const taxa of formData.taxasPorAno) {
        if (taxa.dataTaxaEnviada && !isValidDate(taxa.dataTaxaEnviada)) {
          setError('Data de envio da taxa inválida.');
          return;
        }
        if (taxa.dataTaxaPaga && !isValidDate(taxa.dataTaxaPaga)) {
          setError('Data de pagamento da taxa inválida.');
          return;
        }
      }
    }
    try {
      setIsLoading(true);
      setError(null);
      const dataToSubmit = {
        ...formData,
      };
      await onSubmit(dataToSubmit);
      setFormData(prev => ({ ...prev, notes: '' }));
      setTempNote('');
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar alvará';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenovationFinalized = (e: React.FormEvent) => {
    e.preventDefault();
    // Abrir dialog para solicitar data de vencimento
    setIsConfirmingRenewal(true);
  };

  const handleConfirmRenewalFinalized = async () => {
    try {
      setIsLoading(true);
      setError(null);
      if (!renewalExpirationDate) {
        setError('Data de vencimento é obrigatória');
        return;
      }
      if (!finalizeFile) {
        setError('É obrigatório anexar o PDF do alvará.');
        return;
      }
      const dataToSubmit: AlvaraFormData = {
        ...formData,
        type: editingAlvara?.type || formData.type,
        expirationDate: new Date(renewalExpirationDate),
        processingStatus: 'lançado' as AlvaraProcessingStatus,
      };
      await onSubmit(dataToSubmit);
      // Upload documento obrigatório
      // Se precisar do id do novo alvará após criar, ajuste o onSubmit/backend para retornar esse valor
      if (editingAlvara?.id) {
        setUploading(true);
        try {
          await uploadAlvaraDocument(editingAlvara.id, finalizeFile);
        } catch (uploadErr) {
          setError('Erro ao fazer upload do documento PDF.');
          setUploading(false);
          return;
        }
        setUploading(false);
      }
      setFormData(prev => ({ ...prev, notes: '' }));
      setTempNote('');
      setRenewalExpirationDate('');
      setFinalizeFile(null);
      setIsConfirmingRenewal(false);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao finalizar renovação';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenovationUpdated = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      // Em renovação, o tipo já está preenchido do alvará original
      const dataToSubmit = {
        ...formData,
        type: editingAlvara?.type || formData.type,
        processingStatus: 'renovacao' as AlvaraProcessingStatus,
      };
      await onSubmit(dataToSubmit);
      // Limpar o campo de notas
      setFormData(prev => ({ ...prev, notes: '' }));
      setTempNote('');
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar renovação';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (date?: Date | string) => {
    if (!date) return '';
    let d: Date;
    if (typeof date === 'string') {
      d = new Date(date);
    } else {
      d = date;
    }
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const addNoteWithTimestamp = (notes: string, baseNotes?: string) => {
    if (!notes.trim()) return baseNotes || editingAlvara?.notes || '';
    
    const now = new Date();
    const timestamp = format(now, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    const userName = user?.fullName || 'Usuário';
    const noteEntry = `[${timestamp} - ${userName}] ${notes}`;
    
    // Se há notas anteriores, adiciona uma quebra de linha
    const previousNotes = baseNotes || editingAlvara?.notes || '';
    return previousNotes ? `${previousNotes}\n\n${noteEntry}` : noteEntry;
  };

  const handleAddNote = () => {
    if (!tempNote.trim()) return;
    
    // Adiciona a nota temporária ao histórico do formulário usando formData.notes como base
    const updatedNotes = addNoteWithTimestamp(tempNote, formData.notes);
    setFormData(prev => ({ ...prev, notes: updatedNotes }));
    // Limpa o campo temporário
    setTempNote('');
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`w-[95vw] sm:w-full p-4 sm:p-6 ${isRenewing ? 'sm:max-w-[600px]' : 'sm:max-w-[500px]'} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle>
            {editingAlvara ? (isRenewing ? 'Renovar Alvará' : 'Editar Alvará') : 'Novo Alvará'}
          </DialogTitle>
          <DialogDescription>
            {isRenewing
              ? 'Configure os dados da renovação do alvará'
              : editingAlvara
              ? 'Atualize as informações do alvará'
              : 'Preencha os dados para cadastrar um novo alvará'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className={`${isRenewing ? 'space-y-3' : 'space-y-4'}`}>

          {isRenewing && editingAlvara?.expirationDate && (
            <Alert className="bg-amber-50 border-amber-200">
              <RotateCw className="h-4 w-4 text-amber-600" />
              <AlertDescription>
                <div className="text-amber-900">
                  <div className="font-semibold">Modo Renovação</div>
                  <div className="text-sm mt-1">
                    Vencimento anterior: <span className="font-mono">{
                      isValidDate(editingAlvara.expirationDate)
                        ? format(new Date(editingAlvara.expirationDate), 'dd/MM/yyyy', { locale: ptBR })
                        : '--/--/----'
                    }</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="clienteId">Cliente *</Label>
            <Select
              value={formData.clienteId}
              onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
              required
              disabled={isAlvaraEmAbertura || isRenewing}
            >
              <SelectTrigger id="clienteId" className={`text-sm ${(isAlvaraEmAbertura || isRenewing) ? 'bg-muted cursor-not-allowed' : ''}`}>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.length === 0 ? (
                  <div className="p-4 text-xs sm:text-sm text-muted-foreground text-center">
                    <p>Nenhum cliente cadastrado</p>
                    <Link to="/clientes" className="text-primary underline mt-2 block">
                      Cadastrar cliente
                    </Link>
                  </div>
                ) : (
                  clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.razaoSocial}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {isAlvaraEmAbertura && (
              <p className="text-xs text-muted-foreground">
                O cliente não pode ser alterado em alvarás em abertura.
              </p>
            )}
            {isRenewing && (
              <p className="text-xs text-muted-foreground">
                O cliente não pode ser alterado em processo de renovação.
              </p>
            )}
            {clientes.length === 0 && !isAlvaraEmAbertura && (
              <p className="text-xs text-muted-foreground">
                <Link to="/clientes" className="text-primary underline">
                  Cadastre um cliente
                </Link>{' '}
                antes de criar um alvará.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-xs sm:text-sm">Tipo de Alvará *</Label>
            {/* Se está em funcionamento ou em abertura (edição), mostra como somente leitura */}
            {editingAlvara ? (
              <Input
                id="type"
                value={formData.type}
                readOnly
                disabled
                className="text-sm bg-muted cursor-not-allowed"
              />
            ) : (
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as AlvaraType })}
                required
                disabled={!formData.clienteId || isRenewing}
              >
                <SelectTrigger id="type" className={`text-sm ${isRenewing ? 'bg-muted cursor-not-allowed' : ''}`}> 
                  <SelectValue placeholder={formData.clienteId ? (tiposPermitidos.length > 0 ? "Selecione o tipo" : "Nenhum tipo disponível") : "Selecione um cliente"} />
                </SelectTrigger>
                <SelectContent>
                  {/* Sempre mostra o tipo atual se não estiver em tiposPermitidos OU se tiposPermitidos está vazio */}
                  {formData.type && (!tiposPermitidos.includes(formData.type) || tiposPermitidos.length === 0) && (
                    <SelectItem key={formData.type} value={formData.type}>
                      {formData.type} (atual)
                    </SelectItem>
                  )}
                  {tiposPermitidos.length > 0 && tiposPermitidos.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {isRenewing && (
              <p className="text-xs text-muted-foreground">
                O tipo de alvará não pode ser alterado em processo de renovação.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="requestDate" className="text-xs sm:text-sm">Data Solicitação *</Label>
            <Input
              id="requestDate"
              type="date"
              value={formatDateForInput(formData.requestDate)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  requestDate: new Date(e.target.value),
                })
              }
              className="text-sm"
              required
              disabled={isRenewing}
            />
          </div>
          {/* Exibir campo de vencimento apenas ao editar alvará */}
          {editingAlvara && (
            <div className="space-y-2">
              <Label htmlFor="expirationDate" className="text-xs sm:text-sm">Data de Vencimento</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formatDateForInput(formData.expirationDate)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expirationDate: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
                className="text-sm"
                disabled={isRenewing}
              />
            </div>
          )}

          {isAlvaraEmAbertura && (
            <div className="space-y-2">
              <Label htmlFor="processingStatus" className="text-xs sm:text-sm">Status de Processamento</Label>
              <AlvaraProcessingStatusSelect
                value={formData.processingStatus}
                onValueChange={(status) =>
                  setFormData({ ...formData, processingStatus: status })
                }
                onlyInitialOptions
              />
            </div>
          )}

          {/* Status das Taxas (apenas para Alvará de Funcionamento) */}
          {renderStatusTaxas()}

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs sm:text-sm">Adicionar Observação</Label>
            <div className="flex gap-2">
              <Textarea
                id="notes"
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder={isRenewing ? "Digite uma nota sobre a renovação..." : "Digite uma observação..."}
                className="text-sm flex-1"
                rows={2}
              />
              <Button
                type="button"
                onClick={handleAddNote}
                disabled={!tempNote.trim() || isLoading}
                variant="outline"
                className="self-end"
              >
                Adicionar
              </Button>
            </div>
            {formData.notes && (
              <div className="mt-2 pt-2 border-t space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">Histórico</div>
                <div className="bg-gray-50 rounded p-2 text-xs space-y-0 overflow-y-auto max-h-32 border border-gray-200 min-h-fit">
                  {formData.notes.split('\n\n').map((note, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs py-1.5 px-1 border-b border-gray-200 last:border-b-0">
                      <span className="text-amber-600 shrink-0 mt-0.5 font-bold">•</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-gray-700 whitespace-pre-wrap break-words text-xs leading-tight">
                          {note}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className={`gap-2 flex flex-col-reverse ${isRenewing ? 'sm:flex-row sm:justify-end' : 'sm:flex-row'}`}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            {isRenewing ? (
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  onClick={handleRenovationUpdated}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  {isLoading ? 'Salvando...' : 'Renovação Atualizada'}
                </Button>
                <Button
                  type="button"
                  onClick={handleRenovationFinalized}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Finalizando...' : 'Renovação Finalizada'}
                </Button>
              </div>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : editingAlvara ? 'Salvar Alterações' : 'Cadastrar'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Dialog para data de vencimento da renovação */}
    <Dialog open={isConfirmingRenewal} onOpenChange={setIsConfirmingRenewal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finalizar Renovação</DialogTitle>
          <DialogDescription>
            Informe a data de vencimento do alvará renovado
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid w-full items-center gap-2">
          <Label htmlFor="renewal-expiration-date">Data de Vencimento *</Label>
          <Input
            id="renewal-expiration-date"
            type="date"
            value={renewalExpirationDate}
            onChange={(e) => {
              setRenewalExpirationDate(e.target.value);
              setError(null);
            }}
            disabled={isLoading}
          />
        </div>
        <div className="grid w-full items-center gap-2 mt-2">
          <Label htmlFor="finalize-alvara-pdf">Documento do Alvará (PDF) *</Label>
          <Input
            id="finalize-alvara-pdf"
            type="file"
            accept="application/pdf"
            ref={finalizeFileInputRef}
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setFinalizeFile(e.target.files[0]);
              } else {
                setFinalizeFile(null);
              }
              setError(null);
            }}
            disabled={isLoading || uploading}
            className="text-sm"
          />
          {finalizeFile && <span className="text-xs text-green-700">{finalizeFile.name}</span>}
          {uploading && <span className="text-xs text-blue-700">Enviando documento...</span>}
        </div>

        <DialogFooter className="mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsConfirmingRenewal(false);
              setRenewalExpirationDate('');
              setError(null);
            }}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmRenewalFinalized}
            disabled={isLoading || !renewalExpirationDate}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? 'Finalizando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
