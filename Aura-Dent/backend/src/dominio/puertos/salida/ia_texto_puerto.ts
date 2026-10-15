import { MensajeAsistente } from '../../modelos/mensaje_asistente';

export interface IaTextoPuerto {
  generarRespuesta(sistema: string, mensajes: MensajeAsistente[]): Promise<string>;
}
