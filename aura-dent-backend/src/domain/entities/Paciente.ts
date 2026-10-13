export class Paciente {
  constructor(
    public id: string,
    public usuarioId: string,
    public fechaNacimiento: Date | null,
    public direccion: string | null,
    public alergias: string | null,
  ) {}
}
