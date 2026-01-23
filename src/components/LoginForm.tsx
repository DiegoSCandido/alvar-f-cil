import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {User, Lock, Eye, EyeOff} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { validatePassword } from "@/lib/password-validator";

const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (!email || !password) {
                toast({
                    title: "Erro",
                    description: "Por favor, preencha todos os campos.",
                    variant: "destructive",
                });
                return;
            }

            if (!email.includes('@')) {
                toast({
                    title: "Erro",
                    description: "E-mail inválido",
                    variant: "destructive",
                });
                return;
            }

            // Validar força de senha
            const passwordValidation = validatePassword(password);
            if (!passwordValidation.isValid) {
                toast({
                    title: "Senha Fraca",
                    description: passwordValidation.errors.join(". "),
                    variant: "destructive",
                });
                return;
            }

            setIsLoading(true);

            await login(email, password);
            toast({
                title: "Sucesso",
                description: "Login realizado com sucesso!",
            });
            navigate("/dashboard");
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            toast({
                title: "Erro",
                description: error instanceof Error ? error.message : "Erro ao fazer login",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }; 

    return (
<form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      {/* Email Input */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          E-mail
        </label>
        <div className="relative">
          <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 sm:pl-12 text-sm sm:text-base"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Senha
        </label>
        <div className="relative">
          <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 sm:pl-12 pr-12 text-sm sm:text-base"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <label
            htmlFor="remember"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Lembrar-me
          </label>
        </div>
        <a
          href="#"
          className="text-sm text-secondary hover:text-secondary/80 transition-colors font-medium"
        >
          Esqueci minha senha
        </a>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="btn-primary w-full text-primary-foreground text-sm sm:text-base"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Entrando...
          </span>
        ) : (
          "Entrar"
        )}
      </Button>
    </form>
  );
};

export default LoginForm;