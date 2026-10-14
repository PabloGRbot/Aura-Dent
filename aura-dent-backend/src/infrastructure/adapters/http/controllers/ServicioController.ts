import { Request, Response } from "express";
import { GestionarServicios } from "../../../../application/use-cases/GestionarServicios";

export class ServicioController {
  constructor(private gestion: GestionarServicios) {}

  listar = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.gestion.listar());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const servicio = await this.gestion.crear(req.body);
      res.status(201).json(servicio);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const servicio = await this.gestion.actualizar(
        Number(req.params.id),
        req.body,
      );
      res.json(servicio);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  desactivar = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.gestion.desactivar(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
