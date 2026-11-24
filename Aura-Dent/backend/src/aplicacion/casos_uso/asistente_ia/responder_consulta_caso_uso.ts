import { MensajeAsistente } from '../../../dominio/modelos/mensaje_asistente';
import {
  ConsultaAsistente,
  ResponderConsultaPuerto
} from '../../../dominio/puertos/entrada/asistente_ia_puerto';
import { IaTextoPuerto } from '../../../dominio/puertos/salida/ia_texto_puerto';
import { PROMPT_SISTEMA_ASISTENTE } from './contexto_asistente';
import { ConfiguracionRepositorioPuerto } from '../../../dominio/puertos/salida/configuracion_repositorio_puerto';

const MAX_LONGITUD_CONSULTA = 500;
const MAX_MENSAJES_HISTORIAL = 10;

export class ResponderConsultaCasoUso implements ResponderConsultaPuerto {
  constructor(private readonly iaTexto: IaTextoPuerto,private readonly configuracion?:ConfiguracionRepositorioPuerto) {}

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

    const config=await this.configuracion?.obtenerTodos();
    const horario=config ? `\nHorario vigente de Lima (prevalece sobre cualquier horario anterior): lunes a viernes ${config.hora_apertura ?? '08:00'} a ${config.hora_cierre ?? '20:00'}, almuerzo ${config.hora_inicio_almuerzo ?? '12:00'} a ${config.hora_fin_almuerzo ?? '14:00'}; sábados ${config.sabado_apertura ?? '08:00'} a ${config.sabado_cierre ?? '12:00'}; domingos ${config.domingo_cerrado==='false'?'según disponibilidad':'cerrado'}.` : '';
    const respuesta = await this.iaTexto.generarRespuesta(PROMPT_SISTEMA_ASISTENTE+horario, [
      ...historial,
      { autor: 'usuario', texto: mensaje }
    ]);

    return respuesta.trim();
  }
}
