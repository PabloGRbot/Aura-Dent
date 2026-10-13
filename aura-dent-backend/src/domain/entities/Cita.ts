export type EstadoCita =
  | "pendiente_pago"
  | "retenido"
  | "confirmada"
  | "cancelada"
  | "expirada"
  | "atendida";

export class Cita {
  constructor(
    public id: string,
    public pacienteId: string,
    public odontologoId: string,
    public servicioId: number,
    public fecha: Date,
    public horaInicio: string,
    public horaFin: string,
    public estadoId: number,
    public codigoReserva: string,
    public fechaExpiracion: Date | null,
  ) {}
}
