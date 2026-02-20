import { useClienteModal } from '@/contexts/ClienteModalContext';
import { useClientes } from '@/hooks/useClientes';
import { ClienteForm } from './ClienteForm';
import { ClienteFormData } from '@/types/cliente';
import { useToast } from '@/hooks/use-toast';

export function ClienteModalGlobal() {
  const { isOpen, editingCliente, closeModal } = useClienteModal();
  const { updateCliente, refetch } = useClientes();
  const { toast } = useToast();

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
