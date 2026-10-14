import { Request, RequestHandler, Response, Router } from 'express';
import { Usuario } from '../../../../dominio/modelos/usuario';
import {
  LoginPuerto,
  ObtenerPerfilPuerto
} from '../../../../dominio/puertos/entrada/autenticacion_puerto';
import { CrearUsuarioPuerto } from '../../../../dominio/puertos/entrada/gestion_usuarios_puerto';
import { ErrorAplicacion } from '../../../../compartido/error_aplicacion';
import { SolicitudAutenticada } from '../middlewares/autenticacion_middleware';

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

export function crearAutenticacionControlador(
  login: LoginPuerto,
  obtenerPerfil: ObtenerPerfilPuerto,
  crearUsuario: CrearUsuarioPuerto,
  autenticar: RequestHandler
): Router {
  const router = Router();

  router.post('/autenticacion/registro', async (req: Request, res: Response) => {
    try {
      const { nombres, apellidos, email, password, dniCe, fechaNacimiento, alergias } = req.body;

      await crearUsuario.crear({
        nombres,
        apellidos,
        email,
        password,
        dniCe,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        alergias: alergias || null,
        rol: 'Paciente'
      });

      const sesion = await login.login(email, password);
      res.status(201).json({ token: sesion.token, usuario: aUsuarioDto(sesion.usuario) });
    } catch (error) {
      const codigo = error instanceof ErrorAplicacion ? error.codigo : 'ERROR';
      const estado = codigo === 'EMAIL_DUPLICADO' || codigo === 'DUPLICADO' ? 409 : 400;
      res.status(estado).json({ mensaje: (error as Error).message });
    }
  });

  router.post('/autenticacion/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const sesion = await login.login(email, password);
      res.json({ token: sesion.token, usuario: aUsuarioDto(sesion.usuario) });
    } catch (error) {
      res.status(401).json({ mensaje: (error as Error).message });
    }
  });

  router.get('/usuarios/me', autenticar, async (req: Request, res: Response) => {
    try {
      const { usuarioId } = req as SolicitudAutenticada;
      const usuario = await obtenerPerfil.obtenerPerfil(usuarioId as string);
      res.json(aUsuarioDto(usuario));
    } catch (error) {
      res.status(404).json({ mensaje: (error as Error).message });
    }
  });

  return router;
}
