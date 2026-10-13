export type RolNombre =
  | "Paciente"
  | "Recepcion"
  | "Odontologo"
  | "Administrador";

export class Usuario {
  constructor(
    public id: string,
    public rolId: number,
    public nombres: string,
    public apellidos: string,
    public documentoIdentidad: string,
    public telefono: string,
    public correo: string,
    public passwordHash: string,
    public activo: boolean = true,
  ) {}
}
