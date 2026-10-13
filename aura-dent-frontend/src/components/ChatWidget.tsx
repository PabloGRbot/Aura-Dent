import { useState, useRef, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { chatbotApi } from "../api/chatbotApi";
import type { MensajeChat } from "../types";

export const ChatWidget = () => {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([
    {
      rol: "ia",
      texto:
        "¡Hola! Soy Aura, tu asistente. Puedo informarte sobre horarios, ubicación, servicios y políticas. ¿En qué te ayudo?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sesionId] = useState(() => uuid());
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, cargando]);

  const enviar = async () => {
    if (!input.trim() || cargando) return;
    const texto = input.trim();
    setInput("");
    setMensajes((m) => [...m, { rol: "user", texto }]);
    setCargando(true);
    try {
      const r = await chatbotApi.enviar(sesionId, texto);
      setMensajes((m) => [...m, { rol: "ia", texto: r.respuesta }]);
    } catch {
      setMensajes((m) => [
        ...m,
        { rol: "ia", texto: "Lo siento, hubo un error. Intenta más tarde." },
      ]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-2xl z-40 text-2xl flex items-center justify-center"
        >
          💬
        </button>
      )}

      {abierto && (
        <div className="fixed bottom-6 right-6 w-96 h-[540px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200 dark:border-slate-700">
          <header className="p-3 bg-blue-600 text-white rounded-t-2xl flex justify-between items-center">
            <div>
              <p className="font-semibold">Asistente Aura</p>
              <p className="text-xs opacity-80">En línea</p>
            </div>
            <button
              onClick={() => setAbierto(false)}
              className="text-white hover:bg-blue-700 rounded w-8 h-8"
            >
              ✕
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-900">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg max-w-[85%] text-sm ${
                  m.rol === "user"
                    ? "bg-blue-100 dark:bg-blue-900 ml-auto text-right text-slate-800 dark:text-white"
                    : "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm"
                }`}
              >
                {m.texto}
              </div>
            ))}
            {cargando && (
              <div className="text-slate-400 text-xs italic">
                Aura está escribiendo...
              </div>
            )}
            <div ref={finRef} />
          </div>

          <div className="text-xs text-center text-slate-400 p-2 border-t dark:border-slate-700">
            Para agendar cita, usa el módulo correspondiente del menú.
          </div>

          <div className="p-3 border-t dark:border-slate-700 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              placeholder="Escribe tu consulta..."
              className="flex-1 p-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
            <button
              onClick={enviar}
              disabled={cargando}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};
