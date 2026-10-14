import { useEffect, useState } from "react";
import { citasApi } from "../../api/citasApi";
import { useAuth } from "../../auth/AuthContext";
import { hoyLocalISO } from "../../utils/fechas";
import { ESTADOS_CITA } from "../../utils/estados";
import type { Cita } from "../../types";

export const AgendaDiaria = () => {
  const { user } = useAuth();
  const [fecha, setFecha] = useState(hoyLocalISO());
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      setCitas(await citasApi.agendaOdontologo(user!.id, fecha));
    } catch {
      setCitas([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [fecha]);

  const marcarAtendida = async (id: string) => {
    try {
      await citasApi.marcarAtendida(id);
      cargar();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        🦷 Mi agenda diaria
      </h1>

      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className="mb-4 p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white"
      />

      {cargando ? (
        <p className="text-slate-500">Cargando agenda...</p>
      ) : citas.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center text-slate-500">
          No tienes citas para esta fecha.
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-blue-600">
                  {c.horaInicio} - {c.horaFin}
                </p>
                <p className="text-sm text-slate-500">
                  Código: {c.codigoReserva}
                </p>
                <p className="text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold ${
                      (ESTADOS_CITA[c.estadoId] || ESTADOS_CITA[1]).color
                    }`}
                  >
                    {(
                      ESTADOS_CITA[c.estadoId] || ESTADOS_CITA[1]
                    ).label}
                  </span>
                </p>
              </div>
              {c.estadoId === 3 && (
                <button
                  onClick={() => marcarAtendida(c.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  ✅ Marcar atendida
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
