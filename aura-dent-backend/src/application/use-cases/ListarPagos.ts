import { PagoRepository } from "../../domain/ports/PagoRepository";

export class ListarPagos {
  constructor(private pagoRepo: PagoRepository) {}

  async todos() {
    return this.pagoRepo.listar();
  }

  async porCita(citaId: string) {
    return this.pagoRepo.buscarPorCita(citaId);
  }
}
