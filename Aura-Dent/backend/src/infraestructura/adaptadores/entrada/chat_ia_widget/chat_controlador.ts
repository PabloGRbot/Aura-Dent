import { Request, Response, Router } from 'express';
import {
  ConsultarDisponibilidadPuerto,
  ResponderConsultaPuerto
} from '../../../../dominio/puertos/entrada/asistente_ia_puerto';

export function crearChatControlador(
  consultarDisponibilidad: ConsultarDisponibilidadPuerto,
  responderConsulta: ResponderConsultaPuerto
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

  router.post('/asistente/pregunta', async (req: Request, res: Response) => {
    const { mensaje, historial } = req.body ?? {};
    if (typeof mensaje !== 'string' || !mensaje.trim() || mensaje.length > 1_000) {
      res.status(400).json({ mensaje: 'Debes enviar una consulta.' });
      return;
    }

    const historialSeguro = Array.isArray(historial)
      ? historial
          .slice(-12)
          .filter(
            (item): item is { autor: 'usuario' | 'bot'; texto: string } =>
              item &&
              (item.autor === 'usuario' || item.autor === 'bot') &&
              typeof item.texto === 'string' &&
              item.texto.length <= 1_000
          )
      : [];

    try {
      const respuesta = await responderConsulta.responder({
        mensaje,
        historial: historialSeguro
      });
      res.json({ respuesta });
    } catch (error) {
      res.status(502).json({ mensaje: (error as Error).message });
    }
  });

  return router;
}
