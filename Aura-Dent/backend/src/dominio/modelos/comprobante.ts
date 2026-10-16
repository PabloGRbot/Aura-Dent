export type TipoComprobante = 'BOLETA' | 'FACTURA';
export type EstadoComprobante = 'EMITIDO' | 'ANULADO';

export class Comprobante {
  constructor(
    public readonly id: string,
    public readonly pagoId: string,
    public readonly citaId: string,
    public readonly tipo: TipoComprobante,
    public readonly serie: string,
    public readonly correlativo: number,
    public readonly rucCliente: string | null,
    public readonly razonSocial: string | null,
    public readonly subtotal: number,
    public readonly igv: number,
    public readonly total: number,
    public readonly moneda: string,
    public estado: EstadoComprobante,
    public readonly emitidoEn: Date,
    public anuladoEn: Date | null = null
  ) {}

  anular(): void {
    if (this.estado === 'ANULADO') {
      throw new Error('El comprobante ya está anulado');
    }
    this.estado = 'ANULADO';
    this.anuladoEn = new Date();
  }
}
