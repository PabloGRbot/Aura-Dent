import { Request, Response } from "express";
import { GestionarDisponibilidad } from "../../../../application/use-cases/GestionarDisponibilidad";

export class DisponibilidadController {
  constructor(private gestion: GestionarDisponibilidad) {}

  // GET /api/disponibilidad/:odontologoId
  listar = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.gestion.listar(req.params.odontologoId));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // POST /api/disponibilidad/:odontologoId
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const bloque = await this.gestion.crear(
        req.params.odontologoId,
        req.body,
      );
      res.status(201).json(bloque);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // DELETE /api/disponibilidad/bloque/:id
  desactivar = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.gestion.desactivar(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
