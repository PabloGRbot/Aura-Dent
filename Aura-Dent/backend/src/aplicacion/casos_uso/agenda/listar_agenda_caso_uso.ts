import { ListarAgendaPuerto } from '../../../dominio/puertos/entrada/gestion_agenda_puerto';
import {
  CitaAgendaItem,
  CitaRepositorioPuerto
} from '../../../dominio/puertos/salida/cita_repositorio_puerto';

export class ListarAgendaCasoUso implements ListarAgendaPuerto {
  constructor(private readonly citaRepositorio: CitaRepositorioPuerto) {}

  listar(): Promise<CitaAgendaItem[]> {
    return this.citaRepositorio.listarParaAgenda();
  }
}
