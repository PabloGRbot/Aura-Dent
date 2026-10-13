export type EstadoPago = "pendiente" | "completado" | "fallido" | "reembolsado";

export class Pago {
  constructor(
    public id: string,
    public citaId: string,
    public monto: number,
    public metodoPago: string | null,
    public codigoOperacion: string | null,
    public estadoId: number,
    public fechaPago: Date | null,
  ) {}
}
