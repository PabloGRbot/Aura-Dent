import { CitaMedica } from '../../../dominio/modelos/cita_medica';
import { AsignarCitaPuerto } from '../../../dominio/puertos/entrada/gestion_agenda_puerto';
import { CitaRepositorioPuerto } from '../../../dominio/puertos/salida/cita_repositorio_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class AsignarCitaCasoUso implements AsignarCitaPuerto {
  constructor(private readonly citaRepositorio: CitaRepositorioPuerto) {}

  async asignar(odontologoId: string, citaId: string): Promise<CitaMedica> {
    const cita = await this.citaRepositorio.buscarPorId(citaId);
    if (!cita) {
      throw new ErrorAplicacion('Cita no encontrada', 'CITA_NO_ENCONTRADA');
    }
    if (cita.estado !== 'CONFIRMADA' && cita.estado !== 'ATENDIDA') {
      throw new ErrorAplicacion('Solo se pueden tomar citas confirmadas', 'ESTADO_INVALIDO');
    }
    if (cita.odontologoId && cita.odontologoId !== odontologoId) {
      throw new ErrorAplicacion('La cita ya está asignada a otro odontólogo', 'CITA_ASIGNADA');
    }

    cita.odontologoId = odontologoId;
    await this.citaRepositorio.actualizar(cita);
    return cita;
  }
}
