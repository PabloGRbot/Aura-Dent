import { Request, RequestHandler, Response, Router } from 'express';
import { Rol, Usuario } from '../../../../dominio/modelos/usuario';
import {
  ActualizarUsuarioPuerto,
  CrearUsuarioPuerto,
  EliminarUsuarioPuerto,
  ListarUsuariosPuerto
} from '../../../../dominio/puertos/entrada/gestion_usuarios_puerto';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';
import { autorizar } from '../middlewares/autenticacion_middleware';

function aUsuarioDto(usuario: Usuario) {
  return {
    id: usuario.id,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    dniCe: usuario.dniCe,
    fechaNacimiento: usuario.fechaNacimiento,
    alergias: usuario.alergias,
    rol: usuario.rol
  };
}

const ESTADOS_ERROR: Record<string, number> = {
  USUARIO_NO_ENCONTRADO: 404,
  EMAIL_DUPLICADO: 409,
  DUPLICADO: 409,
  USUARIO_EN_USO: 409,
  DATOS_INVALIDOS: 400
};

function responderError(res: Response, error: unknown): void {
  const codigo = error instanceof ErrorAplicacion ? error.codigo : 'ERROR';
  const estado = ESTADOS_ERROR[codigo] ?? 400;
  res.status(estado).json({ mensaje: (error as Error).message });
}

export function crearUsuariosControlador(
  listar: ListarUsuariosPuerto,
  crear: CrearUsuarioPuerto,
  actualizar: ActualizarUsuarioPuerto,
  eliminar: EliminarUsuarioPuerto,
  autenticar: RequestHandler
): Router {
  const router = Router();
  router.use('/usuarios', autenticar, autorizar('Administrador'));

  router.get('/usuarios', async (_req: Request, res: Response) => {
    try {
      const usuarios = await listar.listar();
      res.json(usuarios.map(aUsuarioDto));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post('/usuarios', async (req: Request, res: Response) => {
    try {
      const usuario = await crear.crear({
        nombres: req.body.nombres,
        apellidos: req.body.apellidos,
        email: req.body.email,
        password: req.body.password,
        dniCe: req.body.dniCe,
        fechaNacimiento: req.body.fechaNacimiento ? new Date(req.body.fechaNacimiento) : null,
        alergias: req.body.alergias ?? null,
        rol: req.body.rol as Rol
      });
      res.status(201).json(aUsuarioDto(usuario));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.put('/usuarios/:id', async (req: Request, res: Response) => {
    try {
      const usuario = await actualizar.actualizar(req.params.id, {
        nombres: req.body.nombres,
        apellidos: req.body.apellidos,
        email: req.body.email,
        password: req.body.password || undefined,
        dniCe: req.body.dniCe,
        fechaNacimiento:
          req.body.fechaNacimiento === undefined
            ? undefined
            : req.body.fechaNacimiento
              ? new Date(req.body.fechaNacimiento)
              : null,
        alergias: req.body.alergias,
        rol: req.body.rol as Rol | undefined
      });
      res.json(aUsuarioDto(usuario));
    } catch (error) {
      responderError(res, error);
    }
  });

  router.delete('/usuarios/:id', async (req: Request, res: Response) => {
    try {
      await eliminar.eliminar(req.params.id);
      res.status(204).send();
    } catch (error) {
      responderError(res, error);
    }
  });

  return router;
}
