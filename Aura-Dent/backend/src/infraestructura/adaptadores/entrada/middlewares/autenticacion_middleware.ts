import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Rol } from '../../../../dominio/modelos/usuario';
import { TokenPuerto } from '../../../../dominio/puertos/salida/token_puerto';

export interface SolicitudAutenticada extends Request {
  usuarioId?: string;
  rol?: Rol;
}

export function crearAutenticador(token: TokenPuerto): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const encabezado = req.headers.authorization;
    if (!encabezado?.startsWith('Bearer ')) {
      res.status(401).json({ mensaje: 'No autenticado' });
      return;
    }

    try {
      const contenido = token.verificar(encabezado.slice(7));
      const solicitud = req as SolicitudAutenticada;
      solicitud.usuarioId = contenido.sub;
      solicitud.rol = contenido.rol;
      next();
    } catch {
      res.status(401).json({ mensaje: 'Token inválido o expirado' });
    }
  };
}

export function autorizar(...roles: Rol[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const { rol } = req as SolicitudAutenticada;
    if (!rol || !roles.includes(rol)) {
      res.status(403).json({ mensaje: 'No autorizado' });
      return;
    }
    next();
  };
}
