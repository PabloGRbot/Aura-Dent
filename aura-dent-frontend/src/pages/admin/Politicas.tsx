import { useEffect, useState } from "react";
import { api } from "../../api/axiosClient";

export const Politicas = () => {
  const [politicas, setPoliticas] = useState<any[]>([]);
  const [contacto, setContacto] = useState<any>(null);

  useEffect(() => {
    api
      .get("/politicas")
      .then((r) => setPoliticas(r.data))
      .catch(() => setPoliticas([]));
    api
      .get("/politicas/contacto")
      .then((r) => setContacto(r.data))
      .catch(() => setContacto(null));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        📜 Políticas de la clínica
      </h1>

      {contacto && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl mb-6 shadow">
          <h2 className="font-bold mb-2">📞 Datos de contacto</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            📍 {contacto.direccion}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            📱 {contacto.telefono}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            ✉️ {contacto.email}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            🕒 {contacto.horario_atencion}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {politicas.map((p) => (
          <div
            key={p.id}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow"
          >
            <h3 className="font-bold text-slate-800 dark:text-white">
              📌 {p.titulo}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {p.contenido}
            </p>
            <span className="text-xs text-blue-600 mt-2 inline-block">
              {p.tipo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
