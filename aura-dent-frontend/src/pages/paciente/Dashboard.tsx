import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export const Dashboard = () => {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
        ¡Hola, {user?.nombres}! 👋
      </h1>
      <p className="text-slate-500 mb-8">Bienvenido a tu portal de Aura Dent</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/paciente/agendar"
          className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-2xl shadow-lg hover:scale-105 transition"
        >
          <div className="text-4xl mb-2">📅</div>
          <h3 className="font-bold text-lg">Agendar cita</h3>
          <p className="text-sm opacity-90 mt-1">Reserva tu próxima consulta</p>
        </Link>

        <Link
          to="/paciente/citas"
          className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-lg hover:scale-105 transition"
        >
          <div className="text-4xl mb-2">📋</div>
          <h3 className="font-bold text-lg">Mis citas</h3>
          <p className="text-sm opacity-90 mt-1">Consulta tu historial</p>
        </Link>

        <Link
          to="/paciente/perfil"
          className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-lg hover:scale-105 transition"
        >
          <div className="text-4xl mb-2">👤</div>
          <h3 className="font-bold text-lg">Mi perfil</h3>
          <p className="text-sm opacity-90 mt-1">Actualiza tus datos</p>
        </Link>
      </div>
    </div>
  );
};
