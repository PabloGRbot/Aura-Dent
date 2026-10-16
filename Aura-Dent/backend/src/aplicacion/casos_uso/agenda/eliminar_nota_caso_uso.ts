import { NotaRepositorioPuerto } from '../../../dominio/puertos/salida/nota_repositorio_puerto';
import { EliminarNotaPuerto } from '../../../dominio/puertos/entrada/gestion_agenda_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class EliminarNotaCasoUso implements EliminarNotaPuerto {
  constructor(private readonly notaRepositorio: NotaRepositorioPuerto) {}

  async eliminar(notaId: string): Promise<void> {
    const existente = await this.notaRepositorio.buscarPorId(notaId);
    if (!existente) {
      throw new ErrorAplicacion('Nota clínica no encontrada', 'NOTA_NO_ENCONTRADA');
    }
    await this.notaRepositorio.eliminar(notaId);
  }
}
