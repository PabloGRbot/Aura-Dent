import { Evento, fechaLima } from '../api/gestion_citas';

const ETIQUETAS: Record<string, string> = {
  CREACION: 'Cita creada',
  PAGO: 'Pago confirmado',
  MODIFICACION: 'Cita modificada',
  CANCELACION: 'Cita cancelada',
  VENCIMIENTO: 'Reserva vencida',
  INASISTENCIA: 'Inasistencia registrada',
  ATENCION: 'Cita atendida',
  DEVOLUCION_SOLICITADA: 'Devolución solicitada',
  DEVOLUCION_ENTREGADA: 'Devolución entregada'
};

export function ListaMovimientos({ eventos }: { eventos: Evento[] }) {
  return <ol className="aura-movimientos">
    {eventos.map(evento => <li key={evento.id} className="aura-movimiento">
      <strong>{ETIQUETAS[evento.tipo] ?? 'Movimiento de la cita'}</strong>
      <time dateTime={evento.ocurrido_en}>{fechaLima(evento.ocurrido_en)}</time>
    </li>)}
  </ol>;
}
