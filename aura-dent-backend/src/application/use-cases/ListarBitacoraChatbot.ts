import {
  BitacoraEntrada,
  ChatbotRepository,
} from "../../domain/ports/ChatbotRepository";

/**
 * Caso de uso RD07: consulta de la bitácora de conversaciones del chatbot.
 * Es de solo lectura y no alimenta la lógica de agendamiento.
 */
export class ListarBitacoraChatbot {
  constructor(private chatbotRepo: ChatbotRepository) {}

  async ejecutar(limit = 200): Promise<BitacoraEntrada[]> {
    return this.chatbotRepo.listarBitacora(limit);
  }
}
