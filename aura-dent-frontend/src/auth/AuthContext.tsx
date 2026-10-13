import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authApi } from "../api/authApi";

interface AuthUser {
  id: string;
  rol: number;
  nombres: string;
  correo: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
  estaAutenticado: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("usuario");
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
  }, []);

  const login = async (correo: string, password: string) => {
    const data = await authApi.login(correo, password);
    const u: AuthUser = {
      id: data.usuario.id,
      rol: data.usuario.rolId,
      nombres: data.usuario.nombres,
      correo: data.usuario.correo,
    };
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(u));
    setToken(data.token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, estaAutenticado: !!token }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
