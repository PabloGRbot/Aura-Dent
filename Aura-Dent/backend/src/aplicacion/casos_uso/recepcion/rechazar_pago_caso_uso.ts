import { Pago } from '../../../dominio/modelos/pago';
import { RechazarPagoPuerto } from '../../../dominio/puertos/entrada/gestion_recepcion_puerto';
import { PagoRepositorioPuerto } from '../../../dominio/puertos/salida/pago_repositorio_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class RechazarPagoCasoUso implements RechazarPagoPuerto {
  constructor(private readonly pagoRepositorio: PagoRepositorioPuerto) {}

  async rechazar(pagoId: string): Promise<Pago> {
    const pago = await this.pagoRepositorio.buscarPorId(pagoId);
    if (!pago) {
      throw new ErrorAplicacion('Pago no encontrado', 'PAGO_NO_ENCONTRADO');
    }

    pago.rechazar();
    await this.pagoRepositorio.actualizar(pago);
    return pago;
  }
}
