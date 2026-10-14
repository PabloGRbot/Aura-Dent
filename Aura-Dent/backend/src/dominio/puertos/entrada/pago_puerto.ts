import { Pago } from '../../modelos/pago';

export interface ValidarPagoQrPuerto {
  validarPagoQr(citaId: string, referenciaQr: string): Promise<Pago>;
}
