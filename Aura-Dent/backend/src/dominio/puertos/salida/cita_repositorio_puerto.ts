import { CitaMedica } from '../../modelos/cita_medica';

export interface CitaAgendaItem {
  cita: CitaMedica;
  pacienteNombre: string;
  pacienteDni: string;
}

export interface CitaRepositorioPuerto {
  buscarPorId(id: string): Promise<CitaMedica | null>;
  listarPorPaciente(pacienteId: string): Promise<CitaMedica[]>;
  listarParaAgenda(): Promise<CitaAgendaItem[]>;
  listarTodas(): Promise<CitaAgendaItem[]>;
  buscarPorOdontologoYFecha(odontologoId: string, fecha: Date): Promise<CitaMedica[]>;
  existeConflicto(odontologoId: string, fecha: Date, duracionMinutos: number): Promise<boolean>;
  guardar(cita: CitaMedica): Promise<void>;
  actualizar(cita: CitaMedica): Promise<void>;
}
