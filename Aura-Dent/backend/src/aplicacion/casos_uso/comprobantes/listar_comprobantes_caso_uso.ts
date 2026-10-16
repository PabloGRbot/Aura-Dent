import { Comprobante } from '../../../dominio/modelos/comprobante';
import { ComprobanteSalidaPuerto } from '../../../dominio/puertos/salida/comprobante_repositorio_puerto';
import { ListarComprobantesPuerto } from '../../../dominio/puertos/entrada/comprobante_puerto';

export class ListarComprobantesCasoUso implements ListarComprobantesPuerto {
  constructor(private readonly comprobanteRepositorio: ComprobanteSalidaPuerto) {}

  async listar(): Promise<Comprobante[]> {
    return this.comprobanteRepositorio.listar();
  }
}
