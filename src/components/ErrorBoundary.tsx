import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-8 w-8 text-destructive flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h1 className="text-lg font-semibold text-destructive mb-2">
                    Algo deu errado
                  </h1>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ocorreu um erro inesperado na aplicação. Por favor, tente recarregar a página ou contacte o suporte.
                  </p>
                  
                  {this.state.error && (
                    <details className="mb-4 cursor-pointer">
                      <summary className="text-xs font-mono text-muted-foreground hover:text-foreground">
                        Detalhes do erro
                      </summary>
                      <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-auto max-h-40">
                        {this.state.error.toString()}
                        {'\n\n'}
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </details>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={this.handleReset}
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar novamente
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = '/'}
                      className="flex-1"
                    >
                      Ir para Home
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
