import { Comprobante } from '../../../dominio/modelos/comprobante';
import { ComprobanteSalidaPuerto } from '../../../dominio/puertos/salida/comprobante_repositorio_puerto';
import { AnularComprobantePuerto } from '../../../dominio/puertos/entrada/comprobante_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class AnularComprobanteCasoUso implements AnularComprobantePuerto {
  constructor(private readonly comprobanteRepositorio: ComprobanteSalidaPuerto) {}

  async anular(id: string): Promise<void> {
    const comprobante = await this.comprobanteRepositorio.buscarPorId(id);
    if (!comprobante) {
      throw new ErrorAplicacion('Comprobante no encontrado', 'COMPROBANTE_NO_ENCONTRADO');
    }
    comprobante.anular();
    await this.comprobanteRepositorio.anular(id);
  }
}
