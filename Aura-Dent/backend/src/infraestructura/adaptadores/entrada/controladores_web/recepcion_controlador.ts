import { Request, RequestHandler, Response, Router } from 'express';
import { Pago } from '../../../../dominio/modelos/pago';
import {
  ConfirmarPagoPuerto,
  ListarCitasTodasPuerto,
  ListarPagosPuerto,
  RechazarPagoPuerto
} from '../../../../dominio/puertos/entrada/gestion_recepcion_puerto';
import { CitaAgendaItem } from '../../../../dominio/puertos/salida/cita_repositorio_puerto';
import { PagoDetalle } from '../../../../dominio/puertos/salida/pago_repositorio_puerto';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';
import { autorizar } from '../middlewares/autenticacion_middleware';

function aCitaDto(item: CitaAgendaItem) {
  return {
    id: item.cita.id,
    pacienteNombre: item.pacienteNombre,
    pacienteDni: item.pacienteDni,
    odontologoId: item.cita.odontologoId,
    fecha: item.cita.fecha,
    duracionMinutos: item.cita.duracionMinutos,
    servicio: item.cita.servicio,
    estado: item.cita.estado
  };
}

function aPagoDto(pago: Pago) {
  return {
    id: pago.id,
    citaId: pago.citaId,
    monto: pago.monto,
    estado: pago.estado,
    moneda: pago.moneda,
    referenciaQr: pago.referenciaQr
  };
}

function aPagoDetalleDto(item: PagoDetalle) {
  return {
    ...aPagoDto(item.pago),
    pacienteNombre: item.pacienteNombre,
    pacienteDni: item.pacienteDni,
    servicio: item.servicio,
    fechaCita: item.fechaCita,
    estadoCita: item.estadoCita
  };
}

const ESTADOS_ERROR: Record<string, number> = {
  PAGO_NO_ENCONTRADO: 404,
  DATOS_INVALIDOS: 400
};

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function responderError(res: Response, error: unknown): void {
  const codigo = error instanceof ErrorAplicacion ? error.codigo : 'ERROR';
  res.status(ESTADOS_ERROR[codigo] ?? 400).json({ mensaje: (error as Error).message });
}

export function crearRecepcionControlador(
  listarCitas: ListarCitasTodasPuerto,
  listarPagos: ListarPagosPuerto,
  confirmarPago: ConfirmarPagoPuerto,
  rechazarPago: RechazarPagoPuerto,
  autenticar: RequestHandler
): Router {
  const router = Router();
  router.use('/recepcion', autenticar, autorizar('Recepcion', 'Administrador'));

  router.get('/recepcion/citas', async (_req: Request, res: Response) => {
    try {
      const citas = await listarCitas.listar();
      res.json(citas.map(aCitaDto));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.get('/recepcion/pagos', async (_req: Request, res: Response) => {
    try {
      const pagos = await listarPagos.listar();
      res.json(pagos.map(aPagoDetalleDto));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post('/recepcion/pagos/:id/confirmar', async (req: Request, res: Response) => {
    if (!ES_UUID.test(req.params.id)) {
      res.status(404).json({ mensaje: 'Pago no encontrado' });
      return;
    }
    try {
      const pago = await confirmarPago.confirmar(req.params.id);
      res.json(aPagoDto(pago));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post('/recepcion/pagos/:id/rechazar', async (req: Request, res: Response) => {
    if (!ES_UUID.test(req.params.id)) {
      res.status(404).json({ mensaje: 'Pago no encontrado' });
      return;
    }
    try {
      const pago = await rechazarPago.rechazar(req.params.id);
      res.json(aPagoDto(pago));
    } catch (error) {
      responderError(res, error);
    }
  });

  return router;
}
