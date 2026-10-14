import {
  CitaConPago,
  ListarCitasPacientePuerto
} from '../../../dominio/puertos/entrada/reserva_cita_puerto';
import { CitaRepositorioPuerto } from '../../../dominio/puertos/salida/cita_repositorio_puerto';
import { PagoRepositorioPuerto } from '../../../dominio/puertos/salida/pago_repositorio_puerto';

export class ListarCitasPacienteCasoUso implements ListarCitasPacientePuerto {
  constructor(
    private readonly citaRepositorio: CitaRepositorioPuerto,
    private readonly pagoRepositorio: PagoRepositorioPuerto
  ) {}

  async listarPorPaciente(pacienteId: string): Promise<CitaConPago[]> {
    const citas = await this.citaRepositorio.listarPorPaciente(pacienteId);
    return Promise.all(
      citas.map(async (cita) => ({
        cita,
        pago: await this.pagoRepositorio.buscarPorCitaId(cita.id)
      }))
    );
  }
}
