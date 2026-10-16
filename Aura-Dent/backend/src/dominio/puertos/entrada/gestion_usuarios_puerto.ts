import { Rol, Usuario } from '../../modelos/usuario';

export interface SolicitudCrearUsuario {
  nombres: string;
  apellidos: string;
  email: string;
  password: string;
  dniCe: string;
  fechaNacimiento: Date | null;
  alergias: string | null;
  rol: Rol;
  odontologoAsignadoId?: string | null;
}

export interface SolicitudActualizarUsuario {
  nombres?: string;
  apellidos?: string;
  email?: string;
  password?: string;
  dniCe?: string;
  fechaNacimiento?: Date | null;
  alergias?: string | null;
  rol?: Rol;
  odontologoAsignadoId?: string | null;
}

export interface ListarUsuariosPuerto {
  listar(): Promise<Usuario[]>;
}

export interface ListarUsuariosPorRolPuerto {
  listarPorRol(rol: Rol): Promise<Usuario[]>;
}

export interface ListarPacientesPorOdontologoPuerto {
  listarPorOdontologo(odontologoId: string): Promise<Usuario[]>;
}

export interface CrearUsuarioPuerto {
  crear(solicitud: SolicitudCrearUsuario): Promise<Usuario>;
}

export interface ActualizarUsuarioPuerto {
  actualizar(id: string, solicitud: SolicitudActualizarUsuario): Promise<Usuario>;
}

export interface EliminarUsuarioPuerto {
  eliminar(id: string): Promise<void>;
}
