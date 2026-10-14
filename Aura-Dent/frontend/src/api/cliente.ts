const baseUrl = import.meta.env.VITE_API_URL ?? '';

export const CLAVE_TOKEN = 'auradent_token';

export async function peticion<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(CLAVE_TOKEN);
  const respuesta = await fetch(`${baseUrl}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers
    }
  });

  const datos = respuesta.status === 204 ? null : await respuesta.json();

  if (!respuesta.ok) {
    throw new Error((datos as { mensaje?: string } | null)?.mensaje ?? 'Error inesperado');
  }

  return datos as T;
}
