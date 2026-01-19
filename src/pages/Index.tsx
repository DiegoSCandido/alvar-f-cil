import Logo from "@/components/Logo";
import LoginForm from "@/components/LoginForm";

const Index = () => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Blue gradient top-right */}
        <div className="absolute -top-20 -right-20 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-gradient-to-bl from-primary/10 to-transparent blur-3xl" />
        {/* Purple gradient bottom-left */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-secondary/10 to-transparent blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[90%] sm:max-w-md animate-fade-in relative z-10">
        <div className="login-card">
          {/* Logo Section */}
          <div className="mb-6 sm:mb-8">
            <Logo />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              Bem-vindo
            </h2>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Faça login para acessar sua conta
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Footer */}
          <div className="mt-6 sm:mt-8 text-center">
            
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-muted-foreground mt-4 sm:mt-6 px-4">
          © 2024 O2con Soluções Contábeis. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Index;
