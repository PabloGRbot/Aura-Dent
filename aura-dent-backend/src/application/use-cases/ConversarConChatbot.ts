import { AiService } from "../../domain/ports/AiService";
import {
  BaseConocimiento,
  ChatbotRepository,
} from "../../domain/ports/ChatbotRepository";

export interface ConversarDTO {
  sesionId: string;
  mensaje: string;
  usuarioId: string | null;
}

export interface RespuestaChat {
  respuesta: string;
  intencion: string;
  sugerirAgendar: boolean;
}

const STOPWORDS = new Set([
  "que",
  "como",
  "cual",
  "cuales",
  "donde",
  "cuando",
  "por",
  "para",
  "con",
  "los",
  "las",
  "del",
  "una",
  "uno",
  "unos",
  "unas",
  "hay",
  "puedo",
  "tiene",
  "tienen",
  "hay",
  "sobre",
  "hola",
  "buenas",
  "buenos",
  "dias",
  "tardes",
  "noches",
  "gracias",
  "porfa",
  "porfavor",
]);

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokenizar(texto: string): string[] {
  return normalizar(texto)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Caso de uso RF01: el asistente virtual responde consultas informativas
 * usando la base de conocimiento estática (RD10) y registra la conversación
 * en la bitácora (RD07). No accede a tablas operativas de citas ni pagos.
 */
export class ConversarConChatbot {
  constructor(
    private chatbotRepo: ChatbotRepository,
    private aiService?: AiService,
  ) {}

  async ejecutar(data: ConversarDTO): Promise<RespuestaChat> {
    const mensaje = (data.mensaje || "").trim();
    const base = await this.chatbotRepo.listarBase(true);

    const coincide = this.mejorCoincidencia(mensaje, base);
    const intencion = this.detectarIntencion(mensaje, coincide);

    let respuesta: string | null = null;

    // 1. Motor de PLN/LLM (si está configurado)
    if (this.aiService) {
      respuesta = await this.aiService.responder(
        mensaje,
        this.construirContexto(base),
      );
    }

    // 2. Respaldo local: coincidencia sobre la base de conocimiento
    if (!respuesta) {
      respuesta = this.responderLocal(mensaje, coincide);
    }

    const sugerirAgendar = this.deseaAgendar(mensaje);

    await this.chatbotRepo.registrarBitacora({
      usuarioId: data.usuarioId,
      sesionId: data.sesionId,
      mensajeUsuario: mensaje,
      respuestaIa: respuesta,
      intencion,
    });

    return { respuesta, intencion, sugerirAgendar };
  }

  private construirContexto(base: BaseConocimiento[]): string {
    if (base.length === 0) return "(sin información registrada)";
    return base
      .map(
        (b) =>
          `- P: ${b.pregunta}\n  R: ${b.respuesta}${
            b.categoria ? `\n  Categoría: ${b.categoria}` : ""
          }`,
      )
      .join("\n");
  }

  private mejorCoincidencia(
    consulta: string,
    base: BaseConocimiento[],
  ): BaseConocimiento | null {
    const qTokens = tokenizar(consulta);
    const qNorm = normalizar(consulta);
    let mejor: BaseConocimiento | null = null;
    let mejorScore = 0;

    for (const entrada of base) {
      const pNorm = normalizar(entrada.pregunta);
      let score = 0;

      const pTokens = tokenizar(entrada.pregunta);
      const cTokens = tokenizar(entrada.categoria || "");

      for (const t of qTokens) {
        if (pTokens.includes(t)) score += 3;
        if (cTokens.includes(t)) score += 2;
      }

      // Coincidencia por subcadena (frases completas)
      if (qNorm.length > 5 && pNorm.includes(qNorm)) score += 4;
      if (pNorm.length > 5 && qNorm.includes(pNorm)) score += 4;

      if (score > mejorScore) {
        mejorScore = score;
        mejor = entrada;
      }
    }

    return mejorScore >= 2 ? mejor : null;
  }

  private responderLocal(
    consulta: string,
    coincide: BaseConocimiento | null,
  ): string {
    if (coincide) return coincide.respuesta;

    const n = normalizar(consulta);

    if (/\b(hola|buenas|buenos dias|buenas tardes|buenas noches)\b/.test(n)) {
      return "¡Hola! Soy Aura 🦷. Puedo informarte sobre horarios, ubicación, servicios, precios y políticas de la clínica. ¿Qué deseas saber?";
    }
    if (/\b(gracias|muchas gracias)\b/.test(n)) {
      return "¡Con gusto! Si deseas reservar una cita, usa el módulo «Agendar cita» del menú. 😊";
    }
    if (this.deseaAgendar(consulta)) {
      return "Para reservar una cita, ingresa al módulo «Agendar cita», elige el servicio, al odontólogo, la fecha y la hora disponibles. Recuerda que el turno se confirma con el pago del monto de reserva.";
    }

    return "No encontré esa información en mi base de conocimiento. Puedo ayudarte con horarios, ubicación, servicios, precios y políticas. Para agendar una cita, usa el módulo «Agendar cita».";
  }

  private detectarIntencion(
    consulta: string,
    coincide: BaseConocimiento | null,
  ): string {
    if (coincide?.categoria) return coincide.categoria;
    if (this.deseaAgendar(consulta)) return "Agendamiento";
    const n = normalizar(consulta);
    if (/\b(hola|buenas|buenos dias|buenas tardes|buenas noches)\b/.test(n))
      return "Saludo";
    if (/gracias/.test(n)) return "Agradecimiento";
    return "General";
  }

  private deseaAgendar(consulta: string): boolean {
    return /\b(agendar|reservar|cita|citas|turno|disponibilidad|horario de atencion)\b/.test(
      normalizar(consulta),
    );
  }
}
