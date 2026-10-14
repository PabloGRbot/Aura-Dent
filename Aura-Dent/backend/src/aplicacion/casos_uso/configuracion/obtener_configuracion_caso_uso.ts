import {
  ObtenerConfiguracionPuerto,
  ValoresConfiguracion
} from '../../../dominio/puertos/entrada/configuracion_puerto';
import { ConfiguracionRepositorioPuerto } from '../../../dominio/puertos/salida/configuracion_repositorio_puerto';

export class ObtenerConfiguracionCasoUso implements ObtenerConfiguracionPuerto {
  constructor(private readonly configuracionRepositorio: ConfiguracionRepositorioPuerto) {}

  obtener(): Promise<ValoresConfiguracion> {
    return this.configuracionRepositorio.obtenerTodos();
  }
}
