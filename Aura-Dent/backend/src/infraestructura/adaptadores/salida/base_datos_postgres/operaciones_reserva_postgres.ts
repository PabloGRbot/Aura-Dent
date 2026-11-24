import { Pool, PoolClient } from 'pg';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';
import { GeneradorId } from '../../../../compartido/generador_id';
import { EliminarReservaPuerto, PagarCitaPuerto } from '../../../../dominio/puertos/entrada/reserva_cita_puerto';
import { ConfirmarPagoPuerto, RegistrarPagoManualPuerto, SolicitudPagoManual } from '../../../../dominio/puertos/entrada/gestion_recepcion_puerto';
import { PasarelaPagoPuerto } from '../../../../dominio/puertos/salida/pasarela_pago_puerto';
import { PagarCitaCasoUso } from '../../../../aplicacion/casos_uso/reserva_citas/pagar_cita_caso_uso';
import { ConfirmarPagoCasoUso } from '../../../../aplicacion/casos_uso/recepcion/confirmar_pago_caso_uso';
import { RegistrarPagoManualCasoUso } from '../../../../aplicacion/casos_uso/recepcion/registrar_pago_manual_caso_uso';
import { ValidarPagoQrCasoUso } from '../../../../aplicacion/casos_uso/pagos/validar_pago_qr_caso_uso';
import { EmitirComprobanteCasoUso } from '../../../../aplicacion/casos_uso/comprobantes/emitir_comprobante_caso_uso';
import { EmitirBoletaPorPagoCasoUso } from '../../../../aplicacion/casos_uso/comprobantes/emitir_boleta_por_pago_caso_uso';
import { CitaPostgresRepositorio } from './cita_postgres_repositorio';
import { PagoPostgresRepositorio } from './pago_postgres_repositorio';
import { ComprobantePostgresRepositorio } from './comprobante_postgres_repositorio';
import { RechazarPagoCasoUso } from '../../../../aplicacion/casos_uso/recepcion/rechazar_pago_caso_uso';
import { SolicitudEmitirComprobante } from '../../../../dominio/puertos/entrada/comprobante_puerto';
import { establecerActor, contextoOperacion } from './contexto_operacion';

/** Pagar y eliminar se serializan por cita, en la misma conexión y transacción. */
export class OperacionesReservaPostgres implements EliminarReservaPuerto, PagarCitaPuerto, ConfirmarPagoPuerto, RegistrarPagoManualPuerto {
  constructor(private readonly pool: Pool, private readonly pasarela: PasarelaPagoPuerto, private readonly ids: GeneradorId) {}

  private async transaccion<T>(citaId: string, accion: (cliente: PoolClient) => Promise<T>): Promise<T> {
    const cliente = await this.pool.connect();
    try {
      await cliente.query('BEGIN');
      await cliente.query("SET LOCAL lock_timeout='5s'");
      await establecerActor(cliente);
      const previa = await cliente.query('SELECT odontologo_id FROM citas WHERE id=$1',[citaId]);
      if (previa.rows[0]?.odontologo_id) await cliente.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[previa.rows[0].odontologo_id]);
      const cita = await cliente.query('SELECT id FROM citas WHERE id = $1 FOR UPDATE', [citaId]);
      if (!cita.rowCount) throw new ErrorAplicacion('La reserva ya no existe. Actualiza tus citas.', 'CITA_NO_ENCONTRADA');
      const resultado = await accion(cliente);
      await cliente.query('COMMIT');
      return resultado;
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally { cliente.release(); }
  }

  private repositorios(cliente: PoolClient) {
    const citas = new CitaPostgresRepositorio(this.pool, cliente);
    const pagos = new PagoPostgresRepositorio(this.pool, cliente);
    const comprobantes = new ComprobantePostgresRepositorio(this.pool, cliente);
    const boleta = new EmitirBoletaPorPagoCasoUso(new EmitirComprobanteCasoUso(comprobantes, pagos));
    return { citas, pagos, boleta };
  }

