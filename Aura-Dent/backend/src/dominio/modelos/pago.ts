export type EstadoPago = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'QR';
export type TipoPago = 'ADELANTO' | 'SALDO' | 'UNICO';

export class Pago {
  constructor(
    public readonly id: string,
    public readonly citaId: string,
    public readonly monto: number,
    public estado: EstadoPago,
    public readonly moneda: string = 'PEN',
    public readonly metodo: MetodoPago = 'QR',
    public readonly tipo: TipoPago = 'UNICO',
    public referenciaQr: string | null = null,
    public pagadoEn: Date | null = null
  ) {}

  aprobar(referenciaQr: string): void {
    this.estado = 'APROBADO';
    this.referenciaQr = referenciaQr;
    this.pagadoEn = new Date();
  }

  rechazar(): void {
    this.estado = 'RECHAZADO';
  }
}
