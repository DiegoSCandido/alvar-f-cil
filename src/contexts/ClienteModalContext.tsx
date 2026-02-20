import { createContext, useContext, useState, ReactNode } from 'react';
import { Cliente } from '@/types/cliente';

interface ClienteModalContextType {
  openModal: (cliente: Cliente) => void;
  closeModal: () => void;
  isOpen: boolean;
  editingCliente: Cliente | null;
}

const ClienteModalContext = createContext<ClienteModalContextType | undefined>(undefined);

export const ClienteModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const openModal = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingCliente(null);
  };

  return (
    <ClienteModalContext.Provider
      value={{
        openModal,
        closeModal,
        isOpen,
        editingCliente,
      }}
    >
      {children}
    </ClienteModalContext.Provider>
  );
};

export const useClienteModal = () => {
  const context = useContext(ClienteModalContext);
  if (context === undefined) {
    throw new Error('useClienteModal deve ser usado dentro de um ClienteModalProvider');
  }
  return context;
};
