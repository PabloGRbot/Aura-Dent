import { ListarNotasOdontologoPuerto } from '../../../dominio/puertos/entrada/gestion_agenda_puerto';
import {
  NotaClinicaDetalle,
  NotaRepositorioPuerto
} from '../../../dominio/puertos/salida/nota_repositorio_puerto';

export class ListarNotasOdontologoCasoUso implements ListarNotasOdontologoPuerto {
  constructor(private readonly notaRepositorio: NotaRepositorioPuerto) {}

  listar(odontologoId: string): Promise<NotaClinicaDetalle[]> {
    return this.notaRepositorio.listarPorOdontologo(odontologoId);
  }
}
