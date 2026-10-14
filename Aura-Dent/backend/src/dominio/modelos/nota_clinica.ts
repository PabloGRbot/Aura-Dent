export class NotaClinica {
  constructor(
    public readonly id: string,
    public readonly citaId: string,
    public readonly odontologoId: string,
    public readonly contenido: string,
    public readonly creadoEn: Date
  ) {}
}
