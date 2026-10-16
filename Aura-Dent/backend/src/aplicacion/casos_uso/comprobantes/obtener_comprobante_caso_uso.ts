import { Comprobante } from '../../../dominio/modelos/comprobante';
import { ComprobanteSalidaPuerto } from '../../../dominio/puertos/salida/comprobante_repositorio_puerto';
import { ObtenerComprobantePuerto } from '../../../dominio/puertos/entrada/comprobante_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class ObtenerComprobanteCasoUso implements ObtenerComprobantePuerto {
  constructor(private readonly comprobanteRepositorio: ComprobanteSalidaPuerto) {}

  async obtener(id: string): Promise<Comprobante | null> {
    const comprobante = await this.comprobanteRepositorio.buscarPorId(id);
    if (!comprobante) {
      throw new ErrorAplicacion('Comprobante no encontrado', 'COMPROBANTE_NO_ENCONTRADO');
    }
    return comprobante;
  }
}
