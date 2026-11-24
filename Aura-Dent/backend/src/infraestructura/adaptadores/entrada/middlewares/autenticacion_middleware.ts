import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Pool } from 'pg';
import { contextoOperacion } from '../../salida/base_datos_postgres/contexto_operacion';
import { Rol } from '../../../../dominio/modelos/usuario';
import { TokenPuerto } from '../../../../dominio/puertos/salida/token_puerto';

export interface SolicitudAutenticada extends Request {
  usuarioId?: string;
  rol?: Rol;
}

export function crearAutenticador(token: TokenPuerto, pool?: Pool): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const encabezado = req.headers.authorization;
    if (!encabezado?.startsWith('Bearer ')) {
      res.status(401).json({ mensaje: 'No autenticado' });
      return;
    }

    try {
      const contenido = token.verificar(encabezado.slice(7));
      if(pool && !(await pool.query('SELECT 1 FROM usuarios WHERE id=$1 AND activo AND rol=$2',[contenido.sub,contenido.rol])).rowCount) {
        res.status(401).json({mensaje:'Cuenta desactivada o permisos actualizados. Inicia sesión nuevamente.'}); return;
      }
      const solicitud = req as SolicitudAutenticada;
      solicitud.usuarioId = contenido.sub;
      solicitud.rol = contenido.rol;
      const contexto=contextoOperacion.getStore();
      if(contexto){contexto.actorId=contenido.sub;contexto.rol=contenido.rol;}
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
