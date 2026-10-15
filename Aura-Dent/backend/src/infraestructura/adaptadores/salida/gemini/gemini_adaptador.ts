import { MensajeAsistente } from '../../../../dominio/modelos/mensaje_asistente';
import { IaTextoPuerto } from '../../../../dominio/puertos/salida/ia_texto_puerto';
import { variablesEntorno } from '../../../configuracion/variables_entorno';

const URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const TIEMPO_LIMITE_MS = 20000;

interface ParteGemini {
  text?: string;
  thought?: boolean;
}

interface RespuestaGemini {
  error?: { message?: string };
  candidates?: { content?: { parts?: ParteGemini[] } }[];
}

export class GeminiAdaptador implements IaTextoPuerto {
  async generarRespuesta(sistema: string, mensajes: MensajeAsistente[]): Promise<string> {
    const { apiKey, modelo } = variablesEntorno.gemini;
    if (!apiKey) {
      throw new Error('Falta la variable de entorno GEMINI_API_KEY.');
    }

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);

    try {
      const respuesta = await fetch(`${URL_BASE}/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sistema }] },
          contents: mensajes.map((mensaje) => ({
            role: mensaje.autor === 'usuario' ? 'user' : 'model',
            parts: [{ text: mensaje.texto }]
          })),
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 512
          }
        }),
        signal: controlador.signal
      });

      const datos = (await respuesta.json()) as RespuestaGemini;

      if (!respuesta.ok) {
        throw new Error(datos.error?.message ?? `Gemini respondió con estado ${respuesta.status}`);
      }

      const texto = (datos.candidates?.[0]?.content?.parts ?? [])
        .filter((parte) => !parte.thought && typeof parte.text === 'string')
        .map((parte) => parte.text)
        .join('')
        .trim();

      if (!texto) {
        throw new Error('Gemini no devolvió texto en la respuesta.');
      }

      return texto;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('El asistente tardó demasiado en responder.');
      }
      throw error;
    } finally {
      clearTimeout(temporizador);
    }
  }
}
