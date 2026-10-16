import { NotaClinica } from '../../../dominio/modelos/nota_clinica';
import { ActualizarNotaPuerto } from '../../../dominio/puertos/entrada/gestion_agenda_puerto';
import { NotaRepositorioPuerto } from '../../../dominio/puertos/salida/nota_repositorio_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class ActualizarNotaCasoUso implements ActualizarNotaPuerto {
  constructor(private readonly notaRepositorio: NotaRepositorioPuerto) {}

  async actualizar(notaId: string, contenido: string): Promise<NotaClinica> {
    const existente = await this.notaRepositorio.buscarPorId(notaId);
    if (!existente) {
      throw new ErrorAplicacion('Nota clínica no encontrada', 'NOTA_NO_ENCONTRADA');
    }
    const actualizada = new NotaClinica(
      existente.id,
      existente.citaId,
      existente.odontologoId,
      contenido,
      existente.creadoEn
    );
    await this.notaRepositorio.actualizar(actualizada);
    return actualizada;
  }
}
