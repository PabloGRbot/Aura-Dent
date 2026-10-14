import { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './componentes/Layout';
import { RutaProtegida } from './componentes/RutaProtegida';
import { ConfiguracionAdmin } from './paginas/admin/Configuracion';
import { PagosAdmin } from './paginas/admin/Pagos';
import { UsuariosAdmin } from './paginas/admin/Usuarios';
import { HistorialPaciente } from './paginas/HistorialPaciente';
import { InicioPublico } from './paginas/InicioPublico';
import { Login } from './paginas/Login';
import { MiAgenda } from './paginas/odontologo/MiAgenda';
import { NotasClinicas } from './paginas/odontologo/NotasClinicas';
import { PacientesOdontologo } from './paginas/odontologo/Pacientes';
import { MisCitas } from './paginas/MisCitas';
import { PaginaPlaceholder } from './paginas/PaginaPlaceholder';
import { Panel } from './paginas/Panel';
import { Registro } from './paginas/Registro';
import { AgendaRecepcion } from './paginas/recepcion/Agenda';
import { PagosRecepcion } from './paginas/recepcion/Pagos';
import { Rol } from './tipos';

function areaPrivada(rol: Rol, contenido: ReactNode) {
  return (
    <RutaProtegida roles={[rol]}>
      <Layout>{contenido}</Layout>
    </RutaProtegida>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<InicioPublico />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route path="/paciente" element={areaPrivada('Paciente', <Panel />)} />
      <Route path="/paciente/mis-citas" element={areaPrivada('Paciente', <MisCitas />)} />
      <Route
        path="/paciente/historial"
        element={areaPrivada('Paciente', <HistorialPaciente />)}
      />
      <Route path="/paciente/:seccion" element={areaPrivada('Paciente', <PaginaPlaceholder />)} />

      <Route path="/odontologo" element={areaPrivada('Odontologo', <Panel />)} />
      <Route
        path="/odontologo/mi-agenda"
        element={areaPrivada('Odontologo', <MiAgenda />)}
      />
      <Route
        path="/odontologo/notas"
        element={areaPrivada('Odontologo', <NotasClinicas />)}
      />
      <Route
        path="/odontologo/pacientes"
        element={areaPrivada('Odontologo', <PacientesOdontologo />)}
      />
      <Route
        path="/odontologo/:seccion"
        element={areaPrivada('Odontologo', <PaginaPlaceholder />)}
      />

      <Route path="/recepcion" element={areaPrivada('Recepcion', <Panel />)} />
      <Route
        path="/recepcion/agenda"
        element={areaPrivada('Recepcion', <AgendaRecepcion />)}
      />
      <Route path="/recepcion/pagos" element={areaPrivada('Recepcion', <PagosRecepcion />)} />
      <Route path="/recepcion/:seccion" element={areaPrivada('Recepcion', <PaginaPlaceholder />)} />

      <Route path="/administrador" element={areaPrivada('Administrador', <Panel />)} />
      <Route
        path="/administrador/usuarios"
        element={areaPrivada('Administrador', <UsuariosAdmin />)}
      />
      <Route
        path="/administrador/pagos"
        element={areaPrivada('Administrador', <PagosAdmin />)}
      />
      <Route
        path="/administrador/configuracion"
        element={areaPrivada('Administrador', <ConfiguracionAdmin />)}
      />
      <Route
        path="/administrador/:seccion"
        element={areaPrivada('Administrador', <PaginaPlaceholder />)}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
