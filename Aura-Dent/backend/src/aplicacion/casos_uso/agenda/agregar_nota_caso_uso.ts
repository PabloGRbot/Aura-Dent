import { NotaClinica } from '../../../dominio/modelos/nota_clinica';
import { AgregarNotaPuerto } from '../../../dominio/puertos/entrada/gestion_agenda_puerto';
import { CitaRepositorioPuerto } from '../../../dominio/puertos/salida/cita_repositorio_puerto';
import { NotaRepositorioPuerto } from '../../../dominio/puertos/salida/nota_repositorio_puerto';
import { GeneradorId } from '../../../compartido/generador_id';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class AgregarNotaCasoUso implements AgregarNotaPuerto {
  constructor(
    private readonly citaRepositorio: CitaRepositorioPuerto,
    private readonly notaRepositorio: NotaRepositorioPuerto,
    private readonly generadorId: GeneradorId
  ) {}

  async agregar(
    odontologoId: string,
    citaId: string,
    contenido: string
  ): Promise<NotaClinica> {
    const texto = (contenido ?? '').trim();
    if (!texto) {
      throw new ErrorAplicacion('La nota no puede estar vacía', 'DATOS_INVALIDOS');
    }

    const cita = await this.citaRepositorio.buscarPorId(citaId);
    if (!cita) {
      throw new ErrorAplicacion('Cita no encontrada', 'CITA_NO_ENCONTRADA');
    }
    if (cita.estado !== 'CONFIRMADA' && cita.estado !== 'ATENDIDA') {
      throw new ErrorAplicacion(
        'Solo se pueden registrar notas de citas confirmadas o atendidas',
        'ESTADO_INVALIDO'
      );
    }
    if (cita.odontologoId && cita.odontologoId !== odontologoId) {
      throw new ErrorAplicacion(
        'La cita está asignada a otro odontólogo',
        'CITA_ASIGNADA'
      );
    }

    cita.odontologoId = odontologoId;
    if (cita.estado === 'CONFIRMADA') {
      cita.estado = 'ATENDIDA';
    }

    const nota = new NotaClinica(
      this.generadorId.generar(),
      citaId,
      odontologoId,
      texto,
      new Date()
    );

    await this.notaRepositorio.guardar(nota);
    await this.citaRepositorio.actualizar(cita);
    return nota;
  }
}
