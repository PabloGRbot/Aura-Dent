import { ListarPagosPuerto } from '../../../dominio/puertos/entrada/gestion_recepcion_puerto';
import {
  PagoDetalle,
  PagoRepositorioPuerto
} from '../../../dominio/puertos/salida/pago_repositorio_puerto';

export class ListarPagosCasoUso implements ListarPagosPuerto {
  constructor(private readonly pagoRepositorio: PagoRepositorioPuerto) {}

  listar(): Promise<PagoDetalle[]> {
    return this.pagoRepositorio.listar();
  }
}
