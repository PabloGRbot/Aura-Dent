import { Comprobante } from '../../../dominio/modelos/comprobante';
import { ComprobanteSalidaPuerto } from '../../../dominio/puertos/salida/comprobante_repositorio_puerto';
import { ListarComprobantesPacientePuerto } from '../../../dominio/puertos/entrada/comprobante_puerto';

export class ListarComprobantesPacienteCasoUso implements ListarComprobantesPacientePuerto {
  constructor(private readonly comprobanteRepositorio: ComprobanteSalidaPuerto) {}

  async listarPorPaciente(pacienteId: string): Promise<Comprobante[]> {
    return this.comprobanteRepositorio.listarPorPaciente(pacienteId);
  }
}
