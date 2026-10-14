import { Servicio } from "../../domain/entities/Servicio";
import { ServicioRepository } from "../../domain/ports/ServicioRepository";

export class GestionarServicios {
  constructor(private servicioRepo: ServicioRepository) {}

  async crear(data: {
    nombre: string;
    descripcion: string;
    precio: number;
    duracionMinutos: number;
    montoReserva: number;
    especialidadId?: number | null;
  }): Promise<Servicio> {
    const servicio = new Servicio(
      0,
      data.nombre,
      data.descripcion,
      data.precio,
      data.duracionMinutos,
      data.montoReserva,
      data.especialidadId ?? null,
    );
    return this.servicioRepo.crear(servicio);
  }

  async listar(): Promise<Servicio[]> {
    return this.servicioRepo.listar();
  }

  async obtener(id: number): Promise<Servicio> {
    const s = await this.servicioRepo.buscarPorId(id);
    if (!s) throw new Error("Servicio no encontrado");
    return s;
  }

  async actualizar(id: number, data: Partial<Servicio>): Promise<Servicio> {
    const s = await this.obtener(id);
    Object.assign(s, data);
    return this.servicioRepo.actualizar(s);
  }

  async desactivar(id: number): Promise<void> {
    return this.servicioRepo.desactivar(id);
  }
}
