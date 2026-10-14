import {
  ActualizarConfiguracionPuerto,
  ValoresConfiguracion
} from '../../../dominio/puertos/entrada/configuracion_puerto';
import { ConfiguracionRepositorioPuerto } from '../../../dominio/puertos/salida/configuracion_repositorio_puerto';

export class ActualizarConfiguracionCasoUso implements ActualizarConfiguracionPuerto {
  constructor(private readonly configuracionRepositorio: ConfiguracionRepositorioPuerto) {}

  async actualizar(valores: ValoresConfiguracion): Promise<ValoresConfiguracion> {
    const limpios: ValoresConfiguracion = {};
    for (const [clave, valor] of Object.entries(valores ?? {})) {
      if (typeof clave === 'string' && clave.trim().length > 0) {
        limpios[clave.trim()] = String(valor);
      }
    }
    await this.configuracionRepositorio.guardarVarios(limpios);
    return this.configuracionRepositorio.obtenerTodos();
  }
}
