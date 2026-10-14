import { randomInt } from 'crypto';
import {
  PasarelaPagoPuerto,
  RespuestaPago
} from '../../../../dominio/puertos/salida/pasarela_pago_puerto';

export class PasarelaQrSimuladaAdaptador implements PasarelaPagoPuerto {
  async generarQr(_monto: number, _citaId: string): Promise<string> {
    const numero = String(randomInt(0, 1_000_000)).padStart(12, '0');
    return `CIP${numero}`;
  }

  async validarPago(referencia: string): Promise<RespuestaPago> {
    const valida = referencia.trim().length > 0;
    return {
      aprobado: valida,
      referencia,
      mensaje: valida ? 'Pago simulado aprobado' : 'Referencia de pago inválida'
    };
  }
}
