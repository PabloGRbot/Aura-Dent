import { OdontologoRepository } from "../../domain/ports/OdontologoRepository";

export class GestionarOdontologos {
  constructor(private odontologoRepo: OdontologoRepository) {}

  async listar(): Promise<any[]> {
    return this.odontologoRepo.listar();
  }

  async obtener(id: string): Promise<any> {
    const o = await this.odontologoRepo.buscarPorId(id);
    if (!o) throw new Error("Odontólogo no encontrado");
    return o;
  }
}
