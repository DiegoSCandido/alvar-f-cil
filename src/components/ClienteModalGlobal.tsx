import { useClienteModal } from '@/contexts/ClienteModalContext';
import { useClientes } from '@/hooks/useClientes';
import { ClienteForm } from './ClienteForm';
import { ClienteFormData } from '@/types/cliente';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function ClienteModalGlobal() {
  const { isAuthenticated } = useAuth();
  const { isOpen, editingCliente, closeModal } = useClienteModal();
  const { updateCliente, refetch } = useClientes();
  const { toast } = useToast();

  // Não renderiza se não estiver autenticado para evitar chamadas à API
  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (data: ClienteFormData) => {
    if (!editingCliente) return;

    try {
      await updateCliente(editingCliente.id, data);
      toast({
        title: 'Cliente atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });
      closeModal();
      // Atualiza a lista de clientes para refletir as mudanças
      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar cliente',
        variant: 'destructive',
      });
    }
  };

  return (
    <ClienteForm
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeModal();
        }
      }}
      onSubmit={handleSubmit}
      editingCliente={editingCliente}
    />
  );
}
