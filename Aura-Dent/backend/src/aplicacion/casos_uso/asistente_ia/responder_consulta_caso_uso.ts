import { MensajeAsistente } from '../../../dominio/modelos/mensaje_asistente';
import {
  ConsultaAsistente,
  ResponderConsultaPuerto
} from '../../../dominio/puertos/entrada/asistente_ia_puerto';
import { IaTextoPuerto } from '../../../dominio/puertos/salida/ia_texto_puerto';
import { PROMPT_SISTEMA_ASISTENTE } from './contexto_asistente';

const MAX_LONGITUD_CONSULTA = 500;
const MAX_MENSAJES_HISTORIAL = 10;

export class ResponderConsultaCasoUso implements ResponderConsultaPuerto {
  constructor(private readonly iaTexto: IaTextoPuerto) {}

  async responder(consulta: ConsultaAsistente): Promise<string> {
    const mensaje = consulta.mensaje?.trim() ?? '';
    if (!mensaje) {
      throw new Error('La consulta no puede estar vacía.');
    }
    if (mensaje.length > MAX_LONGITUD_CONSULTA) {
      throw new Error('La consulta es demasiado larga.');
    }

    const historial = (consulta.historial ?? [])
      .filter((item) => item.texto?.trim())
      .slice(-MAX_MENSAJES_HISTORIAL) as MensajeAsistente[];

    const respuesta = await this.iaTexto.generarRespuesta(PROMPT_SISTEMA_ASISTENTE, [
      ...historial,
      { autor: 'usuario', texto: mensaje }
    ]);

    return respuesta.trim();
  }
}
