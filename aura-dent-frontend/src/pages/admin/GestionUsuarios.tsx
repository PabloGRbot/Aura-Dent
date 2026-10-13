import { useEffect, useState } from "react";
import { api } from "../../api/axiosClient";
import type { Usuario } from "../../types";

const ROLES = ["Paciente", "Recepción", "Odontólogo", "Administrador"];

export const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const cargar = async () => {
    try {
      setUsuarios((await api.get("/usuarios")).data);
    } catch {
      setUsuarios([]);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const cambiarRol = async (id: string, rolId: number) => {
    try {
      await api.patch(`/usuarios/${id}/rol`, { rolId });
      cargar();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        👥 Gestión de usuarios
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-700">
            <tr>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Correo</th>
              <th className="p-3 text-left">Documento</th>
              <th className="p-3 text-left">Rol</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t dark:border-slate-700">
                <td className="p-3">
                  {u.nombres} {u.apellidos}
                </td>
                <td className="p-3">{u.correo}</td>
                <td className="p-3">{u.documentoIdentidad}</td>
                <td className="p-3">
                  <select
                    value={u.rolId}
                    onChange={(e) => cambiarRol(u.id, Number(e.target.value))}
                    className="p-1 border rounded dark:bg-slate-700 dark:border-slate-600"
                  >
                    {ROLES.map((r, i) => (
                      <option key={i + 1} value={i + 1}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
