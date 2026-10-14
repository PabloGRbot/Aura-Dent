import {
  PasarelaPagoPuerto,
  RespuestaPago
} from '../../../../dominio/puertos/salida/pasarela_pago_puerto';
import { variablesEntorno } from '../../../configuracion/variables_entorno';

interface RespuestaGenerarQr {
  imagenQr: string;
}

interface RespuestaValidarQr {
  aprobado: boolean;
  referencia: string;
  mensaje: string;
}

export class PasarelaQrAdaptador implements PasarelaPagoPuerto {
  constructor(private readonly urlBase: string = variablesEntorno.pagoQr.urlBase) {}

  async generarQr(monto: number, citaId: string): Promise<string> {
    const respuesta = await fetch(`${this.urlBase}/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': variablesEntorno.pagoQr.apiKey
      },
      body: JSON.stringify({ monto, citaId })
    });

    if (!respuesta.ok) {
      throw new Error('No se pudo generar el código QR de pago');
    }

    const datos = (await respuesta.json()) as RespuestaGenerarQr;
    return datos.imagenQr;
  }

  async validarPago(referencia: string): Promise<RespuestaPago> {
    const respuesta = await fetch(`${this.urlBase}/qr/${referencia}`, {
      headers: { 'X-Api-Key': variablesEntorno.pagoQr.apiKey }
    });

    if (!respuesta.ok) {
      return {
        aprobado: false,
        referencia,
        mensaje: 'No se pudo verificar el pago'
      };
    }

    return (await respuesta.json()) as RespuestaValidarQr;
  }
}
