import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";

export const Perfil = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    nombres: user?.nombres || "",
    correo: user?.correo || "",
    telefono: "",
    passwordNueva: "",
  });
  const [msg, setMsg] = useState("");

  const guardar = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("Perfil actualizado (demo). En producción se conecta al backend.");
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        👤 Mi perfil
      </h1>

      {msg && (
        <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4">
          {msg}
        </div>
      )}

      <form
        onSubmit={guardar}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow space-y-4"
      >
        <label className="block">
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Nombres
          </span>
          <input
            value={form.nombres}
            onChange={(e) => setForm({ ...form, nombres: e.target.value })}
            className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Correo
          </span>
          <input
            type="email"
            value={form.correo}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
            className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Teléfono
          </span>
          <input
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Nueva contraseña (opcional)
          </span>
          <input
            type="password"
            value={form.passwordNueva}
            onChange={(e) =>
              setForm({ ...form, passwordNueva: e.target.value })
            }
            className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </label>
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-semibold">
          Guardar cambios
        </button>
      </form>
    </div>
  );
};
