/**
 * Puerto para el motor de IA / PLN que interpreta las consultas
 * informativas del paciente usando la base de conocimiento estática.
 */
export interface AiService {
  /**
   * Genera una respuesta en lenguaje natural a partir de la consulta y el
   * contexto (base de conocimiento). Devuelve null si el motor no está
   * disponible o no configurado, para permitir un respaldo local.
   */
  responder(consulta: string, contexto: string): Promise<string | null>;
}
