import { useState } from 'react';
import { Alvara, AlvaraFormData } from '@/types/alvara';
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

const ALVARA_TYPES = [
  'Alvará de Funcionamento',
  'Alvará Sanitário',
  'Alvará de Bombeiros',
  'Alvará Ambiental',
  'Licença de Publicidade',
  'Alvará de Construção',
  'Outro',
];

interface AlvaraFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AlvaraFormData) => void;
  editingAlvara?: Alvara | null;
}

export function AlvaraForm({
  open,
  onOpenChange,
  onSubmit,
  editingAlvara,
}: AlvaraFormProps) {
  const [formData, setFormData] = useState<AlvaraFormData>(() => ({
    clientName: editingAlvara?.clientName || '',
    clientCnpj: editingAlvara?.clientCnpj || '',
    type: editingAlvara?.type || '',
    requestDate: editingAlvara?.requestDate || new Date(),
    issueDate: editingAlvara?.issueDate,
    expirationDate: editingAlvara?.expirationDate,
    notes: editingAlvara?.notes || '',
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      clientName: '',
      clientCnpj: '',
      type: '',
      requestDate: new Date(),
      issueDate: undefined,
      expirationDate: undefined,
      notes: '',
    });
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData({ ...formData, clientName: e.target.value })
                }
                placeholder="Empresa XYZ Ltda"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientCnpj">CNPJ *</Label>
              <Input
                id="clientCnpj"
                value={formData.clientCnpj}
                onChange={(e) =>
                  setFormData({ ...formData, clientCnpj: e.target.value })
                }
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Alvará *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
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
