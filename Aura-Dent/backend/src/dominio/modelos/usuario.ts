export type Rol = 'Paciente' | 'Recepcion' | 'Odontologo' | 'Administrador';

export class Usuario {
  constructor(
    public readonly id: string,
    public nombres: string,
    public apellidos: string,
    public email: string,
    public passwordHash: string,
    public dniCe: string,
    public fechaNacimiento: Date | null,
    public alergias: string | null,
    public rol: Rol
  ) {}

  get nombreCompleto(): string {
    return `${this.nombres} ${this.apellidos}`;
  }
}
