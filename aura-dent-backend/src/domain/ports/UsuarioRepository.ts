import { Usuario } from "../entities/Usuario";

export interface UsuarioRepository {
  crear(usuario: Usuario): Promise<Usuario>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
  buscarPorDocumento(documento: string): Promise<Usuario | null>;
  listar(): Promise<Usuario[]>;
  actualizar(usuario: Usuario): Promise<Usuario>;
  desactivar(id: string): Promise<void>;
}
