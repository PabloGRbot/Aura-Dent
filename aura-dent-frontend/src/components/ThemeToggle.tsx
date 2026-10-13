import { useEffect, useState } from "react";

export const ThemeToggle = () => {
  const [oscuro, setOscuro] = useState(
    () => localStorage.getItem("tema") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", oscuro);
    localStorage.setItem("tema", oscuro ? "dark" : "light");
  }, [oscuro]);

  return (
    <button
      onClick={() => setOscuro(!oscuro)}
      className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
      title={oscuro ? "Modo claro" : "Modo oscuro"}
    >
      {oscuro ? "☀️" : "🌙"}
    </button>
  );
};
