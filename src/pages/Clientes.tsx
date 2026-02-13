import { useState, useMemo } from 'react';
import { useClientes } from '@/hooks/useClientes';
import { useAlvaras } from '@/hooks/useAlvaras';
import { ClienteTable } from '@/components/ClienteTable';
import { ClienteForm } from '@/components/ClienteForm';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import o2conLogo from '@/assets/logo-o2con.png';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const ClientesPage = () => {
  const { clientes, addCliente, updateCliente, deleteCliente } = useClientes();
  const { alvaras } = useAlvaras();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);

  const filteredClientes = useMemo(() => {
    return clientes.filter((cliente) => {
      // Validar que cliente existe e tem propriedades essenciais
      if (!cliente || !cliente.razaoSocial) {
        return false;
      }

      const searchLower = searchTerm.toLowerCase();
      const razaoSocialMatch = cliente.razaoSocial ? cliente.razaoSocial.toLowerCase().includes(searchLower) : false;
      // Removido nomeFantasiaMatch
      const cnpjMatch = cliente.cnpj ? cliente.cnpj.includes(searchTerm) : false;
      const municipioMatch = cliente.municipio ? cliente.municipio.toLowerCase().includes(searchLower) : false;

      return razaoSocialMatch || cnpjMatch || municipioMatch;
    });
  }, [clientes, searchTerm]);

  const handleAddCliente = async (data: ClienteFormData) => {
    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, data);
        toast({
          title: 'Cliente atualizado',
          description: 'As alterações foram salvas com sucesso.',
        });
      } else {
        await addCliente(data);
        toast({
          title: 'Cliente cadastrado',
          description: 'O novo cliente foi adicionado ao sistema.',
        });
      }
      setIsFormOpen(false);
      setEditingCliente(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar cliente',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    const cliente = clientes.find((c) => c.id === id);
    if (cliente) setClienteParaExcluir(cliente);
  };

  const handleConfirmDelete = async () => {
    if (!clienteParaExcluir) return;
    try {
      await deleteCliente(clienteParaExcluir.id);
      toast({
        title: 'Cliente removido',
        description: 'O cliente foi excluído do sistema.',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao deletar cliente',
        variant: 'destructive',
      });
    } finally {
      setClienteParaExcluir(null);
    }
  };

  const handleOpenForm = () => {
    setEditingCliente(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 xl:top-0 z-10 xl:mt-0 mt-14 sm:mt-16">
        <div className="container px-1 sm:px-1 lg:px-1 xl:px-8 py-3 sm:py-4 lg:py-4 xl:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 lg:gap-4 xl:gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 lg:gap-3 xl:gap-4 flex-1 min-w-0">
              <img
                src={o2conLogo}
                alt="O2con Soluções Contábeis"
                className="h-7 sm:h-8 lg:h-8 xl:h-10 object-contain flex-shrink-0"
              />
              <div className="hidden sm:block h-6 sm:h-8 w-px bg-border flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-base lg:text-base xl:text-xl font-bold text-foreground truncate">Cadastro de Clientes</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  Gerencie os clientes cadastrados
                </p>
              </div>
            </div>
            <Button onClick={handleOpenForm} className="gap-2 w-full sm:w-auto text-xs sm:text-sm lg:text-base px-3 sm:px-4">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">Novo Cliente</span>
              <span className="md:hidden">Novo</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-1 sm:px-1 lg:px-1 xl:px-8 py-4 sm:py-5 lg:py-4 xl:py-8 space-y-4 sm:space-y-5 lg:space-y-4 xl:space-y-6 w-full">
        {/* Stats */}
        <div className="flex overflow-x-auto gap-3 sm:gap-4 lg:gap-5 pb-2">
          <div className="bg-card rounded-lg border p-3 sm:p-4 lg:p-5 flex items-center gap-3 flex-shrink-0 min-w-[200px] sm:min-w-0 sm:flex-1">
            <Users className="h-5 w-5 lg:h-6 lg:w-6 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">Total de Clientes</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{clientes.length}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <p>
            {filteredClientes.length} de {clientes.length} clientes
          </p>
        </div>

        {/* Table */}
        <ClienteTable
          clientes={filteredClientes}
          alvaras={alvaras}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </main>

      {/* Form Dialog */}
      <ClienteForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddCliente}
        editingCliente={editingCliente}
      />
      {/* Dialog de Confirmação de Exclusão de Cliente */}
      <Dialog open={!!clienteParaExcluir} onOpenChange={(open) => { if (!open) setClienteParaExcluir(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Tem certeza que deseja excluir o cliente <b>{clienteParaExcluir?.razaoSocial}</b>?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClienteParaExcluir(null)}>Não</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Sim</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientesPage;
