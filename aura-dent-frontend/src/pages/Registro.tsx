import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";

export const Registro = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    documento: "",
    telefono: "",
    correo: "",
    password: "",
    confirmar: "",
  });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const onChange = (k: string, v: string) => setForm({ ...form, [k]: v });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmar) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setCargando(true);
    try {
      await authApi.registro({
        nombres: form.nombres,
        apellidos: form.apellidos,
        documento: form.documento,
        telefono: form.telefono,
        correo: form.correo,
        password: form.password,
      });
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al registrar");
    } finally {
      setCargando(false);
    }
  };

  const input = (label: string, key: string, type = "text") => (
    <label className="block mb-3">
      <span className="text-sm text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <input
        type={type}
        required
        value={(form as any)[key]}
        onChange={(e) => onChange(key, e.target.value)}
        className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
      />
    </label>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-center text-blue-700 dark:text-cyan-400 mb-6">
          Crear cuenta
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {input("Nombres", "nombres")}
        {input("Apellidos", "apellidos")}
        {input("Documento de identidad", "documento")}
        {input("Teléfono", "telefono")}
        {input("Correo", "correo", "email")}
        {input("Contraseña", "password", "password")}
        {input("Confirmar contraseña", "confirmar", "password")}

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-semibold mt-4 disabled:opacity-50"
        >
          {cargando ? "Creando..." : "Registrarme"}
        </button>

        <p className="text-center text-sm mt-4 text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
};
