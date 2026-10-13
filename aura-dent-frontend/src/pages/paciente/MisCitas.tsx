import { useEffect, useState } from "react";
import { citasApi } from "../../api/citasApi";
import type { Cita } from "../../types";

const ESTADOS: Record<number, { label: string; color: string }> = {
  1: { label: "Pendiente pago", color: "bg-yellow-100 text-yellow-800" },
  2: { label: "Retenido", color: "bg-orange-100 text-orange-800" },
  3: { label: "Confirmada", color: "bg-green-100 text-green-800" },
  4: { label: "Cancelada", color: "bg-red-100 text-red-800" },
  5: { label: "Expirada", color: "bg-slate-100 text-slate-700" },
  6: { label: "Atendida", color: "bg-blue-100 text-blue-800" },
};

export const MisCitas = () => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      setCitas(await citasApi.misCitas());
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const cancelar = async (id: string) => {
    if (!confirm("¿Cancelar esta cita?")) return;
    try {
      await citasApi.cancelar(id, "Cancelada por paciente");
      cargar();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al cancelar");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        📋 Mis citas
      </h1>

      {cargando ? (
        <p className="text-slate-500">Cargando...</p>
      ) : citas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center text-slate-500">
          No tienes citas registradas.
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map((c) => {
            const e = ESTADOS[c.estadoId] || ESTADOS[1];
            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {c.codigoReserva}
                  </p>
                  <p className="text-sm text-slate-500">
                    📅 {c.fecha} — {c.horaInicio} a {c.horaFin}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${e.color}`}
                  >
                    {e.label}
                  </span>
                  {c.estadoId === 3 && (
                    <button
                      onClick={() => cancelar(c.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
