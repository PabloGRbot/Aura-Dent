import { NotaClinica } from '../../../dominio/modelos/nota_clinica';
import { ListarNotasCitaPuerto } from '../../../dominio/puertos/entrada/gestion_agenda_puerto';
import { NotaRepositorioPuerto } from '../../../dominio/puertos/salida/nota_repositorio_puerto';

export class ListarNotasCitaCasoUso implements ListarNotasCitaPuerto {
  constructor(private readonly notaRepositorio: NotaRepositorioPuerto) {}

  listar(citaId: string): Promise<NotaClinica[]> {
    return this.notaRepositorio.listarPorCita(citaId);
  }
}
