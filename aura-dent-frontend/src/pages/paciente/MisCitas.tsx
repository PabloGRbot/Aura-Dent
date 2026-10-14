import { useEffect, useState } from "react";
import { citasApi } from "../../api/citasApi";
import { ESTADOS_CITA as ESTADOS } from "../../utils/estados";
import { hoyLocalISO } from "../../utils/fechas";
import type { Cita } from "../../types";

export const MisCitas = () => {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [reprogId, setReprogId] = useState<string | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("09:00");
  const [enviando, setEnviando] = useState(false);

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

  const abrirReprogramar = (id: string) => {
    setReprogId(id);
    setNuevaFecha("");
    setNuevaHora("09:00");
  };

  const confirmarReprogramar = async (id: string) => {
    if (!nuevaFecha || !nuevaHora) {
      alert("Selecciona la nueva fecha y hora");
      return;
    }
    const [h, m] = nuevaHora.split(":").map(Number);
    const fin = `${String(h + 1).padStart(2, "0")}:${String(m).padStart(
      2,
      "0",
    )}`;
    setEnviando(true);
    try {
      await citasApi.reprogramar(id, {
        fecha: nuevaFecha,
        horaInicio: nuevaHora,
        horaFin: fin,
      });
      setReprogId(null);
      cargar();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al reprogramar");
    } finally {
      setEnviando(false);
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
                className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow"
              >
                <div className="flex justify-between items-center">
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
                      <>
                        <button
                          onClick={() => abrirReprogramar(c.id)}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          Reprogramar
                        </button>
                        <button
                          onClick={() => cancelar(c.id)}
                          className="text-red-600 text-sm hover:underline"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {reprogId === c.id && (
                  <div className="mt-3 pt-3 border-t dark:border-slate-700 flex flex-wrap items-end gap-3">
                    <label className="text-sm">
                      <span className="block text-slate-600 dark:text-slate-300">
                        Nueva fecha
                      </span>
                      <input
                        type="date"
                        value={nuevaFecha}
                        min={hoyLocalISO()}
                        onChange={(ev) => setNuevaFecha(ev.target.value)}
                        className="mt-1 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="block text-slate-600 dark:text-slate-300">
                        Nueva hora
                      </span>
                      <input
                        type="time"
                        value={nuevaHora}
                        onChange={(ev) => setNuevaHora(ev.target.value)}
                        className="mt-1 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </label>
                    <button
                      disabled={enviando}
                      onClick={() => confirmarReprogramar(c.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      {enviando ? "Guardando..." : "Confirmar"}
                    </button>
                    <button
                      onClick={() => setReprogId(null)}
                      className="text-slate-500 px-2 py-2 text-sm hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
