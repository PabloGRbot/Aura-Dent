import { AiService } from "../../../domain/ports/AiService";

/**
 * Adaptador de PLN/LLM basado en la API compatible con OpenAI (chat completions).
 * Si no hay una API key real configurada devuelve null y el caso de uso cae al
 * motor de coincidencia local (funciona sin conexión / sin costo).
 */
export class OpenAiService implements AiService {
  constructor(
    private apiKey: string,
    private endpoint: string,
    private model: string = "gpt-4o-mini",
  ) {}

  /** ¿Hay una API key real configurada (y no un placeholder del .env)? */
  estaConfigurado(): boolean {
    return this.configurado();
  }

  private configurado(): boolean {
    const key = (this.apiKey || "").trim();
    if (key.length < 20) return false;
    // Ignora claves de ejemplo del .env para caer al motor local sin hacer
    // llamadas de red que siempre fallarían (401) en cada mensaje.
    return !/(tu[-_ ]?api[-_ ]?key|tu[-_ ]?key|aqui|placeholder|example|ejemplo|changeme|change[-_ ]?me|xxxx)/i.test(
      key,
    );
  }

  async responder(consulta: string, contexto: string): Promise<string | null> {
    if (!this.configurado()) return null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          max_tokens: 350,
          messages: [
            {
              role: "system",
              content:
                "Eres Aura, el asistente virtual de una clínica dental. " +
                "Responde ÚNICAMENTE consultas informativas (horarios, ubicación, " +
                "servicios generales, políticas y preguntas frecuentes) usando " +
                "exclusivamente la base de conocimiento entregada. No agendes citas " +
                "ni consultes datos operativos. Si la respuesta no está en la base, " +
                "indícalo amablemente e invita a usar el módulo de agendamiento. " +
                "Sé breve y claro.\n\n=== BASE DE CONOCIMIENTO ===\n" +
                contexto,
            },
            { role: "user", content: consulta },
          ],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (!res.ok) return null;

      const data: any = await res.json();
      const texto = data?.choices?.[0]?.message?.content;
      return typeof texto === "string" && texto.trim() ? texto.trim() : null;
    } catch {
      return null;
    }
  }
}
