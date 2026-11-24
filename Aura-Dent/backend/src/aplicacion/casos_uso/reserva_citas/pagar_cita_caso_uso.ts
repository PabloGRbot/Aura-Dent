import {
  CitaConPago,
  PagarCitaPuerto
} from '../../../dominio/puertos/entrada/reserva_cita_puerto';
import { CitaRepositorioPuerto } from '../../../dominio/puertos/salida/cita_repositorio_puerto';
import { PagoRepositorioPuerto } from '../../../dominio/puertos/salida/pago_repositorio_puerto';
import { PasarelaPagoPuerto } from '../../../dominio/puertos/salida/pasarela_pago_puerto';
import { EmitirBoletaPorPagoPuerto } from '../../../dominio/puertos/entrada/comprobante_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class PagarCitaCasoUso implements PagarCitaPuerto {
  constructor(
    private readonly citaRepositorio: CitaRepositorioPuerto,
    private readonly pagoRepositorio: PagoRepositorioPuerto,
    private readonly pasarelaPago: PasarelaPagoPuerto,
    private readonly emitirBoleta: EmitirBoletaPorPagoPuerto
  ) {}

  async pagarCita(
    pacienteId: string,
    citaId: string,
    referenciaQr: string
  ): Promise<CitaConPago> {
    const cita = await this.citaRepositorio.buscarPorId(citaId);
    if (!cita) {
      throw new ErrorAplicacion('Cita no encontrada', 'CITA_NO_ENCONTRADA');
    }
    if (cita.pacienteId !== pacienteId) {
      throw new ErrorAplicacion('No puedes pagar una cita de otro paciente', 'NO_AUTORIZADO');
    }
    if (!['PENDIENTE_PAGO','TEMPORAL'].includes(cita.estado)) {
      throw new ErrorAplicacion('La cita no está pendiente de pago', 'ESTADO_INVALIDO');
    }
    if (cita.expiraEn && cita.expiraEn.getTime() <= Date.now()) {
      throw new ErrorAplicacion('La reserva venció. Debes elegir otro horario.', 'RESERVA_VENCIDA');
    }

    const pago = await this.pagoRepositorio.buscarPorCitaId(citaId);
    if (!pago) {
      throw new ErrorAplicacion('No se encontró el pago de la cita', 'PAGO_NO_ENCONTRADO');
    }

    const respuesta = await this.pasarelaPago.validarPago(referenciaQr);
    if (!respuesta.aprobado) {
      throw new ErrorAplicacion(respuesta.mensaje, 'PAGO_RECHAZADO');
    }
    if(cita.expiraEn&&cita.expiraEn.getTime()<=Date.now())throw new ErrorAplicacion('La reserva venció mientras se verificaba el pago simulado. Elige otro horario.','RESERVA_VENCIDA');

    pago.aprobar(respuesta.referencia);
    cita.confirmar(pago.id);

    await this.pagoRepositorio.actualizar(pago);
    await this.citaRepositorio.actualizar(cita);

    await this.emitirBoleta.emitirBoleta(pago.id, cita.id);

    return { cita, pago };
  }
}
