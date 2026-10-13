const FILAS = [
  { e: "Usuarios", p: "R (propio)", r: "R", o: "R (propio)", a: "C R U D" },
  { e: "Pacientes", p: "C R U (propio)", r: "C R U", o: "R", a: "C R U D" },
  { e: "Odontólogos", p: "R", r: "R", o: "R (propio)", a: "C R U D" },
  { e: "Servicios", p: "R", r: "R", o: "R", a: "C R U D" },
  { e: "Citas", p: "C R U", r: "C R U", o: "R U", a: "C R U D" },
  { e: "Pagos", p: "R (propio)", r: "R U", o: "—", a: "C R U D" },
  { e: "Disponibilidad", p: "R", r: "R", o: "R (propia)", a: "C R U D" },
  { e: "Base chatbot", p: "—", r: "—", o: "—", a: "C R U D" },
  { e: "Políticas", p: "R", r: "R", o: "R", a: "C R U D" },
];

export const MatrizCRUD = () => (
  <div>
    <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
      📊 Matriz CRUD por rol
    </h1>
    <p className="text-slate-500 mb-6 text-sm">
      C = Crear · R = Leer · U = Actualizar · D = Desactivar (borrado lógico)
    </p>

    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 dark:bg-slate-700">
          <tr>
            <th className="p-3 text-left text-slate-700 dark:text-slate-200">
              Entidad
            </th>
            <th className="p-3 text-center text-slate-700 dark:text-slate-200">
              Paciente
            </th>
            <th className="p-3 text-center text-slate-700 dark:text-slate-200">
              Recepción
            </th>
            <th className="p-3 text-center text-slate-700 dark:text-slate-200">
              Odontólogo
            </th>
            <th className="p-3 text-center text-slate-700 dark:text-slate-200">
              Admin
            </th>
          </tr>
        </thead>
        <tbody>
          {FILAS.map((f) => (
            <tr key={f.e} className="border-t dark:border-slate-700">
              <td className="p-3 font-semibold text-slate-800 dark:text-white">
                {f.e}
              </td>
              <td className="p-3 text-center text-slate-600 dark:text-slate-300">
                {f.p}
              </td>
              <td className="p-3 text-center text-slate-600 dark:text-slate-300">
                {f.r}
              </td>
              <td className="p-3 text-center text-slate-600 dark:text-slate-300">
                {f.o}
              </td>
              <td className="p-3 text-center font-medium text-blue-600">
                {f.a}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
