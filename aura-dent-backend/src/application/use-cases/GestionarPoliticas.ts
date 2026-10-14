import {
  DatosContacto,
  PoliticaClinica,
  PoliticaRepository,
} from "../../domain/ports/PoliticaRepository";

/**
 * Caso de uso RD09: consulta y administración de las políticas de la clínica
 * y los datos de contacto registrados en tablas administrables.
 */
export class GestionarPoliticas {
  constructor(private politicaRepo: PoliticaRepository) {}

  async listar(): Promise<PoliticaClinica[]> {
    return this.politicaRepo.listarPoliticas();
  }

  async listarTodas(): Promise<PoliticaClinica[]> {
    return this.politicaRepo.listarTodas();
  }

  async crear(data: {
    titulo: string;
    contenido: string;
    tipo?: string | null;
  }): Promise<PoliticaClinica> {
    if (!data.titulo?.trim() || !data.contenido?.trim()) {
      throw new Error("El título y el contenido son obligatorios");
    }
    return this.politicaRepo.crearPolitica({
      titulo: data.titulo.trim(),
      contenido: data.contenido.trim(),
      tipo: data.tipo ?? null,
    });
  }

  async actualizar(
    id: number,
    data: {
      titulo?: string;
      contenido?: string;
      tipo?: string | null;
      activo?: boolean;
    },
  ): Promise<PoliticaClinica> {
    const politica = await this.politicaRepo.buscarPoliticaPorId(id);
    if (!politica) throw new Error("Política no encontrada");
    return this.politicaRepo.actualizarPolitica(id, data);
  }

  async desactivar(id: number): Promise<void> {
    await this.politicaRepo.desactivarPolitica(id);
  }

  async contacto(): Promise<DatosContacto | null> {
    return this.politicaRepo.obtenerContacto();
  }

  async actualizarContacto(data: {
    direccion?: string;
    telefono?: string;
    email?: string;
    horarioAtencion?: string;
  }): Promise<DatosContacto> {
    return this.politicaRepo.actualizarContacto(data);
  }
}
