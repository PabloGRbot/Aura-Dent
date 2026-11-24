import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalBaseProps {
  abierto:    boolean;
  onCerrar:   () => void;
  titulo?:    string;
  children:   ReactNode;
  ancho?:     string;
}

export function ModalBase({ abierto, onCerrar, titulo, children, ancho = 'max-w-lg' }: ModalBaseProps) {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-deep-ink/40 backdrop-blur-sm animate-fade-in"
        onClick={onCerrar}
      />
      {/* Panel */}
      <div className={`relative w-full ${ancho} bg-canvas rounded-card p-6 shadow-widget animate-aparecer-arriba`}>
        {titulo && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-hedvig text-heading-sm font-bold text-deep-ink">{titulo}</h2>
            <button
              type="button"
              className="btn-icon hover:bg-soft-meadow text-slate-text"
              onClick={onCerrar}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
