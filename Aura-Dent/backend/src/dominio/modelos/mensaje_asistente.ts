export type AutorMensaje = 'usuario' | 'bot';

export interface MensajeAsistente {
  autor: AutorMensaje;
  texto: string;
}
