import { CrearReservaTemporalCasoUso } from '../../src/aplicacion/casos_uso/reserva_citas/crear_reserva_temporal_caso_uso';
import { GeneradorId } from '../../src/compartido/generador_id';
import { CitaMedica } from '../../src/dominio/modelos/cita_medica';
import { CitaRepositorioPuerto } from '../../src/dominio/puertos/salida/cita_repositorio_puerto';
import { ValidacionReservaServicio } from '../../src/dominio/servicios/validacion_reserva_servicio';

class CitaRepositorioFalso implements CitaRepositorioPuerto {
  private readonly citas: CitaMedica[] = [];

  async buscarPorId(id: string): Promise<CitaMedica | null> {
    return this.citas.find((cita) => cita.id === id) ?? null;
  }

  async listarPorPaciente(pacienteId: string): Promise<CitaMedica[]> {
    return this.citas.filter((cita) => cita.pacienteId === pacienteId);
  }

  async buscarPorOdontologoYFecha(odontologoId: string, fecha: Date): Promise<CitaMedica[]> {
    return this.citas.filter(
      (cita) =>
        cita.odontologoId === odontologoId && cita.fecha.toDateString() === fecha.toDateString()
    );
  }

  async existeConflicto(): Promise<boolean> {
    return false;
  }

  async guardar(cita: CitaMedica): Promise<void> {
    this.citas.push(cita);
  }

  async actualizar(cita: CitaMedica): Promise<void> {
    const indice = this.citas.findIndex((existente) => existente.id === cita.id);
    if (indice >= 0) {
      this.citas[indice] = cita;
    }
  }
}

class GeneradorIdFalso implements GeneradorId {
  generar(): string {
    return 'reserva-1';
  }
}

describe('CrearReservaTemporalCasoUso', () => {
  it('crea una reserva temporal cuando no hay conflicto', async () => {
    const repositorio = new CitaRepositorioFalso();
    const casoUso = new CrearReservaTemporalCasoUso(
      repositorio,
      new ValidacionReservaServicio(),
      new GeneradorIdFalso()
    );

    const reserva = await casoUso.crearReservaTemporal({
      pacienteId: 'paciente-1',
      odontologoId: 'odontologo-1',
      fecha: new Date(Date.now() + 24 * 60 * 60 * 1000),
      duracionMinutos: 30
    });

    expect(reserva.reservaId).toBe('reserva-1');
    await expect(repositorio.buscarPorId('reserva-1')).resolves.not.toBeNull();
  });
});
