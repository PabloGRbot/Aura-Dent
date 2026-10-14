import { Pago } from '../../../dominio/modelos/pago';
import { ValidarPagoQrPuerto } from '../../../dominio/puertos/entrada/pago_puerto';
import { PagoRepositorioPuerto } from '../../../dominio/puertos/salida/pago_repositorio_puerto';
import { PasarelaPagoPuerto } from '../../../dominio/puertos/salida/pasarela_pago_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';
import { GeneradorId } from '../../../compartido/generador_id';

export class ValidarPagoQrCasoUso implements ValidarPagoQrPuerto {
  constructor(
    private readonly pagoRepositorio: PagoRepositorioPuerto,
    private readonly pasarelaPago: PasarelaPagoPuerto,
    private readonly generadorId: GeneradorId
  ) {}

  async validarPagoQr(citaId: string, referenciaQr: string): Promise<Pago> {
    const respuesta = await this.pasarelaPago.validarPago(referenciaQr);

    let pago = await this.pagoRepositorio.buscarPorCitaId(citaId);
    const esNuevo = pago === null;
    if (!pago) {
      pago = new Pago(this.generadorId.generar(), citaId, 0, 'PENDIENTE');
    }

    if (respuesta.aprobado) {
      pago.aprobar(respuesta.referencia);
    } else {
      pago.rechazar();
    }

    if (esNuevo) {
      await this.pagoRepositorio.guardar(pago);
    } else {
      await this.pagoRepositorio.actualizar(pago);
    }

    if (!respuesta.aprobado) {
      throw new ErrorAplicacion(respuesta.mensaje || 'Pago rechazado', 'PAGO_RECHAZADO');
    }

    return pago;
  }
}
