import { Link } from "react-router-dom";

export const SinAcceso = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
    <div className="text-center">
      <h1 className="text-6xl mb-4">🚫</h1>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
        Acceso denegado
      </h2>
      <p className="text-slate-500 mb-6">
        No tienes permisos para ver esta sección.
      </p>
      <Link to="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg">
        Volver al login
      </Link>
    </div>
  </div>
);
