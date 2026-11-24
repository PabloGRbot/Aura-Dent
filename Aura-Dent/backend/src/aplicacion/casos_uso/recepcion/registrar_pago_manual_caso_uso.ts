import { Pago, MetodoPago, TipoPago } from '../../../dominio/modelos/pago';
import { RegistrarPagoManualPuerto, SolicitudPagoManual } from '../../../dominio/puertos/entrada/gestion_recepcion_puerto';
import { CitaRepositorioPuerto } from '../../../dominio/puertos/salida/cita_repositorio_puerto';
import { PagoRepositorioPuerto } from '../../../dominio/puertos/salida/pago_repositorio_puerto';
import { EmitirBoletaPorPagoPuerto } from '../../../dominio/puertos/entrada/comprobante_puerto';
import { GeneradorId } from '../../../compartido/generador_id';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class RegistrarPagoManualCasoUso implements RegistrarPagoManualPuerto {
  constructor(
    private readonly citaRepositorio: CitaRepositorioPuerto,
    private readonly pagoRepositorio: PagoRepositorioPuerto,
    private readonly generadorId: GeneradorId,
    private readonly emitirBoleta: EmitirBoletaPorPagoPuerto
  ) {}

  async registrar(solicitud: SolicitudPagoManual): Promise<Pago> {
    const cita = await this.citaRepositorio.buscarPorId(solicitud.citaId);
    if (!cita) {
      throw new ErrorAplicacion('Cita no encontrada', 'CITA_NO_ENCONTRADA');
    }
    if(!Number.isFinite(solicitud.monto)||solicitud.monto<=0)throw new ErrorAplicacion('El monto debe ser positivo.','DATOS_INVALIDOS');
    if(!['CONFIRMADA','ATENDIDA','PENDIENTE_PAGO','TEMPORAL'].includes(cita.estado)||
      ['TEMPORAL','PENDIENTE_PAGO'].includes(cita.estado)&&cita.expiraEn&&cita.expiraEn<=new Date()) throw new ErrorAplicacion('La cita ya no admite pagos.','ESTADO_INVALIDO');
    const pendiente=['TEMPORAL','PENDIENTE_PAGO'].includes(cita.estado);
    const existente=pendiente ? await this.pagoRepositorio.buscarPorCitaId(cita.id):null;
    if(pendiente && solicitud.monto!==(existente?.monto ?? 10)) throw new ErrorAplicacion('Para confirmar registra únicamente el adelanto pendiente.','DATOS_INVALIDOS');
    const pago = new Pago(
      existente?.id ?? this.generadorId.generar(),
      solicitud.citaId,
      solicitud.monto,
      'APROBADO',
      'PEN',
      solicitud.metodo,
      pendiente ? 'ADELANTO':solicitud.tipo ?? 'SALDO',
      null,
      new Date()
    );

    if(existente)await this.pagoRepositorio.actualizar(pago);else await this.pagoRepositorio.guardar(pago);
    if(pendiente){cita.confirmar(pago.id);await this.citaRepositorio.actualizar(cita);}

    await this.emitirBoleta.emitirBoleta(pago.id, pago.citaId);

    return pago;
  }
}
