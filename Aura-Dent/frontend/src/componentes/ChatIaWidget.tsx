import { FormEvent, useEffect, useRef, useState } from 'react';
import { responderPregunta, SUGERENCIAS_FAQ } from '../faq';

interface Mensaje {
  autor: 'bot' | 'usuario';
  texto: string;
}

const MENSAJE_INICIAL: Mensaje = {
  autor: 'bot',
  texto:
    '¡Hola! Soy el asistente virtual de Aura-Dent. Puedo darte información sobre horarios, ubicación, servicios, precios, medios de pago y cómo reservar tu cita.'
};

export function ChatIaWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([MENSAJE_INICIAL]);
  const [texto, setTexto] = useState('');
  const finMensajes = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (abierto) {
      finMensajes.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [abierto, mensajes]);

  function enviar(consulta: string): void {
    const limpio = consulta.trim();
    if (!limpio) {
      return;
    }
    setMensajes((anteriores) => [
      ...anteriores,
      { autor: 'usuario', texto: limpio },
      { autor: 'bot', texto: responderPregunta(limpio) }
    ]);
    setTexto('');
  }

  function manejarEnvio(evento: FormEvent): void {
    evento.preventDefault();
    enviar(texto);
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
            <div ref={finMensajes} />
          </div>

          <div className="chat-sugerencias">
            {SUGERENCIAS_FAQ.map((sugerencia) => (
              <button key={sugerencia} type="button" onClick={() => enviar(sugerencia)}>
                {sugerencia}
              </button>
            ))}
          </div>

          <form className="chat-entrada" onSubmit={manejarEnvio}>
            <input
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
              placeholder="Escribe tu pregunta..."
            />
            <button type="submit">Enviar</button>
          </form>
        </div>
      )}

      <button type="button" className="widget-boton" onClick={() => setAbierto((valor) => !valor)}>
        {abierto ? 'Cerrar asistente' : 'Asistente IA'}
      </button>
    </div>
  );
}
