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
import o2conLogo from '@/assets/o2contole-logo.png';

const ClientesPage = () => {
  const { clientes, addCliente, updateCliente, deleteCliente } = useClientes();
  const { alvaras } = useAlvaras();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClientes = useMemo(() => {
    return clientes.filter((cliente) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        cliente.razaoSocial.toLowerCase().includes(searchLower) ||
        cliente.nomeFantasia.toLowerCase().includes(searchLower) ||
        cliente.cnpj.includes(searchTerm) ||
        cliente.email.toLowerCase().includes(searchLower) ||
        cliente.municipio.toLowerCase().includes(searchLower)
      );
    });
  }, [clientes, searchTerm]);

  const handleAddCliente = (data: ClienteFormData) => {
    if (editingCliente) {
      updateCliente(editingCliente.id, data);
      toast({
        title: 'Cliente atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
    } else {
      addCliente(data);
      toast({
        title: 'Cliente cadastrado',
        description: 'O novo cliente foi adicionado ao sistema.',
      });
    }
    setIsFormOpen(false);
    setEditingCliente(null);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCliente(id);
    toast({
      title: 'Cliente removido',
      description: 'O cliente foi excluído do sistema.',
      variant: 'destructive',
    });
  };

  const handleOpenForm = () => {
    setEditingCliente(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={o2conLogo}
                alt="O2con Soluções Contábeis"
                className="h-10 object-contain"
              />
              <div className="h-8 w-px bg-border" />
              <div>
                <h1 className="text-lg font-bold text-foreground">Cadastro de Clientes</h1>
                <p className="text-xs text-muted-foreground">
                  Gerencie os clientes cadastrados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleOpenForm} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6 pl-72">
        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="bg-card rounded-lg border p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total de Clientes</p>
              <p className="text-2xl font-bold">{clientes.length}</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por razão social, nome fantasia, CNPJ, e-mail ou município..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
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
    </div>
  );
};

export default ClientesPage;
