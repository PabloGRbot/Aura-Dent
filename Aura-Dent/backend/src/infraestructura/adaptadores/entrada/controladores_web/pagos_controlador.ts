import { Request, RequestHandler, Response, Router } from 'express';
import { autorizar } from '../middlewares/autenticacion_middleware';
import { ValidarPagoQrPuerto } from '../../../../dominio/puertos/entrada/pago_puerto';

export function crearPagosControlador(validarPagoQr: ValidarPagoQrPuerto,autenticar:RequestHandler): Router {
  const router = Router();

  router.post('/pagos/qr',autenticar,autorizar('Paciente'), async (req: Request, res: Response) => {
    try {
      const { citaId, referenciaQr } = req.body;
      const pago = await validarPagoQr.validarPagoQr(citaId, referenciaQr);
      res.json(pago);
    } catch (error) {
      res.status(400).json({ mensaje: (error as Error).message });
    }
  });

  return router;
}
