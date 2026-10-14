import { ReservaCitaPaciente } from '../componentes/ReservaCitaPaciente';

export function MisCitas() {
  return (
    <section className="panel">
      <h1>Mis citas</h1>
      <p className="subtitulo">Registra una nueva cita o revisa las que ya tienes.</p>
      <ReservaCitaPaciente />
    </section>
  );
}
