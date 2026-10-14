export interface PoliticaClinica {
  id: number;
  titulo: string;
  contenido: string;
  tipo: string | null;
  activo: boolean;
}

export interface DatosContacto {
  id: number;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  horario_atencion: string | null;
}

/**
 * Puerto de persistencia para los datos estáticos de la clínica (RD09):
 * políticas y datos de contacto que la web muestra y el chatbot consulta.
 */
export interface PoliticaRepository {
  listarPoliticas(): Promise<PoliticaClinica[]>;
  listarTodas(): Promise<PoliticaClinica[]>;
  buscarPoliticaPorId(id: number): Promise<PoliticaClinica | null>;
  crearPolitica(data: {
    titulo: string;
    contenido: string;
    tipo: string | null;
  }): Promise<PoliticaClinica>;
  actualizarPolitica(
    id: number,
    data: {
      titulo?: string;
      contenido?: string;
      tipo?: string | null;
      activo?: boolean;
    },
  ): Promise<PoliticaClinica>;
  desactivarPolitica(id: number): Promise<void>;
  actualizarContacto(data: {
    direccion?: string;
    telefono?: string;
    email?: string;
    horarioAtencion?: string;
  }): Promise<DatosContacto>;
  obtenerContacto(): Promise<DatosContacto | null>;
}
