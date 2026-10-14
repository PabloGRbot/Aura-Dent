export type EstadoCita =
  | 'TEMPORAL'
  | 'PENDIENTE_PAGO'
  | 'CONFIRMADA'
  | 'CANCELADA'
  | 'ATENDIDA';

export class CitaMedica {
  constructor(
    public readonly id: string,
    public readonly pacienteId: string,
    public odontologoId: string | null,
    public readonly fecha: Date,
    public readonly duracionMinutos: number,
    public estado: EstadoCita,
    public pagoId: string | null = null,
    public readonly servicio: string | null = null
  ) {}

  confirmar(pagoId: string): void {
    if (this.estado !== 'TEMPORAL' && this.estado !== 'PENDIENTE_PAGO') {
      throw new Error('Solo se pueden confirmar citas pendientes de pago');
    }
    this.estado = 'CONFIRMADA';
    this.pagoId = pagoId;
  }

  cancelar(): void {
    if (this.estado === 'ATENDIDA') {
      throw new Error('No se puede cancelar una cita atendida');
    }
    this.estado = 'CANCELADA';
  }

  finalizaEn(): Date {
    return new Date(this.fecha.getTime() + this.duracionMinutos * 60000);
  }
}
