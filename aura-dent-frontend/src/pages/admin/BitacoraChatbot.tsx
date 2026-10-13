import { useEffect, useState } from "react";
import { chatbotApi } from "../../api/chatbotApi";

export const BitacoraChatbot = () => {
  const [bitacora, setBitacora] = useState<any[]>([]);

  useEffect(() => {
    chatbotApi
      .bitacora()
      .then(setBitacora)
      .catch(() => setBitacora([]));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">
        📝 Bitácora del chatbot IA
      </h1>

      <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-700">
            <tr>
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Mensaje</th>
              <th className="p-3 text-left">Intención</th>
            </tr>
          </thead>
          <tbody>
            {bitacora.map((b) => (
              <tr key={b.id} className="border-t dark:border-slate-700">
                <td className="p-3 text-xs">
                  {new Date(b.fechaHora).toLocaleString()}
                </td>
                <td className="p-3">{b.mensajeUsuario}</td>
                <td className="p-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {b.intencion || "general"}
                  </span>
                </td>
              </tr>
            ))}
            {bitacora.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-slate-500">
                  Sin registros de conversaciones
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
