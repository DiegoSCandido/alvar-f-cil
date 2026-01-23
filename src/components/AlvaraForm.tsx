import { useState, useEffect, useMemo } from 'react';
import { Alvara, AlvaraFormData, ALVARA_TYPES, AlvaraType, AlvaraProcessingStatus } from '@/types/alvara';
import { Cliente } from '@/types/cliente';
import { AlvaraProcessingStatusSelect } from './AlvaraProcessingStatusSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

  const [formData, setFormData] = useState<AlvaraFormData>(() => ({
    clienteId: editingAlvara?.clienteId || '',
    type: editingAlvara?.type || ('' as AlvaraType),
    requestDate: editingAlvara?.requestDate || new Date(),
    issueDate: editingAlvara?.issueDate,
    expirationDate: editingAlvara?.expirationDate,
    processingStatus: editingAlvara?.processingStatus,
    notes: editingAlvara?.notes || '',
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
        });
      } else {
        setFormData({
          clienteId: '',
          type: '' as AlvaraType,
          requestDate: new Date(),
          issueDate: undefined,
          expirationDate: undefined,
          processingStatus: undefined,
          notes: '',
        });
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
      });
      setTempNote('');
      setRenewalExpirationDate('');
      setIsConfirmingRenewal(false);
      setError(null);
    }
  }, [editingAlvara, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      const dataToSubmit = {
        ...formData,
      };
      await onSubmit(dataToSubmit);
      // Limpar o campo de notas após salvar (histórico é preservado no BD)
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

      const dataToSubmit = {
        ...formData,
        type: editingAlvara?.type || formData.type,
        expirationDate: renewalExpirationDate,
        processingStatus: 'lançado' as AlvaraProcessingStatus,
      };
      
      await onSubmit(dataToSubmit);
      setFormData(prev => ({ ...prev, notes: '' }));
      setTempNote('');
      setRenewalExpirationDate('');
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

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
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
                    Vencimento anterior: <span className="font-mono">{format(new Date(editingAlvara.expirationDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
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
                      {cliente.nomeFantasia} - {formatCnpj(cliente.cnpj)}
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
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as AlvaraType })}
              required
              disabled={!formData.clienteId || tiposPermitidos.length === 0 || isRenewing}
            >
              <SelectTrigger id="type" className={`text-sm ${isRenewing ? 'bg-muted cursor-not-allowed' : ''}`}>
                <SelectValue placeholder={formData.clienteId ? (tiposPermitidos.length > 0 ? "Selecione o tipo" : "Nenhum tipo disponível") : "Selecione um cliente"} />
              </SelectTrigger>
              <SelectContent>
                {tiposPermitidos.length > 0 ? (
                  tiposPermitidos.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-muted-foreground text-xs sm:text-sm">Nenhum tipo disponível</div>
                )}
              </SelectContent>
            </Select>
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

          {isAlvaraEmAbertura && (
            <div className="space-y-2">
              <Label htmlFor="processingStatus" className="text-xs sm:text-sm">Status de Processamento</Label>
              <AlvaraProcessingStatusSelect
                value={formData.processingStatus}
                onValueChange={(status) =>
                  setFormData({ ...formData, processingStatus: status })
                }
              />
            </div>
          )}

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
