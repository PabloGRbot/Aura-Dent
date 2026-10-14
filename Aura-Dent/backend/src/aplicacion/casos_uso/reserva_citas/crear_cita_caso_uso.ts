import { CitaMedica } from '../../../dominio/modelos/cita_medica';
import { Pago } from '../../../dominio/modelos/pago';
import {
  CrearCitaPuerto,
  ResultadoCrearCita,
  SolicitudCita
} from '../../../dominio/puertos/entrada/reserva_cita_puerto';
import { CitaRepositorioPuerto } from '../../../dominio/puertos/salida/cita_repositorio_puerto';
import { PagoRepositorioPuerto } from '../../../dominio/puertos/salida/pago_repositorio_puerto';
import { PasarelaPagoPuerto } from '../../../dominio/puertos/salida/pasarela_pago_puerto';
import { ValidacionReservaServicio } from '../../../dominio/servicios/validacion_reserva_servicio';
import { GeneradorId } from '../../../compartido/generador_id';

const MONTO_ADELANTO = 10;

export class CrearCitaCasoUso implements CrearCitaPuerto {
  constructor(
    private readonly citaRepositorio: CitaRepositorioPuerto,
    private readonly pagoRepositorio: PagoRepositorioPuerto,
    private readonly pasarelaPago: PasarelaPagoPuerto,
    private readonly validacionReserva: ValidacionReservaServicio,
    private readonly generadorId: GeneradorId
  ) {}

  async crearCita(solicitud: SolicitudCita): Promise<ResultadoCrearCita> {
    this.validacionReserva.validarSolicitud(solicitud.fecha, solicitud.duracionMinutos);

    const cita = new CitaMedica(
      this.generadorId.generar(),
      solicitud.pacienteId,
      null,
      solicitud.fecha,
      solicitud.duracionMinutos,
      'PENDIENTE_PAGO',
      null,
      solicitud.servicio
    );

    const referenciaQr = await this.pasarelaPago.generarQr(MONTO_ADELANTO, cita.id);
    const pago = new Pago(
      this.generadorId.generar(),
      cita.id,
      MONTO_ADELANTO,
      'PENDIENTE',
      'PEN',
      referenciaQr
    );

    await this.citaRepositorio.guardar(cita);
    await this.pagoRepositorio.guardar(pago);

    return { cita, pago };
  }
}
