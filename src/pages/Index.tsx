import Logo from "@/components/Logo";
import LoginForm from "@/components/LoginForm";

const Index = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-background">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Blue gradient top-right */}
        <div className="absolute -top-20 -right-20 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-gradient-to-bl from-primary/10 to-transparent blur-3xl" />
        {/* Purple gradient bottom-left */}
        <div className="absolute -bottom-20 -left-20 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-secondary/10 to-transparent blur-3xl" />
      </div>

      {/* Login Container */}
      <div className="w-full max-w-sm px-4 relative z-10 mx-auto login-override">
        {/* Login Card */}
        <div className="login-card">
          {/* Logo Section */}
          <div className="mb-6 sm:mb-8 text-center">
            <Logo />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              Bem-vindo
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Faça login para acessar sua conta
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />
        </div>

        {/* Copyright */}
        <p className="text-center text-xs text-muted-foreground mt-6 px-4">
          © 2024 O2con Soluções Contábeis. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default Index;
