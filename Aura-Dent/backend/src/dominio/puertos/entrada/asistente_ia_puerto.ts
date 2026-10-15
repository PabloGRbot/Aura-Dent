import { Disponibilidad } from '../../modelos/disponibilidad';
import { MensajeAsistente } from '../../modelos/mensaje_asistente';

export interface ConsultaDisponibilidad {
  odontologoId: string;
  fecha: Date;
}

export interface ConsultarDisponibilidadPuerto {
  consultarDisponibilidad(consulta: ConsultaDisponibilidad): Promise<Disponibilidad>;
}

export interface ConsultaAsistente {
  mensaje: string;
  historial: MensajeAsistente[];
}

export interface ResponderConsultaPuerto {
  responder(consulta: ConsultaAsistente): Promise<string>;
}
