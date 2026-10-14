import nodemailer, { Transporter } from "nodemailer";
import {
  DatosNotificacion,
  NotificacionService,
} from "../../../domain/ports/NotificacionService";

/**
 * Adaptador de notificaciones por correo. Si no hay servidor SMTP
 * configurado, escribe el contenido en consola (modo demostración),
 * de modo que el sistema funciona sin credenciales externas.
 */
export class EmailNotificacionService implements NotificacionService {
  private transporter: Transporter | null = null;
  private from: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    this.from = process.env.SMTP_FROM || "Aura Dent <no-reply@auradent.pe>";

    if (host && process.env.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async enviarConfirmacion(datos: DatosNotificacion): Promise<void> {
    await this.enviar(
      datos,
      `✅ Cita confirmada — ${datos.codigoReserva}`,
      "Tu cita en Aura Dent ha sido confirmada",
    );
  }

  async enviarRecordatorio(datos: DatosNotificacion): Promise<void> {
    await this.enviar(
      datos,
      `⏰ Recordatorio de cita — ${datos.codigoReserva}`,
      "Recuerda tu próxima cita en Aura Dent",
    );
  }

  private async enviar(
    datos: DatosNotificacion,
    asunto: string,
    encabezado: string,
  ): Promise<void> {
    const cuerpo =
      `${encabezado}\n\n` +
      `Paciente: ${datos.nombres}\n` +
      `Código de reserva: ${datos.codigoReserva}\n` +
      `Servicio: ${datos.servicio}\n` +
      `Odontólogo: ${datos.odontologo}\n` +
      `Fecha: ${datos.fecha}\n` +
      `Hora: ${datos.horaInicio}\n` +
      `Monto de reserva: S/ ${datos.montoReserva}\n\n` +
      `Gracias por confiar en Aura Dent 🦷`;

    if (!this.transporter) {
      console.log(`📧 [notificación simulada] ${asunto} → ${datos.correo}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: datos.correo,
        subject: asunto,
        text: cuerpo,
      });
    } catch (error: any) {
      console.error("❌ Error enviando correo:", error.message);
    }
  }
}
