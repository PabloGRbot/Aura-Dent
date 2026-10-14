export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export class Pago {
  constructor(
    public readonly id: string,
    public readonly citaId: string,
    public readonly monto: number,
    public estado: EstadoPago,
    public readonly moneda: string = 'PEN',
    public referenciaQr: string | null = null
  ) {}

  aprobar(referenciaQr: string): void {
    this.estado = 'APROBADO';
    this.referenciaQr = referenciaQr;
  }

  rechazar(): void {
    this.estado = 'RECHAZADO';
  }
}
