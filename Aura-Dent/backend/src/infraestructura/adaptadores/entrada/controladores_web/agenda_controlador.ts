import { Request, RequestHandler, Response, Router } from 'express';
import { NotaClinica } from '../../../../dominio/modelos/nota_clinica';
import {
  AgregarNotaPuerto,
  AsignarCitaPuerto,
  ListarAgendaPuerto,
  ListarNotasCitaPuerto,
  ListarNotasOdontologoPuerto
} from '../../../../dominio/puertos/entrada/gestion_agenda_puerto';
import { CitaAgendaItem } from '../../../../dominio/puertos/salida/cita_repositorio_puerto';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';
import { autorizar, SolicitudAutenticada } from '../middlewares/autenticacion_middleware';

function aAgendaDto(item: CitaAgendaItem) {
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

function aNotaDto(nota: NotaClinica) {
  return {
    id: nota.id,
    citaId: nota.citaId,
    odontologoId: nota.odontologoId,
    contenido: nota.contenido,
    creadoEn: nota.creadoEn
  };
}

const ESTADOS_ERROR: Record<string, number> = {
  CITA_NO_ENCONTRADA: 404,
  CITA_ASIGNADA: 409,
  ESTADO_INVALIDO: 409,
  DATOS_INVALIDOS: 400
};

function responderError(res: Response, error: unknown): void {
  const codigo = error instanceof ErrorAplicacion ? error.codigo : 'ERROR';
  res.status(ESTADOS_ERROR[codigo] ?? 400).json({ mensaje: (error as Error).message });
}

export function crearAgendaControlador(
  listarAgenda: ListarAgendaPuerto,
  asignarCita: AsignarCitaPuerto,
  agregarNota: AgregarNotaPuerto,
  listarNotasCita: ListarNotasCitaPuerto,
  listarNotasOdontologo: ListarNotasOdontologoPuerto,
  autenticar: RequestHandler
): Router {
  const router = Router();
  router.use('/citas', autenticar, autorizar('Odontologo'));

  router.get('/citas/agenda', async (_req: Request, res: Response) => {
    try {
      const agenda = await listarAgenda.listar();
      res.json(agenda.map(aAgendaDto));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.get('/citas/notas', async (req: Request, res: Response) => {
    try {
      const { usuarioId } = req as SolicitudAutenticada;
      const notas = await listarNotasOdontologo.listar(usuarioId as string);
      res.json(
        notas.map((nota) => ({
          ...aNotaDto(nota),
          pacienteNombre: nota.pacienteNombre,
          servicio: nota.servicio
        }))
      );
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post('/citas/:id/asignar', async (req: Request, res: Response) => {
    try {
      const { usuarioId } = req as SolicitudAutenticada;
      const cita = await asignarCita.asignar(usuarioId as string, req.params.id);
      res.json({
        id: cita.id,
        odontologoId: cita.odontologoId,
        estado: cita.estado
      });
    } catch (error) {
      responderError(res, error);
    }
  });

  router.get('/citas/:id/notas', async (req: Request, res: Response) => {
    try {
      const notas = await listarNotasCita.listar(req.params.id);
      res.json(notas.map(aNotaDto));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post('/citas/:id/notas', async (req: Request, res: Response) => {
    try {
      const { usuarioId } = req as SolicitudAutenticada;
      const nota = await agregarNota.agregar(usuarioId as string, req.params.id, req.body.contenido);
      res.status(201).json(aNotaDto(nota));
    } catch (error) {
      responderError(res, error);
    }
  });

  return router;
}
