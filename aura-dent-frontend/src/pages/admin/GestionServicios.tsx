import { useEffect, useState, FormEvent } from "react";
import { serviciosApi } from "../../api/serviciosApi";
import type { Servicio } from "../../types";

const VACIO: Partial<Servicio> = {
  nombre: "",
  descripcion: "",
  precio: 0,
  duracionMinutos: 30,
  montoReserva: 20,
  especialidadId: null,
};

export const GestionServicios = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [form, setForm] = useState<Partial<Servicio>>(VACIO);
  const [editando, setEditando] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const cargar = async () => {
    try {
      setServicios(await serviciosApi.listar());
    } catch {
      setServicios([]);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editando) {
        await serviciosApi.actualizar(editando, form);
        setMsg("✅ Servicio actualizado");
      } else {
        await serviciosApi.crear(form);
        setMsg("✅ Servicio creado");
      }
      setForm(VACIO);
      setEditando(null);
      cargar();
    } catch (err: any) {
      setMsg("❌ " + (err.response?.data?.error || "Error"));
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Desactivar este servicio?")) return;
    await serviciosApi.desactivar(id);
    cargar();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        🦷 Gestión de servicios
      </h1>

      {msg && (
        <div className="bg-blue-100 text-blue-800 p-3 rounded-lg mb-4">
          {msg}
        </div>
      )}

      <form
        onSubmit={guardar}
        className="bg-white dark:bg-slate-800 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <input
          placeholder="Nombre"
          required
          value={form.nombre || ""}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
        <input
          placeholder="Descripción"
          value={form.descripcion || ""}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
          className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
        <input
          type="number"
          placeholder="Precio"
          value={form.precio || 0}
          onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })}
          className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
        <input
          type="number"
          placeholder="Duración (min)"
          value={form.duracionMinutos || 0}
          onChange={(e) =>
            setForm({ ...form, duracionMinutos: Number(e.target.value) })
          }
          className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
        <input
          type="number"
          placeholder="Monto reserva"
          value={form.montoReserva || 0}
          onChange={(e) =>
            setForm({ ...form, montoReserva: Number(e.target.value) })
          }
          className="p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-semibold">
          {editando ? "Actualizar" : "Crear servicio"}
        </button>
      </form>

      <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-700">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Precio</th>
              <th className="p-3 text-left">Duración</th>
              <th className="p-3 text-left">Reserva</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map((s) => (
              <tr key={s.id} className="border-t dark:border-slate-700">
                <td className="p-3 font-medium text-slate-800 dark:text-white">
                  {s.nombre}
                </td>
                <td className="p-3">S/ {s.precio}</td>
                <td className="p-3">{s.duracionMinutos} min</td>
                <td className="p-3">S/ {s.montoReserva}</td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => {
                      setEditando(s.id);
                      setForm(s);
                    }}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminar(s.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
