import { useState, FormEvent } from "react";
import { api } from "../../api/axiosClient";

export const RegistrarPaciente = () => {
  const [form, setForm] = useState({
    nombres: "",
    apellidos: "",
    documento: "",
    telefono: "",
    correo: "",
    fechaNacimiento: "",
    direccion: "",
  });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const onChange = (k: string, v: string) => setForm({ ...form, [k]: v });

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      await api.post("/pacientes", form);
      setMsg("✅ Paciente registrado correctamente");
      setForm({
        nombres: "",
        apellidos: "",
        documento: "",
        telefono: "",
        correo: "",
        fechaNacimiento: "",
        direccion: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al registrar");
    }
  };

  const campo = (label: string, key: string, type = "text") => (
    <label className="block mb-3">
      <span className="text-sm text-slate-700 dark:text-slate-300">
        {label}
      </span>
      <input
        type={type}
        value={(form as any)[key]}
        onChange={(e) => onChange(key, e.target.value)}
        className="w-full mt-1 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
      />
    </label>
  );

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        ➕ Registrar paciente
      </h1>

      {msg && (
        <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4">
          {msg}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={guardar}
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow"
      >
        {campo("Nombres", "nombres")}
        {campo("Apellidos", "apellidos")}
        {campo("Documento", "documento")}
        {campo("Teléfono", "telefono")}
        {campo("Correo", "correo", "email")}
        {campo("Fecha de nacimiento", "fechaNacimiento", "date")}
        {campo("Dirección", "direccion")}

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg font-semibold">
          Registrar paciente
        </button>
      </form>
    </div>
  );
};
