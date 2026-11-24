import type { ReactNode } from 'react';

interface TarjetaProps {
  titulo?:    string;
  subtitulo?: string;
  icono?:     ReactNode;
  children?:  ReactNode;
  className?: string;
  onClick?:   () => void;
  variante?:  'meadow' | 'white' | 'yellow';
}

const claseVariante = {
  meadow: 'card',
  white:  'card-white',
  yellow: 'bg-hi-yellow rounded-card p-6',
};

export function Tarjeta({
  titulo,
  subtitulo,
  icono,
  children,
  className = '',
  onClick,
  variante = 'meadow',
}: TarjetaProps) {
  return (
    <div
      className={`
        ${claseVariante[variante]}
        ${onClick ? 'cursor-pointer card-hover' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {icono && (
        <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-canvas text-deep-ink">
          {icono}
        </div>
      )}
      {titulo && (
        <h3 className="font-hedvig text-heading-sm font-bold text-deep-ink mb-1">
          {titulo}
        </h3>
      )}
      {subtitulo && (
        <p className="font-inter text-body-sm text-slate-text mb-3">
          {subtitulo}
        </p>
      )}
      {children}
    </div>
  );
}
