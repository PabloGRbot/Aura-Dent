import { Request, Response } from "express";
import { GestionarPacientes } from "../../../../application/use-cases/GestionarPacientes";

export class PacienteController {
  constructor(private gestion: GestionarPacientes) {}

  listar = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.gestion.listar());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  crearManual = async (req: Request, res: Response): Promise<void> => {
    try {
      const paciente = await this.gestion.crearManual(req.body);
      res.status(201).json(paciente);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
