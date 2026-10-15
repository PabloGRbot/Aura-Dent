import { FormEvent, useEffect, useRef, useState } from 'react';
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
    <div className="widget">
      {abierto && (
        <div className="chat">
          <header className="chat-cabecera">
            <span>Asistente Aura-Dent</span>
            <button type="button" className="chat-cerrar" onClick={() => setAbierto(false)}>
              ×
            </button>
          </header>

          <div className="chat-mensajes">
            {mensajes.map((mensaje, indice) => (
              <p key={indice} className={`burbuja ${mensaje.autor}`}>
                {mensaje.texto}
              </p>
            ))}
            {esperando && <p className="burbuja bot esperando">Escribiendo…</p>}
            <div ref={finMensajes} />
          </div>

          {sugerenciasVisibles && (
            <div className="chat-sugerencias">
              {SUGERENCIAS_FAQ.map((sugerencia) => (
                <button
                  key={sugerencia}
                  type="button"
                  onClick={() => void enviar(sugerencia)}
                  disabled={esperando}
                >
                  {sugerencia}
                </button>
              ))}
            </div>
          )}

          <form className="chat-entrada" onSubmit={manejarEnvio}>
            <input
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
              placeholder={esperando ? 'El asistente está respondiendo…' : 'Escribe tu pregunta...'}
              disabled={esperando}
            />
            <button type="submit" disabled={esperando}>
              Enviar
            </button>
          </form>
        </div>
      )}

      <button type="button" className="widget-boton" onClick={() => setAbierto((valor) => !valor)}>
        {abierto ? 'Cerrar asistente' : 'Asistente IA'}
      </button>
    </div>
  );
}
