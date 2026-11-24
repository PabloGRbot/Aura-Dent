export const VERSION_POLITICA = '2026-10-23';
export const ZONA_CITAS = 'America/Lima';
export const TEXTO_POLITICA = 'Reservas sin pagar: vencen a los 15 minutos y se conservan en el historial. Puedes modificar una cita pagada durante el día del pago, hasta las 23:59 de Lima y antes de que comience, manteniendo el servicio y sujeto a disponibilidad. Puedes solicitar devolución del adelanto si cancelas durante ese mismo día antes del inicio, o con al menos 48 horas exactas de anticipación. Si reservas hoy para mañana, solo tienes el beneficio del día del pago. Cambiar la cita no renueva los plazos. Fuera de esos plazos o por inasistencia se pierde el adelanto. Las devoluciones se recogen en el consultorio. Si la clínica cancela, se permite devolver el adelanto. Los pagos de esta demo son simulados.';

export function finDiaLima(fecha: Date): Date {
  const dia = new Date(fecha.getTime() - 5 * 3600000).toISOString().slice(0, 10);
  return new Date(new Date(`${dia}T00:00:00-05:00`).getTime() + 86400000);
}

export interface DatosPolitica {
  estado: string; fecha: Date; fechaOriginal?: Date | null;
  primerPagoEn?: Date | null; expiraEn?: Date | null;
}

export function accionesCita(c: DatosPolitica, ahora = new Date()) {
  const pendiente = ['TEMPORAL', 'PENDIENTE_PAGO'].includes(c.estado);
  const vencida = pendiente && !!c.expiraEn && c.expiraEn <= ahora;
  const antesInicio = ahora < c.fecha;
  const activa = !vencida && (pendiente || c.estado === 'CONFIRMADA');
  const finGracia = c.primerPagoEn ? finDiaLima(c.primerPagoEn) : null;
  const limite48 = new Date(Math.min(c.fecha.getTime(), c.fechaOriginal?.getTime() ?? c.fecha.getTime()) - 48 * 3600000);
  const gracia = !!finGracia && ahora < finGracia;
  const elegible = c.estado === 'CONFIRMADA' && antesInicio && (gracia || ahora <= limite48);
  return {
    puedePagar: pendiente && !vencida && antesInicio,
    puedeCancelar: activa && antesInicio,
    puedeReprogramar: c.estado === 'CONFIRMADA' && antesInicio && gracia,
    puedeSolicitarDevolucion: elegible,
    limiteEdicion: finGracia ? new Date(Math.min(finGracia.getTime(), c.fecha.getTime())) : null,
    limiteEdicionSiPagaAhora: pendiente && !vencida ? new Date(Math.min(finDiaLima(ahora).getTime(),c.fecha.getTime())):null,
    limiteDevolucion48: limite48,
    finGracia,
    motivoEdicion: !c.primerPagoEn ? 'No hay fecha de pago comprobable.' : !antesInicio ? 'La cita ya comenzó.' : !gracia ? 'Terminó el día del pago en Lima.' : null,
    motivoDevolucion: elegible ? 'Puedes solicitar la devolución del adelanto al cancelar.' : 'Fuera del día del pago y del plazo de 48 horas; se pierde el adelanto.',
    soloGracia: limite48 < ahora,
    estadoEfectivo: vencida ? 'VENCIDA' : c.estado
  };
}
