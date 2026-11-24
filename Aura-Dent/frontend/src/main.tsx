import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { LimiteError } from './componentes/LimiteError';
import { ProveedorAutenticacion } from './contexto/ContextoAutenticacion';
import './index.css';
import { ProveedorConfirmacion } from './componentes/Confirmacion';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LimiteError>
      <BrowserRouter>
        <ProveedorAutenticacion>
          <ProveedorConfirmacion><App /></ProveedorConfirmacion>
        </ProveedorAutenticacion>
      </BrowserRouter>
    </LimiteError>
  </React.StrictMode>
);
