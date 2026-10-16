import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { LimiteError } from './componentes/LimiteError';
import { ProveedorAutenticacion } from './contexto/ContextoAutenticacion';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LimiteError>
      <BrowserRouter>
        <ProveedorAutenticacion>
          <App />
        </ProveedorAutenticacion>
      </BrowserRouter>
    </LimiteError>
  </React.StrictMode>
);
