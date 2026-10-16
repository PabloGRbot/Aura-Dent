import { Comprobante, TipoComprobante } from '../../../dominio/modelos/comprobante';
import { EmitirComprobantePuerto, SolicitudEmitirComprobante } from '../../../dominio/puertos/entrada/comprobante_puerto';
import { ComprobanteSalidaPuerto } from '../../../dominio/puertos/salida/comprobante_repositorio_puerto';
import { PagoRepositorioPuerto } from '../../../dominio/puertos/salida/pago_repositorio_puerto';
import { ErrorAplicacion } from '../../../compartido/error_aplicacion';
import { randomUUID } from 'crypto';

const IGV = 0.18;

export class EmitirComprobanteCasoUso implements EmitirComprobantePuerto {
  constructor(
    private readonly comprobanteRepositorio: ComprobanteSalidaPuerto,
    private readonly pagoRepositorio: PagoRepositorioPuerto
  ) {}

  async emitir(solicitud: SolicitudEmitirComprobante): Promise<Comprobante> {
    const pago = await this.pagoRepositorio.buscarPorId(solicitud.pagoId);
    if (!pago) {
      throw new ErrorAplicacion('Pago no encontrado', 'PAGO_NO_ENCONTRADO');
    }
    if (pago.estado !== 'APROBADO') {
      throw new ErrorAplicacion('El pago no está aprobado', 'ESTADO_INVALIDO');
    }

    const existente = await this.comprobanteRepositorio.buscarPorPagoId(solicitud.pagoId);
    if (existente) {
      throw new ErrorAplicacion('El pago ya tiene un comprobante emitido', 'COMPROBANTE_YA_EXISTE');
    }

    const total = pago.monto;
    const igv = Number((total * IGV).toFixed(2));
    const subtotal = Number((total - igv).toFixed(2));

    const serie = solicitud.serie || 'B001';
    const correlativo = await this.comprobanteRepositorio.siguienteCorrelativo(solicitud.tipo, serie);

    const comprobante = new Comprobante(
      randomUUID(),
      solicitud.pagoId,
      solicitud.citaId,
      solicitud.tipo,
      serie,
      correlativo,
      solicitud.rucCliente ?? null,
      solicitud.razonSocial ?? null,
      subtotal,
      igv,
      total,
      pago.moneda,
      'EMITIDO',
      new Date()
    );

    await this.comprobanteRepositorio.guardar(comprobante);
    return comprobante;
  }
}
