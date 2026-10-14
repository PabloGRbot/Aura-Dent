import { Pago } from '../../../dominio/modelos/pago';
import { ConfirmarPagoPuerto } from '../../../dominio/puertos/entrada/gestion_recepcion_puerto';
import { CitaRepositorioPuerto } from '../../../dominio/puertos/salida/cita_repositorio_puerto';
import { PagoRepositorioPuerto } from '../../../dominio/puertos/salida/pago_repositorio_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class ConfirmarPagoCasoUso implements ConfirmarPagoPuerto {
  constructor(
    private readonly pagoRepositorio: PagoRepositorioPuerto,
    private readonly citaRepositorio: CitaRepositorioPuerto
  ) {}

  async confirmar(pagoId: string): Promise<Pago> {
    const pago = await this.pagoRepositorio.buscarPorId(pagoId);
    if (!pago) {
      throw new ErrorAplicacion('Pago no encontrado', 'PAGO_NO_ENCONTRADO');
    }

    if (pago.estado !== 'APROBADO') {
      pago.aprobar(pago.referenciaQr ?? `CIP${pago.id.slice(0, 9)}`);
      await this.pagoRepositorio.actualizar(pago);
    }

    const cita = await this.citaRepositorio.buscarPorId(pago.citaId);
    if (cita && (cita.estado === 'PENDIENTE_PAGO' || cita.estado === 'TEMPORAL')) {
      cita.confirmar(pago.id);
      await this.citaRepositorio.actualizar(cita);
    }

    return pago;
  }
}
