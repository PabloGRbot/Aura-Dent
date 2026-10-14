import { Request, Response, Router } from 'express';
import { ConsultarDisponibilidadPuerto } from '../../../../dominio/puertos/entrada/asistente_ia_puerto';

export function crearChatControlador(
  consultarDisponibilidad: ConsultarDisponibilidadPuerto
): Router {
  const router = Router();

  router.post('/asistente/disponibilidad', async (req: Request, res: Response) => {
    try {
      const { odontologoId, fecha } = req.body;
      const disponibilidad = await consultarDisponibilidad.consultarDisponibilidad({
        odontologoId,
        fecha: new Date(fecha)
      });
      res.json(disponibilidad);
    } catch (error) {
      res.status(400).json({ mensaje: (error as Error).message });
    }
  });

  return router;
}
