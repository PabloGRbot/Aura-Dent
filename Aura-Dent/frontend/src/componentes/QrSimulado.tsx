interface Props {
  contenido: string;
  tamano?: number;
}

function semillaInicial(texto: string): number {
  let hash = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function QrSimulado({ contenido, tamano = 21 }: Props) {
  const celdas = new Array<boolean>(tamano * tamano).fill(false);
  let estado = semillaInicial(contenido);
  const aleatorio = (): number => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0;
    return estado / 4294967296;
  };

  for (let i = 0; i < celdas.length; i++) {
    celdas[i] = aleatorio() > 0.5;
  }

  const pintarMarcador = (fila: number, columna: number): void => {
    for (let f = -1; f <= 7; f++) {
      for (let c = -1; c <= 7; c++) {
        const filaActual = fila + f;
        const columnaActual = columna + c;
        if (filaActual < 0 || columnaActual < 0 || filaActual >= tamano || columnaActual >= tamano) {
          continue;
        }
        const dentro = f >= 0 && f <= 6 && c >= 0 && c <= 6;
        const borde = f === 0 || f === 6 || c === 0 || c === 6;
        const centro = f >= 2 && f <= 4 && c >= 2 && c <= 4;
        celdas[filaActual * tamano + columnaActual] = dentro && (borde || centro);
      }
    }
  };

  pintarMarcador(0, 0);
  pintarMarcador(0, tamano - 7);
  pintarMarcador(tamano - 7, 0);

  return (
    <div
      className="qr-simulado"
      style={{ gridTemplateColumns: `repeat(${tamano}, 1fr)` }}
      role="img"
      aria-label="Código QR de pago simulado"
    >
      {celdas.map((activa, indice) => (
        <span key={indice} className={activa ? 'qr-celda on' : 'qr-celda'} />
      ))}
    </div>
  );
}
