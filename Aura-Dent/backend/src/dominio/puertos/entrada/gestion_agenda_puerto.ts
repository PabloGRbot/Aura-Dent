import { CitaMedica } from '../../modelos/cita_medica';
import { NotaClinica } from '../../modelos/nota_clinica';
import { CitaAgendaItem } from '../salida/cita_repositorio_puerto';
import { NotaClinicaDetalle } from '../salida/nota_repositorio_puerto';

export interface ListarAgendaPuerto {
  listar(): Promise<CitaAgendaItem[]>;
}

export interface AsignarCitaPuerto {
  asignar(odontologoId: string, citaId: string): Promise<CitaMedica>;
}

export interface AgregarNotaPuerto {
  agregar(odontologoId: string, citaId: string, contenido: string): Promise<NotaClinica>;
}

export interface ListarNotasCitaPuerto {
  listar(citaId: string): Promise<NotaClinica[]>;
}

export interface ListarNotasOdontologoPuerto {
  listar(odontologoId: string): Promise<NotaClinicaDetalle[]>;
}
