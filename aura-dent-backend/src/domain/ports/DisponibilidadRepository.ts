export interface BloqueDisponibilidad {
  id: number;
  odontologoId: string;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  activo: boolean;
}

/**
 * Puerto de persistencia para la disponibilidad horaria médica (RD02 / RF09).
 */
export interface DisponibilidadRepository {
  listarPorOdontologo(odontologoId: string): Promise<BloqueDisponibilidad[]>;
  crear(
    odontologoId: string,
    data: { diaSemana: number; horaInicio: string; horaFin: string },
  ): Promise<BloqueDisponibilidad>;
  eliminar(id: number): Promise<void>;
}
