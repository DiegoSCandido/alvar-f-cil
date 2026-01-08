import { useState, useEffect } from 'react';
import { Alvara, AlvaraFormData, ALVARA_TYPES, AlvaraType } from '@/types/alvara';
import { Cliente } from '@/types/cliente';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface AlvaraFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AlvaraFormData) => void;
  editingAlvara?: Alvara | null;
  clientes: Cliente[];
}

export function AlvaraForm({
  open,
  onOpenChange,
  onSubmit,
  editingAlvara,
  clientes,
}: AlvaraFormProps) {
  // Verificar se é um alvará em abertura (sem data de emissão)
  const isAlvaraEmAbertura = editingAlvara && !editingAlvara.issueDate;

  const [formData, setFormData] = useState<AlvaraFormData>(() => ({
    clienteId: editingAlvara?.clienteId || '',
    type: editingAlvara?.type || ('' as AlvaraType),
    requestDate: editingAlvara?.requestDate || new Date(),
    issueDate: editingAlvara?.issueDate,
    expirationDate: editingAlvara?.expirationDate,
    notes: editingAlvara?.notes || '',
  }));

  // Atualizar formData quando editingAlvara mudar ou quando o dialog abrir/fechar
  useEffect(() => {
    if (open) {
      if (editingAlvara) {
        setFormData({
          clienteId: editingAlvara.clienteId,
          type: editingAlvara.type,
          requestDate: editingAlvara.requestDate,
          issueDate: editingAlvara.issueDate,
          expirationDate: editingAlvara.expirationDate,
          notes: editingAlvara.notes || '',
        });
      } else {
        setFormData({
          clienteId: '',
          type: '' as AlvaraType,
          requestDate: new Date(),
          issueDate: undefined,
          expirationDate: undefined,
          notes: '',
        });
      }
    }
  }, [editingAlvara, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    // Não resetar aqui - o useEffect vai cuidar disso quando editingAlvara mudar
  };

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingAlvara ? 'Editar Alvará' : 'Novo Alvará'}
          </DialogTitle>
          <DialogDescription>
            {editingAlvara
              ? 'Atualize as informações do alvará'
              : 'Preencha os dados para cadastrar um novo alvará'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clienteId">Cliente *</Label>
            <Select
              value={formData.clienteId}
              onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
              required
              disabled={isAlvaraEmAbertura}
            >
              <SelectTrigger className={isAlvaraEmAbertura ? 'bg-muted cursor-not-allowed' : ''}>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground text-center">
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
            <Label htmlFor="type">Tipo de Alvará *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as AlvaraType })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {ALVARA_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestDate">Data Solicitação *</Label>
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
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueDate">Data Emissão</Label>
              <Input
                id="issueDate"
                type="date"
                value={formatDateForInput(formData.issueDate)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    issueDate: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Data Vencimento</Label>
              <Input
                id="expirationDate"
                type="date"
                value={formatDateForInput(formData.expirationDate)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expirationDate: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingAlvara ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
