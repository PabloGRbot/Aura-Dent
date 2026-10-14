import { useEffect, useState } from 'react';
import { obtenerAgenda } from '../../api/agenda';
import { CitaAgenda } from '../../tipos';

interface PacienteResumen {
  nombre: string;
  dni: string;
  atenciones: number;
  ultimoServicio: string | null;
}

export function PacientesOdontologo() {
  const [pacientes, setPacientes] = useState<PacienteResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    obtenerAgenda()
      .then((agenda) => setPacientes(resumirPacientes(agenda)))
      .catch((e) => setError((e as Error).message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <section className="panel">
      <h1>Pacientes</h1>
      <p className="subtitulo">Pacientes con citas confirmadas en la clínica.</p>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="subtitulo">Cargando pacientes...</p>
      ) : pacientes.length === 0 ? (
        <p className="subtitulo">Aún no hay pacientes con citas confirmadas.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>DNI/CE</th>
                <th>Atenciones</th>
                <th>Último servicio</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((paciente) => (
                <tr key={`${paciente.nombre}-${paciente.dni}`}>
                  <td>{paciente.nombre}</td>
                  <td>{paciente.dni}</td>
                  <td>{paciente.atenciones}</td>
                  <td>{paciente.ultimoServicio ?? 'Consulta general'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function resumirPacientes(agenda: CitaAgenda[]): PacienteResumen[] {
  const mapa = new Map<string, PacienteResumen>();
  for (const cita of agenda) {
    const clave = `${cita.pacienteNombre}-${cita.pacienteDni}`;
    const existente = mapa.get(clave);
    if (existente) {
      existente.atenciones += 1;
      existente.ultimoServicio = cita.servicio ?? existente.ultimoServicio;
    } else {
      mapa.set(clave, {
        nombre: cita.pacienteNombre,
        dni: cita.pacienteDni,
        atenciones: 1,
        ultimoServicio: cita.servicio
      });
    }
  }
  return Array.from(mapa.values());
}
