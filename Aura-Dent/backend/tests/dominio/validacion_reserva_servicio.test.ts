import { ReservaNoDisponibleExcepcion } from '../../src/dominio/excepciones/reserva_no_disponible_excepcion';
import { ValidacionReservaServicio } from '../../src/dominio/servicios/validacion_reserva_servicio';

describe('ValidacionReservaServicio', () => {
  const servicio = new ValidacionReservaServicio();

  it('rechaza fechas pasadas', () => {
    expect(() => servicio.validarFechaFutura(new Date(Date.now() - 1000))).toThrow(
      ReservaNoDisponibleExcepcion
    );
  });

  it('acepta fechas futuras', () => {
    expect(() => servicio.validarFechaFutura(new Date(Date.now() + 60000))).not.toThrow();
  });

  it('rechaza duraciones que no son múltiplo de 15', () => {
    expect(() => servicio.validarDuracion(20)).toThrow(ReservaNoDisponibleExcepcion);
  });

  it('acepta duraciones múltiplo de 15', () => {
    expect(() => servicio.validarDuracion(30)).not.toThrow();
  });

  it('rechaza horarios con conflicto', () => {
    expect(() => servicio.validarDisponibilidad(true)).toThrow(ReservaNoDisponibleExcepcion);
  });
});
