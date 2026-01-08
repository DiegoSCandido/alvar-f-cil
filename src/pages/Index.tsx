import { useState, useMemo } from 'react';
import { useAlvaras } from '@/hooks/useAlvaras';
import { AlvaraTable } from '@/components/AlvaraTable';
import { AlvaraForm } from '@/components/AlvaraForm';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Alvara, AlvaraFormData, AlvaraStatus } from '@/types/alvara';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { alvaras, stats, addAlvara, updateAlvara, deleteAlvara } = useAlvaras();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAlvara, setEditingAlvara] = useState<Alvara | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AlvaraStatus | 'all'>('all');

  const filteredAlvaras = useMemo(() => {
    return alvaras.filter((alvara) => {
      const matchesSearch =
        alvara.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alvara.clientCnpj.includes(searchTerm) ||
        alvara.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || alvara.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [alvaras, searchTerm, statusFilter]);

  const handleAddAlvara = (data: AlvaraFormData) => {
    if (editingAlvara) {
      updateAlvara(editingAlvara.id, data);
      toast({
        title: 'Alvará atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
    } else {
      addAlvara(data);
      toast({
        title: 'Alvará cadastrado',
        description: 'O novo alvará foi adicionado ao sistema.',
      });
    }
    setIsFormOpen(false);
    setEditingAlvara(null);
  };

  const handleEdit = (alvara: Alvara) => {
    setEditingAlvara(alvara);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteAlvara(id);
    toast({
      title: 'Alvará removido',
      description: 'O alvará foi excluído do sistema.',
      variant: 'destructive',
    });
  };

  const handleOpenForm = () => {
    setEditingAlvara(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Gestão de Alvarás</h1>
                <p className="text-sm text-muted-foreground">
                  Controle de documentos e vencimentos
                </p>
              </div>
            </div>
            <Button onClick={handleOpenForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Alvará
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Pendentes"
            value={stats.pending}
            icon={Clock}
            variant="pending"
          />
          <StatCard
            title="Válidos"
            value={stats.valid}
            icon={CheckCircle}
            variant="valid"
          />
          <StatCard
            title="Vencendo"
            value={stats.expiring}
            icon={AlertTriangle}
            variant="expiring"
          />
          <StatCard
            title="Vencidos"
            value={stats.expired}
            icon={XCircle}
            variant="expired"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, CNPJ ou tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as AlvaraStatus | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="valid">Válidos</SelectItem>
              <SelectItem value="expiring">Vencendo</SelectItem>
              <SelectItem value="expired">Vencidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            {filteredAlvaras.length} de {alvaras.length} alvarás
          </p>
          {statusFilter !== 'all' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Limpar filtro
            </Button>
          )}
        </div>

        {/* Table */}
        <AlvaraTable
          alvaras={filteredAlvaras}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </main>

      {/* Form Dialog */}
      <AlvaraForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddAlvara}
        editingAlvara={editingAlvara}
      />
    </div>
  );
};

export default Index;
