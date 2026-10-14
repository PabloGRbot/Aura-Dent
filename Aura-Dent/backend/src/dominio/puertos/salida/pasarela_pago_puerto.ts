export interface RespuestaPago {
  aprobado: boolean;
  referencia: string;
  mensaje: string;
}

export interface PasarelaPagoPuerto {
  generarQr(monto: number, citaId: string): Promise<string>;
  validarPago(referencia: string): Promise<RespuestaPago>;
}
