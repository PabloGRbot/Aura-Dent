/**
 * Etiquetas y colores para los estados de cita (tabla estados_cita) y
 * para los estados de pago, compartidos por todas las vistas.
 */
export const ESTADOS_CITA: Record<number, { label: string; color: string }> = {
  1: { label: "Pendiente pago", color: "bg-yellow-100 text-yellow-800" },
  2: { label: "Retenido", color: "bg-orange-100 text-orange-800" },
  3: { label: "Confirmada", color: "bg-green-100 text-green-800" },
  4: { label: "Cancelada", color: "bg-red-100 text-red-800" },
  5: { label: "Expirada", color: "bg-slate-100 text-slate-700" },
  6: { label: "Atendida", color: "bg-blue-100 text-blue-800" },
};

export const ESTADOS_PAGO: Record<number, { label: string; color: string }> = {
  1: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  2: { label: "Completado", color: "bg-green-100 text-green-800" },
  3: { label: "Fallido", color: "bg-red-100 text-red-800" },
  4: { label: "Reembolsado", color: "bg-purple-100 text-purple-800" },
};

export const etiquetaEstadoCita = (id: number): string =>
  ESTADOS_CITA[id]?.label || `Estado ${id}`;

export const etiquetaEstadoPago = (id: number): string =>
  ESTADOS_PAGO[id]?.label || `Estado ${id}`;
