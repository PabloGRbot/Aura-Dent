# Aura-Dent

Monorepo del sistema de reserva de citas odontológicas **Aura-Dent**, con asistente de IA y pagos por código QR.

Se divide en dos aplicaciones independientes gestionadas con **npm workspaces**:

| Workspace | Descripción | Stack |
| --- | --- | --- |
| [`backend/`](./backend) | API y lógica de negocio bajo arquitectura hexagonal (puertos y adaptadores) | Node.js, TypeScript, Express, PostgreSQL |
| [`frontend/`](./frontend) | Interfaz de usuario (login por rol, dashboard y widget de chat IA) | React, Vite, TypeScript |

```
.
├── backend/
│   ├── src/
│   │   ├── dominio/          # Núcleo del negocio
│   │   ├── aplicacion/       # Casos de uso
│   │   ├── infraestructura/  # Adaptadores, configuración y servidor
│   │   └── compartido/
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              # Cliente HTTP hacia el backend
│   │   ├── componentes/      # UI y widget de chat
│   │   ├── paginas/
│   │   └── tipos/
│   └── package.json
└── package.json              # Workspaces y scripts raíz
```

## Requisitos

- Node.js 18 o superior
- PostgreSQL 16 instalado y en ejecución local (puerto 5432)

## Puesta en marcha

```bash
npm install

copy backend\.env.ejemplo backend\.env       
copy frontend\.env.ejemplo frontend\.env     

npm run db:setup --workspace backend     
npm run dev
```

`npm run dev` levanta a la vez el backend (puerto 3000) y el frontend (puerto 5173). El servidor de Vite redirige `/api` al backend, por lo que no necesitas configurar CORS.

Usuarios demo (contraseña `demo1234`): `admin@auradent.com`, `odontologo@auradent.com`, `recepcion@auradent.com` y `paciente@auradent.com`.

## Scripts raíz

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta backend y frontend en paralelo |
| `npm run dev:backend` | Solo el backend |
| `npm run dev:frontend` | Solo el frontend |
| `npm run build` | Compila backend y frontend |
| `npm test` | Ejecuta las pruebas del backend |
| `npm start` | Ejecuta el backend compilado |

Cada  workspace conserva además sus propios scripts (`npm run <script> --workspace backend|frontend`)  .
