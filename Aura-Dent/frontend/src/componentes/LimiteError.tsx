import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class LimiteError extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Error capturado por LimiteError:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <main className="login">
          <div className="tarjeta">
            <h1>Algo salió mal</h1>
            <p className="subtitulo">
              Ocurrió un error al mostrar esta pantalla. Copia el detalle para revisarlo.
            </p>
            <p className="error">{this.state.error.message}</p>
            <button type="button" onClick={() => window.location.assign('/')}>
              Volver al inicio
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
