import { ListarCitasTodasPuerto } from '../../../dominio/puertos/entrada/gestion_recepcion_puerto';
import {
  CitaAgendaItem,
  CitaRepositorioPuerto
} from '../../../dominio/puertos/salida/cita_repositorio_puerto';

export class ListarCitasTodasCasoUso implements ListarCitasTodasPuerto {
  constructor(private readonly citaRepositorio: CitaRepositorioPuerto) {}

  listar(): Promise<CitaAgendaItem[]> {
    return this.citaRepositorio.listarTodas();
  }
}
