import { useState } from "react";
import { Plus, Trash2, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { validatePassword } from "@/lib/password-validator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", fullName: "" });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { authToken } = useAuth();

  // Carregar usuários
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${apiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao carregar usuários",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Adicionar novo usuário
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUser.email || !newUser.password) {
      toast({
        title: "Erro",
        description: "E-mail e senha são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (!newUser.email.includes("@")) {
      toast({
        title: "Erro",
        description: "E-mail inválido",
        variant: "destructive",
      });
      return;
    }

    const passwordValidation = validatePassword(newUser.password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Senha Fraca",
        description: passwordValidation.errors.join(". "),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          fullName: newUser.fullName || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao adicionar usuário");
      }

      toast({
        title: "Sucesso",
        description: "Usuário adicionado com sucesso!",
      });

      setNewUser({ email: "", password: "", fullName: "" });
      setShowForm(false);
      loadUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar usuário",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Deletar usuário
  const handleDeleteUser = async (user: User) => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
      const response = await fetch(`${apiUrl}/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar usuário");
      }

      toast({
        title: "Sucesso",
        description: "Usuário deletado com sucesso!",
      });

      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao deletar usuário",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8 mt-14 sm:mt-16 lg:mt-0">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">Gerenciamento de Usuários</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Adicione, visualize e gerencie usuários do sistema</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Usuário
          </Button>
          <Button
            onClick={loadUsers}
            variant="outline"
            disabled={isLoading}
            className="w-full sm:w-auto text-sm"
          >
            {isLoading ? "Carregando..." : "Atualizar"}
          </Button>
        </div>

        {/* Add User Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Novo Usuário</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="usuario@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="pl-10 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Nome Completo (opcional)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Nome do usuário"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      className="pl-10 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Senha</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="text-sm"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres, maiúscula, minúscula, número e caractere especial
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={isLoading} className="w-full sm:w-auto text-sm">
                  {isLoading ? "Adicionando..." : "Adicionar Usuário"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={isLoading}
                  className="w-full sm:w-auto text-sm"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Users List - Mobile Cards */}
        <div className="space-y-3 md:hidden">
          {users.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            users.map((user) => (
              <div key={user.id} className="bg-card border border-border rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.full_name || "Sem nome"}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {user.is_active ? (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                        Inativo
                      </span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setUserToDelete(user)}
                      disabled={isLoading}
                      className="h-7 w-7 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Criado em: {new Date(user.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Users List - Desktop Table */}
        <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs sm:text-sm font-semibold text-foreground">E-mail</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs sm:text-sm font-semibold text-foreground">Nome</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs sm:text-sm font-semibold text-foreground">Status</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs sm:text-sm font-semibold text-foreground hidden lg:table-cell">Data de Criação</th>
                  <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs sm:text-sm font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 lg:px-6 py-8 text-center text-sm text-muted-foreground">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs sm:text-sm text-foreground">
                        <span className="truncate block max-w-[200px]">{user.email}</span>
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs sm:text-sm text-foreground">{user.full_name || "-"}</td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm">
                        {user.is_active ? (
                          <span className="px-2.5 py-0.5 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                            Ativo
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-red-500/20 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs sm:text-sm text-muted-foreground hidden lg:table-cell">
                        {new Date(user.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setUserToDelete(user)}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o usuário {userToDelete?.email}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogContent>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
