import { CitaRepository } from "../../domain/ports/CitaRepository";
import {
  DatosNotificacion,
  NotificacionService,
} from "../../domain/ports/NotificacionService";

/**
 * RF17 (deseable): envío de confirmaciones de cita y recordatorios previos.
 */
export class NotificarCita {
  constructor(
    private citaRepo: CitaRepository,
    private notificacion: NotificacionService,
  ) {}

  async confirmacion(citaId: string): Promise<void> {
    const detalle = await this.citaRepo.obtenerDetalleNotificacion(citaId);
    if (detalle) await this.notificacion.enviarConfirmacion(this.map(detalle));
  }

  async recordatoriosManana(): Promise<number> {
    const manana = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const citas = await this.citaRepo.listarConfirmadasPorFecha(manana);
    for (const detalle of citas) {
      await this.notificacion.enviarRecordatorio(this.map(detalle));
    }
    return citas.length;
  }

  private map(d: any): DatosNotificacion {
    const fecha =
      typeof d.fecha === "string" ? d.fecha.slice(0, 10) : String(d.fecha);
    return {
      correo: d.correo,
      nombres: d.nombres,
      codigoReserva: d.codigoReserva,
      servicio: d.servicio,
      fecha,
      horaInicio: d.horaInicio,
      odontologo: d.odontologo,
      montoReserva: Number(d.montoReserva),
    };
  }
}
