import { Request, Response } from "express";
import { GestionarOdontologos } from "../../../../application/use-cases/GestionarOdontologos";

export class OdontologoController {
  constructor(private gestion: GestionarOdontologos) {}

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
}
