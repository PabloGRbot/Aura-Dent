import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { Layout } from "./components/Layout";

import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { SinAcceso } from "./pages/SinAcceso";

import { Dashboard as PacienteDashboard } from "./pages/paciente/Dashboard";
import { Agendar } from "./pages/paciente/Agendar";
import { MisCitas } from "./pages/paciente/MisCitas";
import { Perfil } from "./pages/paciente/Perfil";

import { PanelCitas } from "./pages/recepcion/PanelCitas";
import { ControlPagos } from "./pages/recepcion/ControlPagos";
import { RegistrarPaciente } from "./pages/recepcion/RegistrarPaciente";

import { AgendaDiaria } from "./pages/odontologo/AgendaDiaria";

import { GestionUsuarios } from "./pages/admin/GestionUsuarios";
import { GestionServicios } from "./pages/admin/GestionServicios";
import { GestionDisponibilidad } from "./pages/admin/GestionDisponibilidad";
import { BaseConocimiento } from "./pages/admin/BaseConocimiento";
import { Politicas } from "./pages/admin/Politicas";
import { BitacoraChatbot } from "./pages/admin/BitacoraChatbot";
import { MatrizCRUD } from "./pages/admin/MatrizCRUD";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/sin-acceso" element={<SinAcceso />} />

          {/* PACIENTE */}
          <Route
            path="/paciente/*"
            element={
              <ProtectedRoute rolesPermitidos={[1]}>
                <Layout>
                  <Routes>
                    <Route path="/" element={<PacienteDashboard />} />
                    <Route path="agendar" element={<Agendar />} />
                    <Route path="citas" element={<MisCitas />} />
                    <Route path="perfil" element={<Perfil />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* RECEPCIÓN */}
          <Route
            path="/recepcion/*"
            element={
              <ProtectedRoute rolesPermitidos={[2, 4]}>
                <Layout>
                  <Routes>
                    <Route path="/" element={<PanelCitas />} />
                    <Route path="pagos" element={<ControlPagos />} />
                    <Route path="registrar" element={<RegistrarPaciente />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ODONTÓLOGO */}
          <Route
            path="/odontologo/*"
            element={
              <ProtectedRoute rolesPermitidos={[3]}>
                <Layout>
                  <Routes>
                    <Route path="/" element={<AgendaDiaria />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* ADMINISTRADOR */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute rolesPermitidos={[4]}>
                <Layout>
                  <Routes>
                    <Route path="/" element={<MatrizCRUD />} />
                    <Route path="usuarios" element={<GestionUsuarios />} />
                    <Route path="servicios" element={<GestionServicios />} />
                    <Route
                      path="disponibilidad"
                      element={<GestionDisponibilidad />}
                    />
                    <Route path="chatbot" element={<BaseConocimiento />} />
                    <Route path="politicas" element={<Politicas />} />
                    <Route path="bitacora" element={<BitacoraChatbot />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
