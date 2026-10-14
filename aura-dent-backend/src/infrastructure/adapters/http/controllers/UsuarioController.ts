import { Request, Response } from "express";
import { GestionarUsuarios } from "../../../../application/use-cases/GestionarUsuarios";
import { ActualizarPerfil } from "../../../../application/use-cases/ActualizarPerfil";

export class UsuarioController {
  constructor(
    private gestion: GestionarUsuarios,
    private actualizarPerfilUC?: ActualizarPerfil,
  ) {}

  listar = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.gestion.listar());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.gestion.obtener(req.params.id));
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = await this.gestion.crear(req.body);
      res.status(201).json(usuario);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  cambiarRol = async (req: Request, res: Response): Promise<void> => {
    try {
      const usuario = await this.gestion.cambiarRol(
        req.params.id,
        Number(req.body.rolId),
      );
      res.json(usuario);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  desactivar = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.gestion.desactivar(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // PUT /api/usuarios/perfil
  actualizarPerfil = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!this.actualizarPerfilUC) {
        res.status(500).json({ error: "Módulo no configurado" });
        return;
      }
      const user = (req as any).user;
      const usuario = await this.actualizarPerfilUC.ejecutar(user.id, req.body);
      res.json({
        id: usuario.id,
        rolId: usuario.rolId,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        telefono: usuario.telefono,
        correo: usuario.correo,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
