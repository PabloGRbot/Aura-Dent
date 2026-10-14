import { CitaMedica } from '../../../dominio/modelos/cita_medica';
import {
  CrearReservaTemporalPuerto,
  ReservaTemporal,
  SolicitudReserva
} from '../../../dominio/puertos/entrada/reserva_cita_puerto';
import { CitaRepositorioPuerto } from '../../../dominio/puertos/salida/cita_repositorio_puerto';
import { ValidacionReservaServicio } from '../../../dominio/servicios/validacion_reserva_servicio';
import { GeneradorId } from '../../../compartido/generador_id';

const DURACION_RESERVA_TEMPORAL_MS = 15 * 60 * 1000;

export class CrearReservaTemporalCasoUso implements CrearReservaTemporalPuerto {
  constructor(
    private readonly citaRepositorio: CitaRepositorioPuerto,
    private readonly validacionReserva: ValidacionReservaServicio,
    private readonly generadorId: GeneradorId
  ) {}

  async crearReservaTemporal(solicitud: SolicitudReserva): Promise<ReservaTemporal> {
    this.validacionReserva.validarSolicitud(solicitud.fecha, solicitud.duracionMinutos);

    const existeConflicto = await this.citaRepositorio.existeConflicto(
      solicitud.odontologoId,
      solicitud.fecha,
      solicitud.duracionMinutos
    );
    this.validacionReserva.validarDisponibilidad(existeConflicto);

    const reservaId = this.generadorId.generar();
    const cita = new CitaMedica(
      reservaId,
      solicitud.pacienteId,
      solicitud.odontologoId,
      solicitud.fecha,
      solicitud.duracionMinutos,
      'TEMPORAL'
    );
    await this.citaRepositorio.guardar(cita);

    return {
      reservaId,
      expiraEn: new Date(Date.now() + DURACION_RESERVA_TEMPORAL_MS),
      monto: 0
    };
  }
}
