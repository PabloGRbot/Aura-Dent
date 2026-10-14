import { Request, Response } from "express";
import { GestionarPoliticas } from "../../../../application/use-cases/GestionarPoliticas";

export class PoliticaController {
  constructor(private gestion: GestionarPoliticas) {}

  // GET /api/politicas  (público: solo activas)
  listar = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.gestion.listar());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // GET /api/politicas/todas  (administración)
  listarTodas = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.gestion.listarTodas());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // POST /api/politicas
  crear = async (req: Request, res: Response): Promise<void> => {
    try {
      const { titulo, contenido, tipo } = req.body;
      res.status(201).json(await this.gestion.crear({ titulo, contenido, tipo }));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // PUT /api/politicas/:id
  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.gestion.actualizar(Number(req.params.id), req.body));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // DELETE /api/politicas/:id (borrado lógico)
  desactivar = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.gestion.desactivar(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // GET /api/politicas/contacto
  contacto = async (_req: Request, res: Response): Promise<void> => {
    try {
      const contacto = await this.gestion.contacto();
      if (!contacto) {
        res.status(404).json({ error: "No hay datos de contacto" });
        return;
      }
      res.json(contacto);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // PUT /api/politicas/contacto
  actualizarContacto = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.gestion.actualizarContacto(req.body));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
