import { Pago, MetodoPago, TipoPago } from '../../../dominio/modelos/pago';
import { RegistrarPagoManualPuerto, SolicitudPagoManual } from '../../../dominio/puertos/entrada/gestion_recepcion_puerto';
import { CitaRepositorioPuerto } from '../../../dominio/puertos/salida/cita_repositorio_puerto';
import { PagoRepositorioPuerto } from '../../../dominio/puertos/salida/pago_repositorio_puerto';
import { GeneradorId } from '../../../compartido/generador_id';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class RegistrarPagoManualCasoUso implements RegistrarPagoManualPuerto {
  constructor(
    private readonly citaRepositorio: CitaRepositorioPuerto,
    private readonly pagoRepositorio: PagoRepositorioPuerto,
    private readonly generadorId: GeneradorId
  ) {}

  async registrar(solicitud: SolicitudPagoManual): Promise<Pago> {
    const cita = await this.citaRepositorio.buscarPorId(solicitud.citaId);
    if (!cita) {
      throw new ErrorAplicacion('Cita no encontrada', 'CITA_NO_ENCONTRADA');
    }

    const pago = new Pago(
      this.generadorId.generar(),
      solicitud.citaId,
      solicitud.monto,
      'APROBADO',
      'PEN',
      solicitud.metodo,
      solicitud.tipo ?? 'UNICO',
      null,
      new Date()
    );

    await this.pagoRepositorio.guardar(pago);
    return pago;
  }
}
