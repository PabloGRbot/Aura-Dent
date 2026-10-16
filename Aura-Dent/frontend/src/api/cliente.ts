const baseUrl = import.meta.env.VITE_API_URL ?? '';

export const CLAVE_TOKEN = 'auradent_token';

export async function peticion<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(CLAVE_TOKEN);

  let respuesta: Response;
  try {
    respuesta = await fetch(`${baseUrl}${ruta}`, {
      ...opciones,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opciones.headers
      }
    });
  } catch {
    throw new Error(
      'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución (npm run dev).'
    );
  }

  if (respuesta.status === 204) {
    return null as T;
  }

  const texto = await respuesta.text();
  let datos: unknown = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    const mensaje =
      (datos as { mensaje?: string } | null)?.mensaje ??
      `Error del servidor (${respuesta.status}). Intenta nuevamente.`;
    throw new Error(mensaje);
  }

  return datos as T;
}
