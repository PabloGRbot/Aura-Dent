import { useEffect, useState } from "react";
import { api } from "../../api/axiosClient";

interface Politica {
  id: number;
  titulo: string;
  contenido: string;
  tipo: string | null;
  activo: boolean;
}

export const Politicas = () => {
  const [politicas, setPoliticas] = useState<Politica[]>([]);
  const [contacto, setContacto] = useState<any>(null);
  const [form, setForm] = useState({
    titulo: "",
    contenido: "",
    tipo: "otros",
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [editandoContacto, setEditandoContacto] = useState(false);

  const cargar = async () => {
    try {
      const [pol, con] = await Promise.all([
        api.get("/politicas/todas"),
        api.get("/politicas/contacto"),
      ]);
      setPoliticas(pol.data);
      setContacto(con.data);
    } catch {
      setPoliticas([]);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const limpiar = () => {
    setForm({ titulo: "", contenido: "", tipo: "otros" });
    setEditId(null);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      if (editId !== null) {
        await api.put(`/politicas/${editId}`, form);
        setMsg("Política actualizada");
      } else {
        await api.post("/politicas", form);
        setMsg("Política creada");
      }
      limpiar();
      cargar();
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar");
    }
  };

  const editar = (p: Politica) => {
    setEditId(p.id);
    setForm({ titulo: p.titulo, contenido: p.contenido, tipo: p.tipo || "otros" });
  };

  const desactivar = async (id: number) => {
    if (!confirm("¿Desactivar esta política?")) return;
    try {
      await api.delete(`/politicas/${id}`);
      cargar();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error");
    }
  };

  const guardarContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      await api.put("/politicas/contacto", {
        direccion: contacto.direccion,
        telefono: contacto.telefono,
        email: contacto.email,
        horarioAtencion: contacto.horario_atencion,
      });
      setEditandoContacto(false);
      setMsg("Datos de contacto actualizados");
      cargar();
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar contacto");
    }
  };

  const TIPOS = [
    "cancelacion",
    "reprogramacion",
    "puntualidad",
    "pagos",
    "otros",
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        📜 Políticas de la clínica
      </h1>

      {msg && (
        <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4">
          {msg}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Datos de contacto */}
      {contacto && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl mb-6 shadow">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold">📞 Datos de contacto</h2>
            <button
              onClick={() => setEditandoContacto((v) => !v)}
              className="text-blue-600 text-sm hover:underline"
            >
              {editandoContacto ? "Cerrar" : "Editar"}
            </button>
          </div>

          {editandoContacto ? (
            <form onSubmit={guardarContacto} className="space-y-2 text-sm">
              <input
                value={contacto.direccion || ""}
                onChange={(e) =>
                  setContacto({ ...contacto, direccion: e.target.value })
                }
                placeholder="Dirección"
                className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <input
                value={contacto.telefono || ""}
                onChange={(e) =>
                  setContacto({ ...contacto, telefono: e.target.value })
                }
                placeholder="Teléfono"
                className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <input
                value={contacto.email || ""}
                onChange={(e) =>
                  setContacto({ ...contacto, email: e.target.value })
                }
                placeholder="Correo"
                className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <input
                value={contacto.horario_atencion || ""}
                onChange={(e) =>
                  setContacto({
                    ...contacto,
                    horario_atencion: e.target.value,
                  })
                }
                placeholder="Horario de atención"
                className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
                Guardar contacto
              </button>
            </form>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {/* Formulario política */}
      <form
        onSubmit={guardar}
        className="bg-white dark:bg-slate-800 p-4 rounded-xl mb-6 shadow space-y-3"
      >
        <h2 className="font-bold">
          {editId !== null ? "✏️ Editar política" : "➕ Nueva política"}
        </h2>
        <input
          required
          value={form.titulo}
          onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          placeholder="Título"
          className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
        <textarea
          required
          value={form.contenido}
          onChange={(e) => setForm({ ...form, contenido: e.target.value })}
          placeholder="Contenido"
          rows={3}
          className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
        <select
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        >
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold">
            {editId !== null ? "Actualizar" : "Crear"}
          </button>
          {editId !== null && (
            <button
              type="button"
              onClick={limpiar}
              className="text-slate-500 px-3 py-2 hover:underline"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {politicas.map((p) => (
          <div
            key={p.id}
            className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow ${
              p.activo ? "" : "opacity-50"
            }`}
          >
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-slate-800 dark:text-white">
                📌 {p.titulo}
              </h3>
              <div className="flex gap-3 text-sm">
                <button
                  onClick={() => editar(p)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
                {p.activo && (
                  <button
                    onClick={() => desactivar(p.id)}
                    className="text-red-600 hover:underline"
                  >
                    Desactivar
                  </button>
                )}
              </div>
            </div>
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
