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
import { UsuarioRepositorioPuerto } from '../../../dominio/puertos/salida/usuario_repositorio_puerto';
import { ValidacionReservaServicio } from '../../../dominio/servicios/validacion_reserva_servicio';
import { GeneradorId } from '../../../compartido/generador_id';

const MONTO_ADELANTO = 10;

export class CrearCitaCasoUso implements CrearCitaPuerto {
  constructor(
    private readonly citaRepositorio: CitaRepositorioPuerto,
    private readonly pagoRepositorio: PagoRepositorioPuerto,
    private readonly pasarelaPago: PasarelaPagoPuerto,
    private readonly validacionReserva: ValidacionReservaServicio,
    private readonly generadorId: GeneradorId,
    private readonly usuarioRepositorio: UsuarioRepositorioPuerto
  ) {}

  async crearCita(solicitud: SolicitudCita): Promise<ResultadoCrearCita> {
    this.validacionReserva.validarSolicitud(solicitud.fecha, solicitud.duracionMinutos);

    const odontologoId = solicitud.odontologoId ?? null;
    let tieneConflicto = false;
    if (odontologoId) {
      tieneConflicto = await this.citaRepositorio.existeConflicto(
        odontologoId,
        solicitud.fecha,
        solicitud.duracionMinutos
      );
    }
    this.validacionReserva.validarDisponibilidad(tieneConflicto);

    const cita = new CitaMedica(


      this.generadorId.generar(),
      solicitud.pacienteId,
      solicitud.odontologoId ?? null,
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
      'QR',
      'ADELANTO',
      referenciaQr,
      null
    );

    await this.citaRepositorio.guardar(cita);
    await this.pagoRepositorio.guardar(pago);

    if (solicitud.odontologoId) {
      const paciente = await this.usuarioRepositorio.buscarPorId(solicitud.pacienteId);
      if (paciente && !paciente.odontologoAsignadoId) {
        paciente.odontologoAsignadoId = solicitud.odontologoId;
        await this.usuarioRepositorio.actualizar(paciente);
      }
    }

    return { cita, pago };
  }
}
