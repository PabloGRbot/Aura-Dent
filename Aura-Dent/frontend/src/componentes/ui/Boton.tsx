import type { ReactNode, ButtonHTMLAttributes } from 'react';

type Variante = 'primary' | 'secondary' | 'ghost' | 'danger';
type Tamano   = 'md' | 'sm' | 'lg';

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?:   Tamano;
  icono?:    ReactNode;
  iconoDer?: ReactNode;
  cargando?: boolean;
  children:  ReactNode;
}

const claseVariante: Record<Variante, string> = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn-danger',
};

const claseTamano: Record<Tamano, string> = {
  sm: 'text-body-sm px-4 py-2',
  md: '',
  lg: 'text-subheading px-8 py-4',
};

export function Boton({
  variante  = 'primary',
  tamano    = 'md',
  icono,
  iconoDer,
  cargando  = false,
  children,
  className = '',
  disabled,
  ...props
}: BotonProps) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      className={`
        ${claseVariante[variante]}
        ${claseTamano[tamano]}
        ${cargando || disabled ? 'opacity-60 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {cargando ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icono
      )}
      {children}
      {!cargando && iconoDer}
    </button>
  );
}
