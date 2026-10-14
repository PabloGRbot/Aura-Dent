import { Disponibilidad } from '../../modelos/disponibilidad';

export interface ConsultaDisponibilidad {
  odontologoId: string;
  fecha: Date;
}

export interface ConsultarDisponibilidadPuerto {
  consultarDisponibilidad(consulta: ConsultaDisponibilidad): Promise<Disponibilidad>;
}
