/**
 * Fecha local en formato 'YYYY-MM-DD' sin desfase de zona horaria.
 * (toISOString() usa la fecha UTC, que puede ser otro día para zonas
 * con desplazamiento negativo como Perú UTC-5.)
 */
export const hoyLocalISO = (d: Date = new Date()): string => {
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};
