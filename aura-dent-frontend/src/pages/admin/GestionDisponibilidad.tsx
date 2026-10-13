import { useEffect, useState } from "react";
import { api } from "../../api/axiosClient";

export const GestionDisponibilidad = () => {
  const [odontologos, setOdontologos] = useState<any[]>([]);
  const [sel, setSel] = useState("");
  const [disps, setDisps] = useState<any[]>([]);
  const [form, setForm] = useState({
    diaSemana: 1,
    horaInicio: "09:00",
    horaFin: "13:00",
  });

  useEffect(() => {
    api
      .get("/odontologos")
      .then((r) => {
        setOdontologos(r.data);
        if (r.data[0]) setSel(r.data[0].id);
      })
      .catch(() => setOdontologos([]));
  }, []);

  const cargar = async () => {
    if (!sel) return;
    try {
      const r = await api.get(`/disponibilidad/${sel}`);
      setDisps(r.data);
    } catch {
      setDisps([]);
    }
  };

  useEffect(() => {
    cargar();
  }, [sel]);

  const crear = async () => {
    try {
      await api.post(`/disponibilidad/${sel}`, form);
      cargar();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error");
    }
  };

  const DIAS = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        📅 Disponibilidad médica
      </h1>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl mb-4">
        <label className="block mb-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Odontólogo
          </span>
          <select
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            {odontologos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.numero_colegiatura || o.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-3 gap-2">
          <select
            value={form.diaSemana}
            onChange={(e) =>
              setForm({ ...form, diaSemana: Number(e.target.value) })
            }
            className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            {DIAS.map((d, i) => (
              <option key={i} value={i + 1}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={form.horaInicio}
            onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
            className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
          <input
            type="time"
            value={form.horaFin}
            onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
            className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>

        <button
          onClick={crear}
          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-semibold"
        >
          ➕ Agregar bloque
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow divide-y dark:divide-slate-700">
        {disps.length === 0 ? (
          <p className="p-6 text-center text-slate-500">
            Sin bloques de disponibilidad
          </p>
        ) : (
          disps.map((d) => (
            <div key={d.id} className="p-3 flex justify-between">
              <span className="font-medium">{DIAS[d.diaSemana - 1]}</span>
              <span className="text-slate-500">
                {d.horaInicio} — {d.horaFin}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
