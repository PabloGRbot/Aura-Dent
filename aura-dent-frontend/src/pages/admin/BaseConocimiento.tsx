import { useEffect, useState, FormEvent } from "react";
import { chatbotApi } from "../../api/chatbotApi";

export const BaseConocimiento = () => {
  const [base, setBase] = useState<any[]>([]);
  const [form, setForm] = useState({
    pregunta: "",
    respuesta: "",
    categoria: "General",
  });
  const [msg, setMsg] = useState("");

  const cargar = async () => {
    try {
      setBase(await chatbotApi.listarBase());
    } catch {
      setBase([]);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await chatbotApi.crearBase(form);
      setMsg("✅ Entrada creada");
      setForm({ pregunta: "", respuesta: "", categoria: "General" });
      cargar();
    } catch (err: any) {
      setMsg("❌ " + (err.response?.data?.error || "Error"));
    }
  };

  const desactivar = async (id: number) => {
    if (!confirm("¿Desactivar esta entrada?")) return;
    await chatbotApi.desactivarBase(id);
    cargar();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        🤖 Base de conocimiento IA
      </h1>

      {msg && (
        <div className="bg-blue-100 text-blue-800 p-3 rounded-lg mb-4">
          {msg}
        </div>
      )}

      <form
        onSubmit={crear}
        className="bg-white dark:bg-slate-800 p-4 rounded-xl mb-6 space-y-3"
      >
        <input
          placeholder="Pregunta"
          required
          value={form.pregunta}
          onChange={(e) => setForm({ ...form, pregunta: e.target.value })}
          className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
        <textarea
          placeholder="Respuesta"
          required
          rows={3}
          value={form.respuesta}
          onChange={(e) => setForm({ ...form, respuesta: e.target.value })}
          className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
        <input
          placeholder="Categoría"
          value={form.categoria}
          onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        />
        <button className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-semibold w-full">
          ➕ Agregar entrada
        </button>
      </form>

      <div className="space-y-3">
        {base.map((b) => (
          <div
            key={b.id}
            className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-semibold text-slate-800 dark:text-white">
                  ❓ {b.pregunta}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  💬 {b.respuesta}
                </p>
                <span className="text-xs text-blue-600 mt-2 inline-block">
                  🏷 {b.categoria}
                </span>
              </div>
              <button
                onClick={() => desactivar(b.id)}
                className="text-red-600 text-sm hover:underline"
              >
                Desactivar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
