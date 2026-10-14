import {
  Disponibilidad,
  IntervaloDisponibilidad
} from '../../../dominio/modelos/disponibilidad';
import {
  ConsultaDisponibilidad,
  ConsultarDisponibilidadPuerto
} from '../../../dominio/puertos/entrada/asistente_ia_puerto';
import { CitaRepositorioPuerto } from '../../../dominio/puertos/salida/cita_repositorio_puerto';

const HORA_APERTURA = 8;
const HORA_CIERRE = 20;
const INTERVALO_MINUTOS = 30;

export class ConsultarDisponibilidadCasoUso implements ConsultarDisponibilidadPuerto {
  constructor(private readonly citaRepositorio: CitaRepositorioPuerto) {}

  async consultarDisponibilidad(consulta: ConsultaDisponibilidad): Promise<Disponibilidad> {
    const citas = await this.citaRepositorio.buscarPorOdontologoYFecha(
      consulta.odontologoId,
      consulta.fecha
    );

    const intervalos: IntervaloDisponibilidad[] = [];
    for (let minuto = HORA_APERTURA * 60; minuto < HORA_CIERRE * 60; minuto += INTERVALO_MINUTOS) {
      const ocupado = citas.some((cita) => {
        const inicioCita = cita.fecha.getHours() * 60 + cita.fecha.getMinutes();
        const finCita = inicioCita + cita.duracionMinutos;
        return minuto < finCita && minuto + INTERVALO_MINUTOS > inicioCita;
      });

      intervalos.push({
        horaInicio: this.formatearHora(minuto),
        horaFin: this.formatearHora(minuto + INTERVALO_MINUTOS),
        disponible: !ocupado
      });
    }

    return new Disponibilidad(consulta.odontologoId, consulta.fecha, intervalos);
  }

  private formatearHora(minuto: number): string {
    const horas = Math.floor(minuto / 60)
      .toString()
      .padStart(2, '0');
    const minutos = (minuto % 60).toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  }
}
