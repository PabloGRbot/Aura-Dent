export interface NotificacionPuerto {
  enviarConfirmacionCita(correo: string, detalle: string): Promise<void>;
  enviarRecordatorio(correo: string, detalle: string): Promise<void>;
}
