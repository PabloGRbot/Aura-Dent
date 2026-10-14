import { Pago } from '../tipos';
import { peticion } from './cliente';

export function validarPagoQr(citaId: string, referenciaQr: string): Promise<Pago> {
  return peticion<Pago>('/api/pagos/qr', {
    method: 'POST',
    body: JSON.stringify({ citaId, referenciaQr })
  });
}
