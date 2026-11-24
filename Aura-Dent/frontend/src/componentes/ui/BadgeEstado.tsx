type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'NO_ASISTIO';

interface BadgeEstadoProps {
  estado: EstadoCita | string;
}

const config: Record<string, { label: string; clase: string }> = {
  PENDIENTE:   { label: 'Pendiente',    clase: 'badge badge-yellow' },
  CONFIRMADA:  { label: 'Confirmada',   clase: 'badge badge-teal'   },
  COMPLETADA:  { label: 'Completada',   clase: 'badge bg-green-100 text-green-800 font-inter font-medium text-caption uppercase tracking-wide rounded-pill px-3 py-1' },
  CANCELADA:   { label: 'Cancelada',    clase: 'badge badge-red'    },
  NO_ASISTIO:  { label: 'No asistió',   clase: 'badge bg-orange-100 text-orange-700 font-inter font-medium text-caption uppercase tracking-wide rounded-pill px-3 py-1' },
};

export function BadgeEstado({ estado }: BadgeEstadoProps) {
  const cfg = config[estado] ?? { label: estado, clase: 'badge badge-slate' };
  return <span className={cfg.clase}>{cfg.label}</span>;
}
