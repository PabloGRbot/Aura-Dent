export interface DatosNotificacion {
  correo: string;
  nombres: string;
  codigoReserva: string;
  servicio: string;
  fecha: string;
  horaInicio: string;
  odontologo: string;
  montoReserva: number;
}

/**
 * RF17 (deseable): envío de confirmaciones y recordatorios al paciente
 * por correo electrónico.
 */
export interface NotificacionService {
  enviarConfirmacion(datos: DatosNotificacion): Promise<void>;
  enviarRecordatorio(datos: DatosNotificacion): Promise<void>;
}
