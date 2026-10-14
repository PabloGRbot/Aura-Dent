import { Pool } from 'pg';
import { Rol, Usuario } from '../../../../dominio/modelos/usuario';
import { UsuarioRepositorioPuerto } from '../../../../dominio/puertos/salida/usuario_repositorio_puerto';

interface UsuarioFila {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  password_hash: string;
  dni_ce: string;
  fecha_nacimiento: Date | null;
  alergias: string | null;
  rol: Rol;
}

export class UsuarioPostgresRepositorio implements UsuarioRepositorioPuerto {
  constructor(private readonly pool: Pool) {}

  async buscarPorId(id: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query<UsuarioFila>(
      'SELECT * FROM usuarios WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows.length > 0 ? this.aDominio(rows[0]) : null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query<UsuarioFila>(
      'SELECT * FROM usuarios WHERE email = $1 LIMIT 1',
      [email]
    );
    return rows.length > 0 ? this.aDominio(rows[0]) : null;
  }

  async listar(): Promise<Usuario[]> {
    const { rows } = await this.pool.query<UsuarioFila>(
      'SELECT * FROM usuarios ORDER BY rol, apellidos, nombres'
    );
    return rows.map((fila) => this.aDominio(fila));
  }

  async guardar(usuario: Usuario): Promise<void> {
    await this.pool.query(
      `INSERT INTO usuarios (id, nombres, apellidos, email, password_hash, dni_ce, fecha_nacimiento, alergias, rol)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        usuario.id,
        usuario.nombres,
        usuario.apellidos,
        usuario.email,
        usuario.passwordHash,
        usuario.dniCe,
        usuario.fechaNacimiento,
        usuario.alergias,
        usuario.rol
      ]
    );
  }

  async actualizar(usuario: Usuario): Promise<void> {
    await this.pool.query(
      `UPDATE usuarios
        SET nombres = $1, apellidos = $2, email = $3, password_hash = $4,
            dni_ce = $5, fecha_nacimiento = $6, alergias = $7, rol = $8
        WHERE id = $9`,
      [
        usuario.nombres,
        usuario.apellidos,
        usuario.email,
        usuario.passwordHash,
        usuario.dniCe,
        usuario.fechaNacimiento,
        usuario.alergias,
        usuario.rol,
        usuario.id
      ]
    );
  }

  async eliminar(id: string): Promise<void> {
    await this.pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
  }

  private aDominio(fila: UsuarioFila): Usuario {
    return new Usuario(
      fila.id,
      fila.nombres,
      fila.apellidos,
      fila.email,
      fila.password_hash,
      fila.dni_ce,
      fila.fecha_nacimiento,
      fila.alergias,
      fila.rol
    );
  }
}
