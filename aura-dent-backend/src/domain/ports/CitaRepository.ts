import { Cita } from "../entities/Cita";

export interface CitaRepository {
  crear(cita: Cita): Promise<Cita>;
  buscarPorId(id: string): Promise<Cita | null>;
  buscarPorCodigo(codigo: string): Promise<Cita | null>;
  listarPorPaciente(pacienteId: string): Promise<Cita[]>;
  listarPorOdontologoYFecha(odontologoId: string, fecha: Date): Promise<Cita[]>;
  listarTodas(): Promise<Cita[]>;
  actualizar(cita: Cita): Promise<Cita>;
  buscarTurnoOcupado(
    odontologoId: string,
    fecha: Date,
    horaInicio: string,
    horaFin: string,
  ): Promise<Cita | null>;
  registrarHistorial(
    citaId: string,
    estadoAnterior: number | null,
    estadoNuevo: number,
    usuarioId: string | null,
    motivo: string | null,
  ): Promise<void>;
}
