import { useState, useEffect } from 'react';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { AlertCircle, Trash2, Plus, Download } from 'lucide-react';
import { CnaeSelect } from '@/components/CnaeSelect';
import { AtividadeSecundariaSelect } from '@/components/AtividadeSecundariaSelect';

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
  onSubmit: (data: ClienteFormData) => Promise<void>;
  editingCliente?: Cliente | null;
}

export function ClienteForm({
  open,
  onOpenChange,
  onSubmit,
  editingCliente,
}: ClienteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dados');
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

  // Estados para atividades secundárias
  const [novaAtividadeCodigo, setNovaAtividadeCodigo] = useState('');
  const [novaAtividadeDescricao, setNovaAtividadeDescricao] = useState('');
  const [atividades, setAtividades] = useState<any[]>([]);
  const [atividadesLoading, setAtividadesLoading] = useState(false);

  // Estados para documentos
  const [nomeDocumento, setNomeDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [documentosLoading, setDocumentosLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Handler para selecionar uma CNAE da lista
  const handleSelecionarCnae = (codigo: string, descricao: string) => {
    setFormData({
      ...formData,
      atividadePrincipalCodigo: codigo,
      atividadePrincipalDescricao: descricao,
    });
  };

  // Handler para selecionar uma atividade secundária da lista
  const handleSelecionarAtividade = (codigo: string, descricao: string) => {
    setNovaAtividadeCodigo(codigo);
    setNovaAtividadeDescricao(descricao);
  };
  useEffect(() => {
    if (open) {
      setError(null);
      setActiveTab('dados');
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
        loadAtividades(editingCliente.id);
        loadDocumentos(editingCliente.id);
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
        setAtividades([]);
        setDocumentos([]);
      }
    }
  }, [editingCliente, open]);

  const loadAtividades = async (clienteId: string) => {
    try {
      setAtividadesLoading(true);
      const response = await fetch(`${API_BASE_URL}/atividades-secundarias/cliente/${clienteId}`);
      if (response.ok) {
        const data = await response.json();
        setAtividades(data);
      }
    } catch (err) {
      console.error('Erro ao carregar atividades:', err);
    } finally {
      setAtividadesLoading(false);
    }
  };

  const loadDocumentos = async (clienteId: string) => {
    try {
      setDocumentosLoading(true);
      const response = await fetch(`${API_BASE_URL}/documentos-cliente/cliente/${clienteId}`);
      if (response.ok) {
        const data = await response.json();
        setDocumentos(data);
      }
    } catch (err) {
      console.error('Erro ao carregar documentos:', err);
    } finally {
      setDocumentosLoading(false);
    }
  };

  // Função para limpar o CNPJ (remover pontos, barras e hífens)
  function limparCNPJ(cnpj: string) {
    return cnpj.replace(/\D/g, '');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formDataLimpo = {
        ...formData,
        cnpj: limparCNPJ(formData.cnpj),
      };
      await onSubmit(formDataLimpo);
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar cliente';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAtividade = async () => {
    if (!editingCliente || !novaAtividadeCodigo || !novaAtividadeDescricao) {
      setError('Preencha código e descrição da atividade');
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/atividades-secundarias/${editingCliente.id}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: novaAtividadeCodigo,
            descricao: novaAtividadeDescricao,
          }),
        }
      );
      if (!response.ok) throw new Error('Erro ao adicionar atividade');

      setNovaAtividadeCodigo('');
      setNovaAtividadeDescricao('');
      loadAtividades(editingCliente.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar atividade';
      setError(message);
    }
  };

  const handleAddDocumento = async () => {
    if (!editingCliente || !nomeDocumento || !arquivoSelecionado) {
      setError('Preencha o nome e selecione um arquivo');
      return;
    }

    try {
      setError(null);
      const formDataDoc = new FormData();
      formDataDoc.append('nomeDocumento', nomeDocumento);
      if (tipoDocumento) {
        formDataDoc.append('tipoDocumento', tipoDocumento);
      }
      formDataDoc.append('file', arquivoSelecionado);

      const response = await fetch(
        `${API_BASE_URL}/documentos-cliente/upload/${editingCliente.id}`,
        {
          method: 'POST',
          body: formDataDoc,
        }
      );

      if (!response.ok) throw new Error('Erro ao fazer upload');

      setNomeDocumento('');
      setTipoDocumento('');
      setArquivoSelecionado(null);
      loadDocumentos(editingCliente.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload';
      setError(message);
    }
  };

  const deleteAtividade = async (id: string) => {
    if (!editingCliente) return;
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/atividades-secundarias/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar');
      loadAtividades(editingCliente.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar atividade';
      setError(message);
    }
  };

  const deleteDocumento = async (id: string) => {
    if (!editingCliente) return;
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/documentos-cliente/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erro ao deletar');
      loadDocumentos(editingCliente.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar documento';
      setError(message);
    }
  };

  const downloadDocumento = (id: string) => {
    window.location.href = `${API_BASE_URL}/documentos-cliente/download/${id}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
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

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
            <TabsTrigger value="atividades">
              Atividades
            </TabsTrigger>
            <TabsTrigger value="documentos" disabled={!editingCliente}>
              Documentos
            </TabsTrigger>
          </TabsList>

          {/* Aba Dados Básicos */}
          <TabsContent value="dados">
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
                    required
                  />
                </div>
              </div>

              {/* Nome Fantasia e Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                  <Input
                    id="nomeFantasia"
                    value={formData.nomeFantasia}
                    onChange={(e) =>
                      setFormData({ ...formData, nomeFantasia: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Padrão</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Telefone e Email Apuração */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({ ...formData, telefone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailApuracao">Email Apuração</Label>
                  <Input
                    id="emailApuracao"
                    type="email"
                    value={formData.emailApuracao}
                    onChange={(e) =>
                      setFormData({ ...formData, emailApuracao: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* UF e Município */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uf">UF</Label>
                  <Select
                    value={formData.uf}
                    onValueChange={(value) =>
                      setFormData({ ...formData, uf: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um estado" />
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um regime" />
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

              {/* Atividade Principal agora disponível na aba "Atividades" */}
              <div className="p-2 text-sm text-gray-500">
                A seleção da atividade principal foi movida para a aba "Atividades".
                Vá para a aba para escolher a atividade principal e adicionar atividades
                secundárias.
              </div>

              {/* Inscrições */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                  <Input
                    id="inscricaoMunicipal"
                    value={formData.inscricaoMunicipal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inscricaoMunicipal: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                  <Input
                    id="inscricaoEstadual"
                    value={formData.inscricaoEstadual}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        inscricaoEstadual: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Botões */}
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Aba Atividades Secundárias */}
          <TabsContent value="atividades" className="space-y-4">
            <div className="space-y-4">
              {/* Seleção da Atividade Principal (CNAE) */}
              <div className="space-y-4">
                <CnaeSelect
                  label="Atividade Principal (CNAE)"
                  codigoValue={formData.atividadePrincipalCodigo}
                  descricaoValue={formData.atividadePrincipalDescricao}
                  onSelect={handleSelecionarCnae}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="novaCodigo">Código</Label>
                  <Input
                    id="novaCodigo"
                    value={novaAtividadeCodigo}
                    readOnly
                    className="bg-gray-50"
                    placeholder="Selecionar via dropdown"
                  />
                </div>
                <div className="space-y-0">
                  <AtividadeSecundariaSelect
                    label="Descrição da Atividade"
                    codigoValue={novaAtividadeCodigo}
                    descricaoValue={novaAtividadeDescricao}
                    onSelect={handleSelecionarAtividade}
                  />
                </div>
              </div>
              <Button
                onClick={handleAddAtividade}
                disabled={atividadesLoading || !editingCliente}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Atividade
              </Button>
              {!editingCliente && (
                <p className="text-sm text-gray-500 mt-2">
                  Salve o cliente primeiro para poder adicionar atividades
                  secundárias. Você já pode selecionar a atividade principal acima.
                </p>
              )}
            </div>

            {/* Lista de Atividades */}
            <div className="space-y-2">
              <h3 className="font-semibold">Atividades Secundárias</h3>
              {atividadesLoading ? (
                <p className="text-sm text-gray-500">Carregando...</p>
              ) : atividades.length > 0 ? (
                <ul className="space-y-2">
                  {atividades.map((atividade) => (
                    <li
                      key={atividade.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">{atividade.codigo}</p>
                        <p className="text-sm text-gray-600">{atividade.descricao}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAtividade(atividade.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma atividade cadastrada</p>
              )}
            </div>
          </TabsContent>

          {/* Aba Documentos */}
          <TabsContent value="documentos" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeDoc">Nome do Documento</Label>
                <Input
                  id="nomeDoc"
                  value={nomeDocumento}
                  onChange={(e) => setNomeDocumento(e.target.value)}
                  placeholder="Ex: RG, CPF, Contrato..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoDoc">Tipo de Documento (opcional)</Label>
                <Input
                  id="tipoDoc"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  placeholder="Ex: Pessoal, Empresa..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="arquivo">Selecionar Arquivo</Label>
                <Input
                  id="arquivo"
                  type="file"
                  onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)}
                />
              </div>

              <Button
                onClick={handleAddDocumento}
                disabled={documentosLoading}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Upload Documento
              </Button>
            </div>

            {/* Lista de Documentos */}
            <div className="space-y-2">
              <h3 className="font-semibold">Documentos da Empresa</h3>
              {documentosLoading ? (
                <p className="text-sm text-gray-500">Carregando...</p>
              ) : documentos.length > 0 ? (
                <ul className="space-y-2">
                  {documentos.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">{doc.nomeDocumento}</p>
                        <p className="text-sm text-gray-600">{doc.nomeArquivo}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadDocumento(doc.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocumento(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">Nenhum documento cadastrado</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
