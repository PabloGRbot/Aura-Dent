import {
  BaseConocimiento,
  ChatbotRepository,
} from "../../domain/ports/ChatbotRepository";

/**
 * Caso de uso RF19: el Administrador administra la base de conocimiento
 * del chatbot (preguntas, respuestas y categorías).
 */
export class GestionarBaseConocimiento {
  constructor(private chatbotRepo: ChatbotRepository) {}

  async listar(): Promise<BaseConocimiento[]> {
    return this.chatbotRepo.listarBase(false);
  }

  async crear(data: {
    pregunta: string;
    respuesta: string;
    categoria?: string | null;
  }): Promise<BaseConocimiento> {
    if (!data.pregunta?.trim() || !data.respuesta?.trim()) {
      throw new Error("La pregunta y la respuesta son obligatorias");
    }
    return this.chatbotRepo.crearBase({
      pregunta: data.pregunta.trim(),
      respuesta: data.respuesta.trim(),
      categoria: data.categoria?.trim() || "General",
    });
  }

  async actualizar(
    id: number,
    data: Partial<BaseConocimiento>,
  ): Promise<BaseConocimiento> {
    const actualizada = await this.chatbotRepo.actualizarBase(id, {
      pregunta: data.pregunta,
      respuesta: data.respuesta,
      categoria: data.categoria,
      activo: data.activo,
    });
    if (!actualizada) throw new Error("Entrada no encontrada");
    return actualizada;
  }

  async desactivar(id: number): Promise<void> {
    const entrada = await this.chatbotRepo.buscarBasePorId(id);
    if (!entrada) throw new Error("Entrada no encontrada");
    return this.chatbotRepo.desactivarBase(id);
  }
}
