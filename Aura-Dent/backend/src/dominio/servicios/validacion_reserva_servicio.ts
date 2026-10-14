import { ReservaNoDisponibleExcepcion } from '../excepciones/reserva_no_disponible_excepcion';

const INTERVALO_MINUTOS = 15;

export class ValidacionReservaServicio {
  validarSolicitud(fecha: Date, duracionMinutos: number): void {
    this.validarFechaFutura(fecha);
    this.validarDuracion(duracionMinutos);
  }

  validarFechaFutura(fecha: Date): void {
    if (Number.isNaN(fecha.getTime()) || fecha.getTime() <= Date.now()) {
      throw new ReservaNoDisponibleExcepcion('La fecha de la reserva debe ser futura');
    }
  }

  validarDuracion(duracionMinutos: number): void {
    if (duracionMinutos <= 0 || duracionMinutos % INTERVALO_MINUTOS !== 0) {
      throw new ReservaNoDisponibleExcepcion(
        'La duración debe ser mayor a cero y múltiplo de 15 minutos'
      );
    }
  }

  validarDisponibilidad(existeConflicto: boolean): void {
    if (existeConflicto) {
      throw new ReservaNoDisponibleExcepcion();
    }
  }
}
