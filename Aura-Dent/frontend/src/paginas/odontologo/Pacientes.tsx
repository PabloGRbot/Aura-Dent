import { useCallback, useEffect, useState } from 'react';
import { listarMisPacientes } from '../../api/odontologo';
import { useAutenticacion } from '../../contexto/ContextoAutenticacion';
import { PacienteRecepcion } from '../../api/recepcion';

export function PacientesOdontologo() {
  const { usuario } = useAutenticacion();
  const [pacientes, setPacientes] = useState<PacienteRecepcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      setPacientes(await listarMisPacientes());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <section className="panel">
      <h1>Mis pacientes</h1>
      <p className="subtitulo">
        Pacientes asignados a tu odontología.
      </p>
      {error && <p className="error">{error}</p>}
      {cargando ? (
        <p className="subtitulo">Cargando pacientes...</p>
      ) : pacientes.length === 0 ? (
        <p className="subtitulo">
          {usuario ? 'No tienes pacientes asignados.' : 'No se pudo identificar tu usuario.'}
        </p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>DNI/CE</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombres} {p.apellidos}</td>
                  <td>{p.dniCe}</td>
                  <td>{p.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
