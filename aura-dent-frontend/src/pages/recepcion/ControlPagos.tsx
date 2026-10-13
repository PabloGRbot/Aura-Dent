import { useEffect, useState } from "react";
import { pagosApi } from "../../api/pagosApi";

export const ControlPagos = () => {
  const [pagos, setPagos] = useState<any[]>([]);

  useEffect(() => {
    pagosApi
      .listar()
      .then(setPagos)
      .catch(() => setPagos([]));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        💳 Control de pagos
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-700">
            <tr>
              <th className="p-3 text-left">Cita ID</th>
              <th className="p-3 text-left">Monto</th>
              <th className="p-3 text-left">Código Op.</th>
              <th className="p-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((p) => (
              <tr key={p.id} className="border-t dark:border-slate-700">
                <td className="p-3 font-mono text-xs">
                  {p.citaId.slice(0, 8)}...
                </td>
                <td className="p-3 font-semibold">S/ {p.monto}</td>
                <td className="p-3">{p.codigoOperacion || "—"}</td>
                <td className="p-3">{p.estadoId}</td>
              </tr>
            ))}
            {pagos.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">
                  No hay pagos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
