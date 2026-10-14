import nodemailer, { Transporter } from 'nodemailer';
import { NotificacionPuerto } from '../../../../dominio/puertos/salida/notificacion_puerto';
import { variablesEntorno } from '../../../configuracion/variables_entorno';

export class CorreoAdaptador implements NotificacionPuerto {
  private readonly transporte: Transporter;

  constructor() {
    this.transporte = nodemailer.createTransport({
      host: variablesEntorno.correo.host,
      port: variablesEntorno.correo.puerto,
      auth: {
        user: variablesEntorno.correo.usuario,
        pass: variablesEntorno.correo.contrasena
      }
    });
  }

  async enviarConfirmacionCita(correo: string, detalle: string): Promise<void> {
    await this.enviar(correo, 'Confirmación de cita - Aura-Dent', detalle);
  }

  async enviarRecordatorio(correo: string, detalle: string): Promise<void> {
    await this.enviar(correo, 'Recordatorio de cita - Aura-Dent', detalle);
  }

  private async enviar(para: string, asunto: string, detalle: string): Promise<void> {
    await this.transporte.sendMail({
      from: variablesEntorno.correo.remitente,
      to: para,
      subject: asunto,
      text: detalle
    });
  }
}
