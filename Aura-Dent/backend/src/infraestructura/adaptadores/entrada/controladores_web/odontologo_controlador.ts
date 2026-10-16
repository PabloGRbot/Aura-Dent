import { Request, RequestHandler, Response, Router } from 'express';
import { Usuario } from '../../../../dominio/modelos/usuario';
import { ListarPacientesPorOdontologoPuerto } from '../../../../dominio/puertos/entrada/gestion_usuarios_puerto';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';
import { autorizar, SolicitudAutenticada } from '../middlewares/autenticacion_middleware';

const ESTADOS_ERROR: Record<string, number> = {
  DATOS_INVALIDOS: 400
};

function responderError(res: Response, error: unknown): void {
  const e = error as Error;
  const codigo = e instanceof ErrorAplicacion ? e.codigo : 'ERROR';
  res.status(ESTADOS_ERROR[codigo] ?? 400).json({ mensaje: e.message });
}

function aPacienteDto(usuario: Usuario) {
  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    dniCe: usuario.dniCe,
    rol: usuario.rol,
    odontologoAsignadoId: usuario.odontologoAsignadoId
  };
}

export function crearOdontologoControlador(
  listarPacientesPorOdontologo: ListarPacientesPorOdontologoPuerto,
  autenticar: RequestHandler
): Router {
  const router = Router();

  router.get(
    '/odontologo/mis-pacientes',
    autenticar,
    autorizar('Odontologo'),
    async (req: Request, res: Response) => {
      try {
        const { usuarioId } = req as SolicitudAutenticada;
        const pacientes = await listarPacientesPorOdontologo.listarPorOdontologo(usuarioId as string);
        res.json(pacientes.map(aPacienteDto));
      } catch (error) {
        responderError(res, error);
      }
    }
  );

  return router;
}