  async eliminar(pacienteId: string, citaId: string): Promise<void> {
    await this.transaccion(citaId, async (cliente) => {
      const { citas } = this.repositorios(cliente);
      const cita = (await citas.buscarPorId(citaId))!;
      if (cita.pacienteId !== pacienteId) throw new ErrorAplicacion('No puedes eliminar una reserva de otro paciente.', 'NO_AUTORIZADO');
      if (cita.estado === 'CANCELADA') return;
      if (!['TEMPORAL','PENDIENTE_PAGO'].includes(cita.estado)) throw new ErrorAplicacion('Solo puedes cancelar así reservas pendientes de pago.', 'RESERVA_PROTEGIDA');
      const pagos = await cliente.query('SELECT estado FROM pagos WHERE cita_id = $1 FOR UPDATE', [citaId]);
      const relacionados = await cliente.query(
        'SELECT EXISTS(SELECT 1 FROM comprobantes WHERE cita_id = $1) OR EXISTS(SELECT 1 FROM notas_clinicas WHERE cita_id = $1) AS protegido', [citaId]);
      if (pagos.rows.some((p) => p.estado !== 'PENDIENTE') || relacionados.rows[0].protegido || cita.pagoId) {
        throw new ErrorAplicacion('Esta cita tiene pagos o registros asociados y no se puede eliminar.', 'RESERVA_PROTEGIDA');
      }
      await cliente.query("UPDATE citas SET estado='CANCELADA' WHERE id=$1",[citaId]);
      await cliente.query("UPDATE pagos SET estado='ANULADO' WHERE cita_id = $1 AND estado = 'PENDIENTE'", [citaId]);
    });
  }

  pagarCita(pacienteId: string, citaId: string, referencia: string) {
    return this.transaccion(citaId, (cliente) => {
      const { citas, pagos, boleta } = this.repositorios(cliente);
      return new PagarCitaCasoUso(citas, pagos, this.pasarela, boleta).pagarCita(pacienteId, citaId, referencia)
        .then(async resultado => ({...resultado,cita:(await citas.buscarPorId(citaId))!}));
    });
  }

  async confirmar(pagoId: string) {
    const pago = await new PagoPostgresRepositorio(this.pool).buscarPorId(pagoId);
    if (!pago) throw new ErrorAplicacion('Pago no encontrado.', 'PAGO_NO_ENCONTRADO');
    return this.transaccion(pago.citaId, (cliente) => {
      const { citas, pagos, boleta } = this.repositorios(cliente);
      return new ConfirmarPagoCasoUso(pagos, citas, boleta).confirmar(pagoId);
    });
  }
  async rechazar(pagoId:string) {
    const pago=await new PagoPostgresRepositorio(this.pool).buscarPorId(pagoId);
    if(!pago)throw new ErrorAplicacion('Pago no encontrado.','PAGO_NO_ENCONTRADO');
    return this.transaccion(pago.citaId,c=>new RechazarPagoCasoUso(new PagoPostgresRepositorio(this.pool,c)).rechazar(pagoId));
  }
  emitir(solicitud:SolicitudEmitirComprobante) {
    return this.transaccion(solicitud.citaId,c=>new EmitirComprobanteCasoUso(new ComprobantePostgresRepositorio(this.pool,c),new PagoPostgresRepositorio(this.pool,c)).emitir(solicitud));
  }

  registrar(solicitud: SolicitudPagoManual) {
    return this.transaccion(solicitud.citaId, (cliente) => {
      const { citas, pagos, boleta } = this.repositorios(cliente);
      return new RegistrarPagoManualCasoUso(citas, pagos, this.ids, boleta).registrar(solicitud);
    });
  }

  validarPagoQr(citaId: string, referencia: string) {
    const actor=contextoOperacion.getStore();
    if(!actor?.actorId||actor.rol!=='Paciente') throw new ErrorAplicacion('No autenticado.','NO_AUTORIZADO');
    return this.pagarCita(actor.actorId,citaId,referencia).then(r=>r.pago!);
  }
}
