import { useState, useEffect } from 'react';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { ALVARA_TYPES } from '@/types/alvara';
import { Checkbox } from '@/components/ui/checkbox';
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
import { AlertCircle, Trash2, Plus, Download, Search, Loader, Paperclip, Eye } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { CnaeSelect } from '@/components/CnaeSelect';
import { AtividadeSecundariaSelect } from '@/components/AtividadeSecundariaSelect';
import { fetchCNPJData, convertCNPJDataToFormData } from '@/lib/cnpj-api';
import { atividadeSecundariaAPI, documentoClienteAPI } from '@/lib/api-client';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { useDocumentosClienteDownload } from '@/hooks/useDocumentosClienteDownload';

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
  const [searchingCNPJ, setSearchingCNPJ] = useState(false);
  const [formData, setFormData] = useState<ClienteFormData>(() => ({
    cnpj: editingCliente?.cnpj || '',
    razaoSocial: editingCliente?.razaoSocial || '',
    nomeFantasia: editingCliente?.nomeFantasia || '',
    uf: editingCliente?.uf || '',
    municipio: editingCliente?.municipio || '',
    atividadePrincipalCodigo: editingCliente?.atividadePrincipalCodigo || '',
    atividadePrincipalDescricao: editingCliente?.atividadePrincipalDescricao || '',
    alvaras: editingCliente?.alvaras || [],
  }));

  // Comentado - usamos apenas a cidade que vem do CNPJ
  // const { cidades, isLoading: cidadesLoading } = useCidades(formData.uf);

  // Estados para atividades secundárias
  const [novaAtividadeCodigo, setNovaAtividadeCodigo] = useState('');
  const [novaAtividadeDescricao, setNovaAtividadeDescricao] = useState('');
  const [atividades, setAtividades] = useState<any[]>([]);
  const [atividadesLoading, setAtividadesLoading] = useState(false);
  const [atividadesSecundariasAPI, setAtividadesSecundariasAPI] = useState<Array<{ code: string; text: string }>>([]);

  // Estados para documentos
  const [nomeDocumento, setNomeDocumento] = useState('');
  const [presetDocumento, setPresetDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [documentosLoading, setDocumentosLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { getDownloadUrl, isLoading: isDownloading } = useDocumentosClienteDownload();

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
          uf: editingCliente.uf,
          municipio: editingCliente.municipio,
          atividadePrincipalCodigo: editingCliente.atividadePrincipalCodigo,
          atividadePrincipalDescricao: editingCliente.atividadePrincipalDescricao,
          alvaras: editingCliente.alvaras || [],
        });
        loadAtividades(editingCliente.id);
        loadDocumentos(editingCliente.id);
      } else {
        setFormData({
          cnpj: '',
          razaoSocial: '',
          nomeFantasia: '',
          uf: '',
          municipio: '',
          atividadePrincipalCodigo: '',
          atividadePrincipalDescricao: '',
          alvaras: [],
        });
        setAtividades([]);
        setDocumentos([]);
        setAtividadesSecundariasAPI([]);
      }
    }
  }, [editingCliente, open]);

  const loadAtividades = async (clienteId: string) => {
    try {
      setAtividadesLoading(true);
      console.log('[loadAtividades] Carregando para cliente:', clienteId);
      const data = await atividadeSecundariaAPI.listByCliente(clienteId);
      console.log('[loadAtividades] Atividades carregadas:', data);
      setAtividades(data);
    } catch (err) {
      console.error('[loadAtividades] Erro ao carregar atividades:', err);
    } finally {
      setAtividadesLoading(false);
    }
  };

  const loadDocumentos = async (clienteId: string) => {
    try {
      setDocumentosLoading(true);
      const data = await documentoClienteAPI.listByCliente(clienteId);
      setDocumentos(data);
    } catch (err) {
      console.error('[loadDocumentos] Erro ao carregar documentos:', err);
    } finally {
      setDocumentosLoading(false);
    }
  };

  // Função para limpar o CNPJ (remover pontos, barras e hífens)
  function limparCNPJ(cnpj: string) {
    return cnpj.replace(/\D/g, '');
  }

  // Função para buscar dados do CNPJ na API ReceitaWS
  const handleBuscarCNPJ = async () => {
    const cnpjLimpo = limparCNPJ(formData.cnpj);
    
    if (cnpjLimpo.length !== 14) {
      setError('CNPJ deve ter 14 dígitos');
      return;
    }

    setSearchingCNPJ(true);
    setError(null);

    try {
      const cnpjData = await fetchCNPJData(cnpjLimpo);
      if (cnpjData) {
        const novosDados = convertCNPJDataToFormData(cnpjData);
        
        console.log('[handleBuscarCNPJ] Dados brutos do CNPJ:', cnpjData);
        console.log('[handleBuscarCNPJ] Dados convertidos:', novosDados);
        
        // Formatando CNPJ para exibição
        const cnpjFormatado = `${cnpjLimpo.substring(0, 2)}.${cnpjLimpo.substring(2, 5)}.${cnpjLimpo.substring(5, 8)}/${cnpjLimpo.substring(8, 12)}-${cnpjLimpo.substring(12)}`;
        
        // Fazer um único update com todos os dados
        setFormData(prev => { 
          const novoFormData = {
            ...prev, 
            ...novosDados,
            cnpj: cnpjFormatado
          };
          console.log('[handleBuscarCNPJ] FormData depois do update:', novoFormData);
          return novoFormData;
        });
        
        // Armazenar atividades secundárias da API
        if (cnpjData.atividades_secundarias && cnpjData.atividades_secundarias.length > 0) {
          setAtividadesSecundariasAPI(cnpjData.atividades_secundarias);
        } else {
          setAtividadesSecundariasAPI([]);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar CNPJ';
      setError(message);
      console.error('Erro ao buscar CNPJ:', err);
      setAtividadesSecundariasAPI([]);
    } finally {
      setSearchingCNPJ(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validar campos obrigatórios
    if (!formData.cnpj || formData.cnpj.trim() === '') {
      setError('CNPJ é obrigatório');
      return;
    }
    
    if (!formData.razaoSocial || formData.razaoSocial.trim() === '') {
      setError('Razão Social é obrigatória');
      return;
    }

    setIsLoading(true);

    try {
      const formDataLimpo = {
        ...formData,
        cnpj: limparCNPJ(formData.cnpj),
        // Incluir atividades secundárias da API se existirem (para novo cliente)
        ...(atividadesSecundariasAPI.length > 0 && !editingCliente && {
          atividadesSecundarias: atividadesSecundariasAPI.map(atividade => ({
            codigo: atividade.code,
            descricao: atividade.text,
          }))
        }),
      };
      
      // Fazer submit do cliente com atividades incluídas no payload
      const result = await onSubmit(formDataLimpo);
      
      console.log(`✅ Cliente salvo. Atividades já foram persistidas no banco via POST.`);
      
      setAtividadesSecundariasAPI([]);
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
      await atividadeSecundariaAPI.create(editingCliente.id, {
        codigo: novaAtividadeCodigo,
        descricao: novaAtividadeDescricao,
      });

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

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/documentos-cliente/upload/${editingCliente.id}`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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
      await atividadeSecundariaAPI.delete(id);
      loadAtividades(editingCliente.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar atividade';
      setError(message);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const deleteDocumento = async (id: string) => {
    if (!editingCliente) return;
    try {
      setError(null);
      await documentoClienteAPI.delete(id);
      loadDocumentos(editingCliente.id);
      setConfirmDeleteId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar documento';
      setError(message);
      setConfirmDeleteId(null);
    }
  };

  // Handler para visualizar o documento
  const handlePreview = async (documentoId: string) => {
    try {
      const { signedUrl, originalName } = await getDownloadUrl(documentoId);
      setPreviewUrl(signedUrl);
      setPreviewName(originalName || 'Documento');
      setIsPreviewOpen(true);
    } catch (err) {
      alert('Erro ao carregar documento.');
    }
  };

  // Handler para download do documento
  const downloadDocumento = async (id: string) => {
    try {
      const { signedUrl } = await getDownloadUrl(id);
      // Abre o documento em uma nova aba
      window.open(signedUrl, '_blank', 'noopener');
    } catch (err) {
      alert('Erro ao abrir documento.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-[900px] lg:max-w-[1000px] xl:max-w-[1100px] max-h-[90vh] overflow-y-auto p-3 sm:p-4 lg:p-6">
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

        {atividadesSecundariasAPI.length > 0 && !editingCliente && (
          <Alert className="mb-4 border-o2-purple/20 bg-o2-purple-light">
            <AlertCircle className="h-4 w-4 text-o2-purple" />
            <AlertDescription className="text-o2-purple-dark">
              ✨ {atividadesSecundariasAPI.length} atividade(s) secundária(s) encontrada(s) serão salvas automaticamente
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 text-xs sm:text-sm">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="atividades">Ativid.</TabsTrigger>
            <TabsTrigger value="documentos" disabled={!editingCliente}>Docs</TabsTrigger>
          </TabsList>

          {/* Aba Dados Básicos */}
          <TabsContent value="dados">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* CNPJ */}
              <div className="space-y-2">
                <Label htmlFor="cnpj" className="text-xs sm:text-sm">CNPJ <span className="text-red-500">*</span></Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) =>
                    setFormData({ ...formData, cnpj: e.target.value })
                  }
                  onBlur={() => {
                    const cnpjLimpo = limparCNPJ(formData.cnpj);
                    if (cnpjLimpo.length === 14) {
                      handleBuscarCNPJ();
                    }
                  }}
                  placeholder="00.000.000/0000-00"
                  className="text-sm"
                  required
                  disabled={searchingCNPJ}
                />
                {searchingCNPJ && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader className="h-3 w-3 animate-spin" />
                    Buscando informações do CNPJ...
                  </p>
                )}
              </div>

              {/* Razão Social */}
              <div className="space-y-2">
                <Label htmlFor="razaoSocial" className="text-xs sm:text-sm">Razão Social <span className="text-red-500">*</span></Label>
                <Input
                  id="razaoSocial"
                  value={formData.razaoSocial}
                  onChange={(e) =>
                    setFormData({ ...formData, razaoSocial: e.target.value })
                  }
                  className="text-sm"
                  required
                />
              </div>


              {/* Nome Fantasia */}
              <div className="space-y-2">
                <Label htmlFor="nomeFantasia" className="text-xs sm:text-sm">Nome Fantasia</Label>
                <Input
                  id="nomeFantasia"
                  value={formData.nomeFantasia}
                  onChange={(e) =>
                    setFormData({ ...formData, nomeFantasia: e.target.value })
                  }
                  className="text-sm"
                />
              </div>

              {/* Seleção de Alvarás */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Tipos de Alvará</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALVARA_TYPES.map((tipo) => (
                    <label key={tipo} className="flex items-center gap-2 cursor-pointer text-sm">
                      <Checkbox
                        checked={formData.alvaras.includes(tipo)}
                        onCheckedChange={(checked) => {
                          setFormData((prev) => ({
                            ...prev,
                            alvaras: checked
                              ? [...prev.alvaras, tipo]
                              : prev.alvaras.filter((t) => t !== tipo),
                          }));
                        }}
                        id={`alvara-${tipo}`}
                      />
                      <span>{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>


              {/* UF e Município */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uf" className="text-xs sm:text-sm">UF</Label>
                  <Select
                    value={formData.uf}
                    onValueChange={(value) => {
                      setFormData({ ...formData, uf: value });
                    }}
                  >
                    <SelectTrigger className="text-sm">
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
                  <Label htmlFor="municipio" className="text-xs sm:text-sm">Município</Label>
                  <Input
                    id="municipio"
                    value={formData.municipio}
                    disabled
                    placeholder="Preenchido automaticamente pelo CNPJ"
                    className="text-sm"
                  />
                </div>
              </div>







              {/* Botões */}
              <DialogFooter className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          {/* Aba Atividades Secundárias */}
          <TabsContent value="atividades" className="space-y-4">
            {/* Atividade Principal */}
            <div className="space-y-4">
              <div className="border-l-4 border-o2-blue bg-o2-blue-light p-3 sm:p-4 rounded">
                <h3 className="font-semibold text-o2-blue mb-2 sm:mb-3 text-sm sm:text-base">📌 Atividade Principal (CNAE)</h3>
                {formData.atividadePrincipalCodigo ? (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                      <div className="sm:min-w-[120px]">
                        <p className="text-xs sm:text-sm text-gray-600">Código</p>
                        <p className="font-semibold text-o2-blue text-sm">{formData.atividadePrincipalCodigo}</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-600">Descrição</p>
                        <p className="font-semibold text-o2-blue text-sm">{formData.atividadePrincipalDescricao}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-gray-600 italic">Nenhuma atividade principal selecionada</p>
                )}
              </div>
            </div>

            {/* Atividades Secundárias */}
            <div className="space-y-4">
              <div className="border-l-4 border-o2-purple bg-o2-purple-light p-3 sm:p-4 rounded">
                <h3 className="font-semibold text-o2-purple-dark mb-2 sm:mb-3 text-sm sm:text-base">
                  📋 Atividades Secundárias 
                  {atividadesSecundariasAPI.length > 0 && ` (${atividadesSecundariasAPI.length})`}
                  {editingCliente && atividades.length > 0 && ` (${atividades.length})`}
                </h3>

                {/* Se está criando novo cliente - mostra as encontradas */}
                {!editingCliente && atividadesSecundariasAPI.length > 0 && (
                  <div className="space-y-2">
                    {atividadesSecundariasAPI.map((atividade, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-2 bg-white rounded border border-o2-purple/20">
                        <div className="text-lg">✓</div>
                        <div className="flex-1">
                          <p className="font-medium text-o2-purple-dark">{atividade.code}</p>
                          <p className="text-sm text-gray-700">{atividade.text}</p>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-o2-purple-dark mt-3 italic">
                      💾 Estas atividades serão salvas automaticamente quando você criar o cliente
                    </p>
                  </div>
                )}

                {/* Se está editando - mostra as já cadastradas */}
                {editingCliente && (
                  <>
                    {atividadesLoading ? (
                      <p className="text-sm text-gray-500">Carregando atividades...</p>
                    ) : atividades.length > 0 ? (
                      <div className="space-y-2">
                        {atividades.map((atividade) => (
                          <div
                            key={atividade.id}
                            className="flex items-start justify-between p-2 bg-white rounded border border-o2-purple/20"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-o2-purple-dark">{atividade.codigo}</p>
                              <p className="text-sm text-gray-700">{atividade.descricao}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAtividade(atividade.id)}
                              className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 italic">Nenhuma atividade secundária cadastrada</p>
                    )}
                  </>
                )}

                {/* Se é novo cliente sem atividades - mostra mensagem */}
                {!editingCliente && atividadesSecundariasAPI.length === 0 && (
                  <p className="text-sm text-gray-600 italic">
                    Nenhuma atividade secundária foi encontrada para este CNPJ
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Aba Documentos */}

          <TabsContent value="documentos" className="space-y-4">
            <div className="space-y-4">

              {/* Linha com select e nome do documento */}
              <div className="rounded-xl border bg-muted/50 p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">Adicionar Documento</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    onValueChange={(value) => {
                      setPresetDocumento(value);
                      if (value === 'Outro') {
                        setNomeDocumento('');
                      } else {
                        setNomeDocumento(value);
                      }
                    }}
                    value={presetDocumento}
                  >
                    <SelectTrigger id="presetDoc" className="sm:w-56 w-full">
                      <SelectValue placeholder="Tipo de documento..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Auto Declaração Sanitaria">Auto Declaração Sanitaria</SelectItem>
                      <SelectItem value="Procuração Bombeiros">Procuração Bombeiros</SelectItem>
                      <SelectItem value="Laudo Acustico">Laudo Acustico</SelectItem>
                      <SelectItem value="Licença Ambiental">Licença Ambiental</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="nomeDoc"
                    value={nomeDocumento}
                    onChange={(e) => setNomeDocumento(e.target.value)}
                    placeholder="Nome do documento"
                    className="flex-1 min-w-0"
                    disabled={presetDocumento !== 'Outro' && presetDocumento !== ''}
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2">
                  <input
                    id="arquivo"
                    type="file"
                    className="hidden"
                    onChange={(e) => setArquivoSelecionado(e.target.files?.[0] || null)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('arquivo')?.click()}
                      disabled={documentosLoading}
                      className="flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Anexar
                    </Button>
                    <Button
                      onClick={handleAddDocumento}
                      disabled={documentosLoading || !arquivoSelecionado || !nomeDocumento}
                      className="flex items-center gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Salvar
                    </Button>
                  </div>
                  {arquivoSelecionado && (
                    <span className="text-xs text-gray-600 truncate max-w-[200px] sm:max-w-[120px]">{arquivoSelecionado.name}</span>
                  )}
                </div>
              </div>

            </div>

            {/* Lista de Documentos */}
            <div className="space-y-2">
              <div className="flex items-center mb-2">
                <Paperclip className="w-4 h-4 text-primary mr-2" />
                <h3 className="font-semibold text-primary">Documentos da Empresa</h3>
                {documentos.length > 0 && (
                  <span className="ml-2 bg-muted text-primary text-xs rounded-full px-2 py-0.5">{documentos.length}</span>
                )}
              </div>
              {documentosLoading ? (
                <p className="text-sm text-gray-500">Carregando...</p>
              ) : documentos.length > 0 ? (
                <ul className="space-y-2">
                  {documentos.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border bg-muted/50 px-3 sm:px-4 py-2 sm:py-3 gap-2"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <Paperclip className="w-4 h-4 sm:w-6 sm:h-6 text-primary/80 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium truncate text-sm sm:text-base text-primary">{doc.nomeDocumento}</div>
                          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 flex-wrap">
                            {/* Se for alvará antigo, extrai e mostra a data de vencimento */}
                            {doc.tipoDocumento?.includes('Alvará Antigo') ? (
                              <>
                                <span className="bg-orange-100 text-orange-700 text-[10px] sm:text-xs rounded px-1.5 sm:px-2 py-0.5 font-medium">
                                  Alvará Antigo
                                </span>
                                {doc.dataUpload && (
                                  <span className="text-[10px] sm:text-xs text-gray-400">
                                    Registrado em {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                                {(() => {
                                  // Extrai a data de vencimento do nomeArquivo
                                  // Formato esperado: "Alvará Antigo - Vencimento: 31/03/2026"
                                  if (doc.nomeArquivo) {
                                    const vencimentoMatch = doc.nomeArquivo.match(/Vencimento:\s*([^-\n]+)/i);
                                    if (vencimentoMatch && vencimentoMatch[1]) {
                                      const vencimentoStr = vencimentoMatch[1].trim();
                                      if (vencimentoStr && vencimentoStr.toLowerCase() !== 'sem data de vencimento') {
                                        return (
                                          <span className="text-[10px] sm:text-xs text-gray-600 font-medium">
                                            Vencimento {vencimentoStr}
                                          </span>
                                        );
                                      }
                                    }
                                    
                                    // Fallback: verifica se contém "Sem data de vencimento"
                                    if (doc.nomeArquivo.toLowerCase().includes('sem data de vencimento')) {
                                      return (
                                        <span className="text-[10px] sm:text-xs text-gray-500 italic">
                                          Sem data de vencimento
                                        </span>
                                      );
                                    }
                                  }
                                  return null;
                                })()}
                              </>
                            ) : (
                              <>
                                <span className="bg-primary/10 text-primary text-[10px] sm:text-xs rounded px-1.5 sm:px-2 py-0.5 font-medium truncate max-w-[120px] sm:max-w-none">{doc.tipoDocumento || doc.tipo || doc.nomeArquivo || 'Documento'}</span>
                                {doc.dataUpload && (
                                  <span className="text-[10px] sm:text-xs text-gray-400">{new Date(doc.dataUpload).toLocaleDateString('pt-BR')}</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 sm:gap-2 items-center flex-shrink-0">
                        {/* Botão de visualização */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(doc.id)}
                          title="Visualizar"
                          disabled={isDownloading}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {/* Botão de download */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadDocumento(doc.id)}
                          title="Baixar"
                          disabled={isDownloading}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog open={confirmDeleteId === doc.id} onOpenChange={(open) => setConfirmDeleteId(open ? doc.id : null)}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmDeleteId(doc.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este documento? Esta ação não poderá ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setConfirmDeleteId(null)}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteDocumento(doc.id)} autoFocus>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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

        {/* Modal de pré-visualização */}
        <DocumentPreviewModal
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          documentUrl={previewUrl}
          documentName={previewName}
        />
      </DialogContent>
    </Dialog>
  );
}
