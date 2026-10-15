import { peticion } from './cliente';

export interface MensajeChat {
  autor: 'usuario' | 'bot';
  texto: string;
}

export function preguntarAsistente(
  mensaje: string,
  historial: MensajeChat[]
): Promise<{ respuesta: string }> {
  return peticion<{ respuesta: string }>('/api/asistente/pregunta', {
    method: 'POST',
    body: JSON.stringify({ mensaje, historial })
  });
}
