import { Usuario } from '../../modelos/usuario';

export interface UsuarioRepositorioPuerto {
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  listar(): Promise<Usuario[]>;
  guardar(usuario: Usuario): Promise<void>;
  actualizar(usuario: Usuario): Promise<void>;
  eliminar(id: string): Promise<void>;
}
