import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { ConversarConChatbot } from "../../../../application/use-cases/ConversarConChatbot";
import { GestionarBaseConocimiento } from "../../../../application/use-cases/GestionarBaseConocimiento";
import { ListarBitacoraChatbot } from "../../../../application/use-cases/ListarBitacoraChatbot";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ChatbotController {
  constructor(
    private conversarUC: ConversarConChatbot,
    private baseUC: GestionarBaseConocimiento,
    private bitacoraUC: ListarBitacoraChatbot,
  ) {}

  // POST /api/chatbot/chat
  chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { sesionId, mensaje } = req.body;
      if (!mensaje?.trim()) {
        res.status(400).json({ error: "El mensaje es obligatorio" });
        return;
      }
      const sesion = UUID_RE.test(String(sesionId || ""))
        ? String(sesionId)
        : randomUUID();
      const resultado = await this.conversarUC.ejecutar({
        sesionId: sesion,
        mensaje,
        usuarioId: user?.id ?? null,
      });
      res.json(resultado);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // GET /api/chatbot/base
  listarBase = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.baseUC.listar());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // POST /api/chatbot/base
  crearBase = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(201).json(await this.baseUC.crear(req.body));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // PUT /api/chatbot/base/:id
  actualizarBase = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.baseUC.actualizar(Number(req.params.id), req.body));
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // DELETE /api/chatbot/base/:id
  desactivarBase = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.baseUC.desactivar(Number(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  // GET /api/chatbot/bitacora
  bitacora = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.json(await this.bitacoraUC.ejecutar());
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
