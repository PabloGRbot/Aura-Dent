import { useEffect, useState } from "react";
import { citasApi } from "../../api/citasApi";
import type { Cita } from "../../types";

export const PanelCitas = () => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [filtro, setFiltro] = useState("");

  useEffect(() => {
    citasApi
      .listarTodas()
      .then(setCitas)
      .catch(() => setCitas([]));
  }, []);

  const filtradas = citas.filter(
    (c) =>
      c.codigoReserva.toLowerCase().includes(filtro.toLowerCase()) ||
      c.fecha.includes(filtro),
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        📋 Panel global de citas
      </h1>

      <input
        placeholder="🔍 Buscar por código o fecha..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="w-full max-w-md p-2 border rounded-lg mb-4 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
      />

      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-700">
            <tr>
              <th className="p-3 text-left text-slate-700 dark:text-slate-200">
                Código
              </th>
              <th className="p-3 text-left text-slate-700 dark:text-slate-200">
                Fecha
              </th>
              <th className="p-3 text-left text-slate-700 dark:text-slate-200">
                Hora
              </th>
              <th className="p-3 text-left text-slate-700 dark:text-slate-200">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((c) => (
              <tr key={c.id} className="border-t dark:border-slate-700">
                <td className="p-3 text-slate-800 dark:text-white">
                  {c.codigoReserva}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-300">
                  {c.fecha}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-300">
                  {c.horaInicio}
                </td>
                <td className="p-3 text-slate-600 dark:text-slate-300">
                  {c.estadoId}
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">
                  No hay citas para mostrar
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
