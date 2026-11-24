import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { preguntarAsistente } from '../api/asistente';
import { responderPregunta, SUGERENCIAS_FAQ } from '../faq';

interface Mensaje {
  autor: 'bot' | 'usuario';
  texto: string;
}

const MENSAJE_INICIAL: Mensaje = {
  autor: 'bot',
  texto:
    '¡Hola! Soy el asistente virtual de Aura-Dent. Puedo resolver tus dudas sobre servicios, precios, horarios, reservas y cualquier otra consulta sobre la clínica.'
};

export function ChatIaWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([MENSAJE_INICIAL]);
  const [texto, setTexto] = useState('');
  const [sugerenciasVisibles, setSugerenciasVisibles] = useState(true);
  const [esperando, setEsperando] = useState(false);
  const finMensajes = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abierto) {
      finMensajes.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [abierto, mensajes, esperando]);

  async function enviar(consulta: string): Promise<void> {
    const limpio = consulta.trim();
    if (!limpio || esperando) {
      return;
    }

    const historial = mensajes;
    setMensajes((anteriores) => [...anteriores, { autor: 'usuario', texto: limpio }]);
    setTexto('');
    setSugerenciasVisibles(false);
    setEsperando(true);

    try {
      const { respuesta } = await preguntarAsistente(limpio, historial);
      setMensajes((anteriores) => [...anteriores, { autor: 'bot', texto: respuesta }]);
    } catch {
      setMensajes((anteriores) => [
        ...anteriores,
        { autor: 'bot', texto: responderPregunta(limpio) }
      ]);
    } finally {
      setEsperando(false);
    }
  }

  function manejarEnvio(evento: FormEvent): void {
    evento.preventDefault();
    void enviar(texto);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {abierto && (
        <div className="w-[340px] sm:w-[390px] max-h-[520px] bg-canvas rounded-card border border-deep-ink/15 shadow-widget flex flex-col overflow-hidden animate-aparecer-arriba">
          <header className="bg-deep-ink text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-hi-yellow text-deep-ink">
                <Sparkles size={16} />
              </span>
              <div>
                <h3 className="font-hedvig text-body font-bold text-white leading-tight">
                  Asistente Aura-Dent
                </h3>
                <p className="font-inter text-caption text-white/70">En línea · IA Clínica</p>
              </div>
            </div>
            <button
              type="button"
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white transition-colors"
              onClick={() => setAbierto(false)}
              aria-label="Cerrar asistente"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-[220px] max-h-[300px]">
            {mensajes.map((mensaje, indice) => (
              <div
                key={indice}
                className={`flex ${mensaje.autor === 'usuario' ? 'justify-end' : 'justify-start'}`}
              >
                <p
                  className={`max-w-[85%] px-4 py-2.5 font-inter text-body-sm leading-relaxed ${
                    mensaje.autor === 'usuario'
                      ? 'bg-hi-yellow text-deep-ink rounded-[18px] rounded-br-[4px]'
                      : 'bg-soft-meadow text-deep-ink rounded-[18px] rounded-bl-[4px]'
                  }`}
                >
                  {mensaje.texto}
                </p>
              </div>
            ))}
            {esperando && (
              <div className="flex justify-start">
                <p className="bg-soft-meadow text-slate-text px-4 py-2.5 rounded-[18px] rounded-bl-[4px] font-inter text-body-sm animate-pulse">
                  Escribiendo…
                </p>
              </div>
            )}
            <div ref={finMensajes} />
          </div>

          {sugerenciasVisibles && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {SUGERENCIAS_FAQ.map((sugerencia) => (
                <button
                  key={sugerencia}
                  type="button"
                  onClick={() => void enviar(sugerencia)}
                  disabled={esperando}
                  className="text-left font-inter text-caption font-medium text-deep-ink border border-deep-ink/25 bg-white hover:bg-hi-yellow hover:border-hi-yellow rounded-pill px-3 py-1.5 transition-colors"
                >
                  {sugerencia}
                </button>
              ))}
            </div>
          )}

          <form
            className="p-3 bg-soft-meadow border-t border-deep-ink/10 flex items-center gap-2"
            onSubmit={manejarEnvio}
          >
            <input
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
              placeholder={esperando ? 'El asistente está respondiendo…' : 'Escribe tu pregunta...'}
              disabled={esperando}
              className="flex-1 bg-white border border-black rounded-pill px-4 py-2.5 font-inter text-body-sm text-deep-ink placeholder:text-slate-text focus:outline-none"
            />
            <button
              type="submit"
              disabled={esperando}
              aria-label="Enviar mensaje"
              className="w-10 h-10 shrink-0 rounded-full bg-hi-yellow text-deep-ink flex items-center justify-center hover:brightness-95 transition-all disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        className="btn-primary shadow-widget"
      >
        {abierto ? <X size={18} /> : <MessageCircle size={18} />}
        <span>{abierto ? 'Cerrar asistente' : 'Asistente IA'}</span>
      </button>
    </div>
  );
}
