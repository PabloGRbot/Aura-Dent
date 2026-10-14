import { Request, RequestHandler, Response, Router } from 'express';
import {
  ActualizarConfiguracionPuerto,
  ObtenerConfiguracionPuerto
} from '../../../../dominio/puertos/entrada/configuracion_puerto';
import { autorizar } from '../middlewares/autenticacion_middleware';

export function crearConfiguracionControlador(
  obtener: ObtenerConfiguracionPuerto,
  actualizar: ActualizarConfiguracionPuerto,
  autenticar: RequestHandler
): Router {
  const router = Router();

  router.get('/configuracion', async (_req: Request, res: Response) => {
    try {
      res.json(await obtener.obtener());
    } catch (error) {
      res.status(500).json({ mensaje: (error as Error).message });
    }
  });

  router.put(
    '/configuracion',
    autenticar,
    autorizar('Administrador'),
    async (req: Request, res: Response) => {
      try {
        res.json(await actualizar.actualizar(req.body));
      } catch (error) {
        res.status(400).json({ mensaje: (error as Error).message });
      }
    }
  );

  return router;
}
