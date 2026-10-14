import { Usuario } from '../../modelos/usuario';

export interface SesionAutenticacion {
  token: string;
  usuario: Usuario;
}

export interface LoginPuerto {
  login(email: string, password: string): Promise<SesionAutenticacion>;
}

export interface ObtenerPerfilPuerto {
  obtenerPerfil(usuarioId: string): Promise<Usuario>;
}
