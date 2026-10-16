import { Request, RequestHandler, Response, Router } from 'express';
import { Comprobante } from '../../../../dominio/modelos/comprobante';
import {
  AnularComprobantePuerto,
  EmitirComprobantePuerto,
  ListarComprobantesPacientePuerto,
  ListarComprobantesPuerto,
  ObtenerComprobantePuerto,
  SolicitudEmitirComprobante
} from '../../../../dominio/puertos/entrada/comprobante_puerto';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';
import { autorizar, SolicitudAutenticada } from '../middlewares/autenticacion_middleware';

function aComprobanteDto(comprobante: Comprobante) {
  return {
    id: comprobante.id,
    pagoId: comprobante.pagoId,
    citaId: comprobante.citaId,
    tipo: comprobante.tipo,
    serie: comprobante.serie,
    correlativo: comprobante.correlativo,
    rucCliente: comprobante.rucCliente,
    razonSocial: comprobante.razonSocial,
    subtotal: comprobante.subtotal,
    igv: comprobante.igv,
    total: comprobante.total,
    moneda: comprobante.moneda,
    estado: comprobante.estado,
    emitidoEn: comprobante.emitidoEn,
    anuladoEn: comprobante.anuladoEn
  };
}

const ESTADOS_ERROR: Record<string, number> = {
  COMPROBANTE_NO_ENCONTRADO: 404,
  PAGO_NO_ENCONTRADO: 404,
  ESTADO_INVALIDO: 400,
  COMPROBANTE_YA_EXISTE: 409,
  DATOS_INVALIDOS: 400
};

function responderError(res: Response, error: unknown): void {
  const codigo = error instanceof ErrorAplicacion ? error.codigo : 'ERROR';
  res.status(ESTADOS_ERROR[codigo] ?? 400).json({ mensaje: (error as Error).message });
}

export function crearComprobantesControlador(
  emitir: EmitirComprobantePuerto,
  listar: ListarComprobantesPuerto,
  listarPorPaciente: ListarComprobantesPacientePuerto,
  obtener: ObtenerComprobantePuerto,
  anular: AnularComprobantePuerto,
  autenticar: RequestHandler
): Router {
  const router = Router();
  router.use(autenticar);

  router.post(
    '/recepcion/comprobantes',
    autorizar('Recepcion'),
    async (req: Request, res: Response) => {
      try {
        const solicitud: SolicitudEmitirComprobante = {
          pagoId: req.body.pagoId,
          citaId: req.body.citaId,
          tipo: req.body.tipo,
          serie: req.body.serie,
          rucCliente: req.body.rucCliente ?? null,
          razonSocial: req.body.razonSocial ?? null
        };
        const comprobante = await emitir.emitir(solicitud);
        res.status(201).json(aComprobanteDto(comprobante));
      } catch (error) {
        responderError(res, error);
      }
    }
  );

  router.get(
    '/recepcion/comprobantes',
    autorizar('Recepcion'),
    async (_req: Request, res: Response) => {
      try {
        const comprobantes = await listar.listar();
        res.json(comprobantes.map(aComprobanteDto));
      } catch (error) {
        responderError(res, error);
      }
    }
  );

  router.get(
    '/comprobantes/mis-comprobantes',
    autorizar('Paciente'),
    async (req: Request, res: Response) => {
      try {
        const { usuarioId } = req as SolicitudAutenticada;
        const comprobantes = await listarPorPaciente.listarPorPaciente(usuarioId as string);
        res.json(comprobantes.map(aComprobanteDto));
      } catch (error) {
        responderError(res, error);
      }
    }
  );

  router.get('/comprobantes', autorizar('Administrador'), async (_req: Request, res: Response) => {
    try {
      const comprobantes = await listar.listar();
      res.json(comprobantes.map(aComprobanteDto));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.get(
    '/comprobantes/:id',
    autorizar('Recepcion', 'Administrador'),
    async (req: Request, res: Response) => {
      try {
        const comprobante = await obtener.obtener(req.params.id);
        res.json(aComprobanteDto(comprobante!));
      } catch (error) {
        responderError(res, error);
      }
    }
  );

  router.post(
    '/comprobantes/:id/anular',
    autorizar('Recepcion', 'Administrador'),
    async (req: Request, res: Response) => {
      try {
        await anular.anular(req.params.id);
        res.status(204).send();
      } catch (error) {
        responderError(res, error);
      }
    }
  );

  return router;
}
