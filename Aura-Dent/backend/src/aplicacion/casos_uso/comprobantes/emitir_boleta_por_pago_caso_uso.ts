import {
  EmitirBoletaPorPagoPuerto,
  EmitirComprobantePuerto
} from '../../../dominio/puertos/entrada/comprobante_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

const SERIE_BOLETA = 'B001';

export class EmitirBoletaPorPagoCasoUso implements EmitirBoletaPorPagoPuerto {
  constructor(private readonly emitirComprobante: EmitirComprobantePuerto) {}

  async emitirBoleta(pagoId: string, citaId: string): Promise<void> {
    try {
      await this.emitirComprobante.emitir({
        pagoId,
        citaId,
        tipo: 'BOLETA',
        serie: SERIE_BOLETA
      });
    } catch (error) {
      if (error instanceof ErrorAplicacion && error.codigo === 'COMPROBANTE_YA_EXISTE') {
        return;
      }
      console.error('[comprobantes] No se pudo emitir la boleta automática:', error);
    }
  }
}
