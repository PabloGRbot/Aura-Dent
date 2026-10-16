import { useEffect, useState } from 'react';
import { obtenerMisNotas, eliminarNota, actualizarNota } from '../../api/agenda';
import { formatearFecha } from '../../formato';
import { NotaClinicaDetalle } from '../../tipos';

export function NotasClinicas() {
  const [notas, setNotas] = useState<NotaClinicaDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEdicion, setTextoEdicion] = useState('');

  const cargar = async () => {
    try {
      const data = await obtenerMisNotas();
      setNotas(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  async function manejarBorrar(id: string) {
    if (!window.confirm('¿Eliminar esta nota clínica?')) return;
    try {
      await eliminarNota(id);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function manejarGuardarEdicion(id: string) {
    try {
      await actualizarNota(id, textoEdicion);
      setEditandoId(null);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="panel">
      <h1>Notas clínicas</h1>
      <p className="subtitulo">Historial de las atenciones y procedimientos que has registrado.</p>

      {error && <p className="error">{error}</p>}

      {cargando ? (
        <p className="subtitulo">Cargando notas...</p>
      ) : notas.length === 0 ? (
        <p className="subtitulo">Todavía no has registrado notas clínicas.</p>
      ) : (
        <div className="lista-notas lista-notas-ancha">
          {notas.map((nota) => (
            <article key={nota.id} className="nota-item">
              <div className="nota-encabezado">
                <strong>{nota.pacienteNombre}</strong>
                <span className="nota-fecha">{formatearFecha(nota.creadoEn)}</span>
              </div>
              <span className="dato-secundario">{nota.servicio ?? 'Consulta general'}</span>
              
              {editandoId === nota.id ? (
                <div className="edicion-nota">
                  <textarea 
                    value={textoEdicion} 
                    onChange={(e) => setTextoEdicion(e.target.value)}
                  />
                  <div className="modal-acciones">
                    <button onClick={() => setEditandoId(null)} className="boton-secundario">Cancelar</button>
                    <button onClick={() => manejarGuardarEdicion(nota.id)}>Guardar</button>
                  </div>
                </div>
              ) : (
                <>
                  <p>{nota.contenido}</p>
                  <div className="nota-acciones">
                    <button onClick={() => { setEditandoId(nota.id); setTextoEdicion(nota.contenido); }} className="boton-secundario">Editar</button>
                    <button onClick={() => manejarBorrar(nota.id)} className="boton-peligro">Borrar</button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
