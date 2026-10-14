import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usuarioApi } from "../../api/usuarioApi";
import { api } from "../../api/axiosClient";

export const Perfil = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    nombres: user?.nombres || "",
    correo: user?.correo || "",
    telefono: "",
    passwordNueva: "",
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Cargar datos actuales del usuario (incluye teléfono)
  useEffect(() => {
    if (!user?.id) {
      setCargando(false);
      return;
    }
    api
      .get(`/usuarios/${user.id}`)
      .then((r) => {
        setForm((f) => ({
          ...f,
          nombres: r.data.nombres ?? f.nombres,
          correo: r.data.correo ?? f.correo,
          telefono: r.data.telefono ?? "",
        }));
      })
      .catch(() => {
        /* si falla, usamos los datos del token */
      })
      .finally(() => setCargando(false));
  }, [user?.id]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    setGuardando(true);
    try {
      const actualizado = await usuarioApi.actualizarPerfil({
        nombres: form.nombres,
        correo: form.correo,
        telefono: form.telefono || undefined,
        passwordNueva: form.passwordNueva || undefined,
      });
      updateUser({
        nombres: actualizado.nombres,
        correo: actualizado.correo,
      });
      setForm((f) => ({ ...f, passwordNueva: "" }));
      setMsg("Perfil actualizado correctamente.");
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          "No se pudo actualizar el perfil. Intenta nuevamente.",
      );
    } finally {
      setGuardando(false);
    }
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
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4">
          {error}
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
        <button
          disabled={guardando || cargando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {guardando ? "Guardando..." : cargando ? "Cargando..." : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
};
