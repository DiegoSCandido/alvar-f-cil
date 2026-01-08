import { useState, useEffect } from 'react';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const REGIMES_TRIBUTARIOS = [
  'Simples Nacional',
  'Simples Nacional - MEI',
  'Lucro Presumido',
  'Lucro Real',
  'Lucro Arbitrado',
];

interface ClienteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClienteFormData) => void;
  editingCliente?: Cliente | null;
}

export function ClienteForm({
  open,
  onOpenChange,
  onSubmit,
  editingCliente,
}: ClienteFormProps) {
  const [formData, setFormData] = useState<ClienteFormData>(() => ({
    cnpj: editingCliente?.cnpj || '',
    razaoSocial: editingCliente?.razaoSocial || '',
    nomeFantasia: editingCliente?.nomeFantasia || '',
    email: editingCliente?.email || '',
    telefone: editingCliente?.telefone || '',
    emailApuracao: editingCliente?.emailApuracao || '',
    uf: editingCliente?.uf || '',
    municipio: editingCliente?.municipio || '',
    regimeTributario: editingCliente?.regimeTributario || '',
    atividadePrincipalCodigo: editingCliente?.atividadePrincipalCodigo || '',
    atividadePrincipalDescricao: editingCliente?.atividadePrincipalDescricao || '',
    inscricaoMunicipal: editingCliente?.inscricaoMunicipal || '',
    inscricaoEstadual: editingCliente?.inscricaoEstadual || '',
  }));

  // Atualizar formData quando editingCliente mudar ou quando o dialog abrir/fechar
  useEffect(() => {
    if (open) {
      if (editingCliente) {
        setFormData({
          cnpj: editingCliente.cnpj,
          razaoSocial: editingCliente.razaoSocial,
          nomeFantasia: editingCliente.nomeFantasia,
          email: editingCliente.email,
          telefone: editingCliente.telefone,
          emailApuracao: editingCliente.emailApuracao,
          uf: editingCliente.uf,
          municipio: editingCliente.municipio,
          regimeTributario: editingCliente.regimeTributario,
          atividadePrincipalCodigo: editingCliente.atividadePrincipalCodigo,
          atividadePrincipalDescricao: editingCliente.atividadePrincipalDescricao,
          inscricaoMunicipal: editingCliente.inscricaoMunicipal || '',
          inscricaoEstadual: editingCliente.inscricaoEstadual || '',
        });
      } else {
        setFormData({
          cnpj: '',
          razaoSocial: '',
          nomeFantasia: '',
          email: '',
          telefone: '',
          emailApuracao: '',
          uf: '',
          municipio: '',
          regimeTributario: '',
          atividadePrincipalCodigo: '',
          atividadePrincipalDescricao: '',
          inscricaoMunicipal: '',
          inscricaoEstadual: '',
        });
      }
    }
  }, [editingCliente, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {editingCliente
              ? 'Atualize as informações do cliente'
              : 'Preencha os dados para cadastrar um novo cliente'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* CNPJ e Razão Social */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) =>
                  setFormData({ ...formData, cnpj: e.target.value })
                }
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="razaoSocial">Razão Social</Label>
              <Input
                id="razaoSocial"
                value={formData.razaoSocial}
                onChange={(e) =>
                  setFormData({ ...formData, razaoSocial: e.target.value })
                }
                placeholder="Empresa XYZ Ltda"
                required
              />
            </div>
          </div>

          {/* Nome Fantasia */}
          <div className="space-y-2">
            <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
            <Input
              id="nomeFantasia"
              value={formData.nomeFantasia}
              onChange={(e) =>
                setFormData({ ...formData, nomeFantasia: e.target.value })
              }
              placeholder="Nome comercial da empresa"
              required
            />
          </div>

          {/* E-mail e Telefone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contato@empresa.com.br"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                placeholder="(00) 00000-0000"
                required
              />
            </div>
          </div>

          {/* E-mail para Apuração */}
          <div className="space-y-2">
            <Label htmlFor="emailApuracao">E-mail para Envio de Apuração</Label>
            <Input
              id="emailApuracao"
              type="email"
              value={formData.emailApuracao}
              onChange={(e) =>
                setFormData({ ...formData, emailApuracao: e.target.value })
              }
              placeholder="apuracao@empresa.com.br"
              required
            />
          </div>

          {/* UF e Município */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Select
                value={formData.uf}
                onValueChange={(value) => setFormData({ ...formData, uf: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a UF" />
                </SelectTrigger>
                <SelectContent>
                  {UFS.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipio">Município</Label>
              <Input
                id="municipio"
                value={formData.municipio}
                onChange={(e) =>
                  setFormData({ ...formData, municipio: e.target.value })
                }
                placeholder="Nome do município"
                required
              />
            </div>
          </div>

          {/* Regime Tributário */}
          <div className="space-y-2">
            <Label htmlFor="regimeTributario">Regime Tributário</Label>
            <Select
              value={formData.regimeTributario}
              onValueChange={(value) =>
                setFormData({ ...formData, regimeTributario: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o regime tributário" />
              </SelectTrigger>
              <SelectContent>
                {REGIMES_TRIBUTARIOS.map((regime) => (
                  <SelectItem key={regime} value={regime}>
                    {regime}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Atividade Principal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="atividadePrincipalCodigo">Código da Atividade Principal</Label>
              <Input
                id="atividadePrincipalCodigo"
                value={formData.atividadePrincipalCodigo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    atividadePrincipalCodigo: e.target.value,
                  })
                }
                placeholder="Ex: 4711-3"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="atividadePrincipalDescricao">Descrição da Atividade Principal</Label>
              <Input
                id="atividadePrincipalDescricao"
                value={formData.atividadePrincipalDescricao}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    atividadePrincipalDescricao: e.target.value,
                  })
                }
                placeholder="Comércio varejista de mercadorias em geral"
                required
              />
            </div>
          </div>

          {/* Inscrições */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
              <Input
                id="inscricaoMunicipal"
                value={formData.inscricaoMunicipal}
                onChange={(e) =>
                  setFormData({ ...formData, inscricaoMunicipal: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
              <Input
                id="inscricaoEstadual"
                value={formData.inscricaoEstadual}
                onChange={(e) =>
                  setFormData({ ...formData, inscricaoEstadual: e.target.value })
                }
              />
            </div>
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
              {editingCliente ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
