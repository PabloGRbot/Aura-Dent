import { CitaMedica } from '../../../dominio/modelos/cita_medica';
import { ConfirmarCitaPuerto } from '../../../dominio/puertos/entrada/reserva_cita_puerto';
import { CitaRepositorioPuerto } from '../../../dominio/puertos/salida/cita_repositorio_puerto';
import { NotificacionPuerto } from '../../../dominio/puertos/salida/notificacion_puerto';
import { UsuarioRepositorioPuerto } from '../../../dominio/puertos/salida/usuario_repositorio_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';

export class ConfirmarCitaCasoUso implements ConfirmarCitaPuerto {
  constructor(
    private readonly citaRepositorio: CitaRepositorioPuerto,
    private readonly usuarioRepositorio: UsuarioRepositorioPuerto,
    private readonly notificacion: NotificacionPuerto
  ) {}

  async confirmarCita(reservaId: string, pagoId: string): Promise<CitaMedica> {
    const cita = await this.citaRepositorio.buscarPorId(reservaId);
    if (!cita) {
      throw new ErrorAplicacion('Reserva no encontrada', 'RESERVA_NO_ENCONTRADA');
    }

    cita.confirmar(pagoId);
    await this.citaRepositorio.actualizar(cita);

    const paciente = await this.usuarioRepositorio.buscarPorId(cita.pacienteId);
    if (paciente) {
      await this.notificacion.enviarConfirmacionCita(
        paciente.email,
        `Cita confirmada para el ${cita.fecha.toISOString()}`
      );
    }

    return cita;
  }
}
