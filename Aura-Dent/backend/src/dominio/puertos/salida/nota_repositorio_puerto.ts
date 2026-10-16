import { NotaClinica } from '../../modelos/nota_clinica';

export interface NotaClinicaDetalle extends NotaClinica {
  pacienteNombre: string;
  servicio: string | null;
}

export interface NotaRepositorioPuerto {
  guardar(nota: NotaClinica): Promise<void>;
  buscarPorId(id: string): Promise<NotaClinica | null>;
  actualizar(nota: NotaClinica): Promise<void>;
  eliminar(id: string): Promise<void>;
  listarPorCita(citaId: string): Promise<NotaClinica[]>;
  listarPorOdontologo(odontologoId: string): Promise<NotaClinicaDetalle[]>;
}
