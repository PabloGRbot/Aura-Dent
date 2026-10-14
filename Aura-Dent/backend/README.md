# Aura-Dent · Backend

API del sistema de gestión de citas odontológicas. Construida con **TypeScript**, **Express** y **arquitectura hexagonal (puertos y adaptadores)** sobre **PostgreSQL**.

## Arquitectura

El proyecto se divide en tres capas concéntricas. El **dominio** no depende de nada; la **aplicación** depende solo del dominio; la **infraestructura** depende de ambas y es la única que conoce frameworks, base de datos y servicios externos.

```
src/
├── dominio/                         # Núcleo del negocio (sin dependencias externas)
│   ├── modelos/                     # Entidades y objetos de valor (incl. Usuario y Rol)
│   ├── excepciones/                 # Errores de negocio
│   ├── puertos/
│   │   ├── entrada/                 # Interfaces que exponen los casos de uso
│   │   └── salida/                  # Interfaces que el dominio necesita del exterior
│   └── servicios/                   # Lógica de dominio que no pertenece a una entidad
├── aplicacion/                      # Orquestación de casos de uso
│   └── casos_uso/
│       ├── asistente_ia/
│       ├── autenticacion/           # login y obtención de perfil
│       ├── pagos/
│       └── reserva_citas/
├── infraestructura/                 # Detalles: se conectan a los puertos
│   ├── adaptadores/
│   │   ├── entrada/                 # Controladores web, middlewares y widget de chat
│   │   └── salida/                  # Repositorios PostgreSQL, JWT, correo, seguridad
│   └── configuracion/               # Servidor HTTP y variables de entorno
├── compartido/                      # Utilidades transversales
└── servidor_principal.ts            # Punto de entrada
scripts/
└── preparar_bd.ts                   # Crea el esquema y siembra usuarios demo
tests/
├── dominio/
└── aplicacion/
```

## Requisitos

- Node.js 18 o superior
- PostgreSQL 16 instalado y en ejecución local (puerto 5432)

## Puesta en marcha

Desde la raíz del monorepo:

```bash
npm install
copy backend\.env.ejemplo backend\.env     # en Linux/macOS: cp backend/.env.ejemplo backend/.env
npm run db:setup --workspace backend       # crea tablas y usuarios demo
npm run dev:backend
```

Ajusta los valores `POSTGRES_*` en `backend/.env` según tu instalación local antes de ejecutar `npm run db:setup`.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor en modo desarrollo con recarga en caliente |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la versión compilada |
| `npm test` | Ejecuta las pruebas con Jest |
| `npm run db:setup` | Crea el esquema y siembra los usuarios demo |

## Usuarios demo (`npm run db:setup`)

Contraseña para todos: `demo1234`.

| Rol | Email |
| --- | --- |
| Administrador | `admin@auradent.com` |
| Odontólogo | `odontologo@auradent.com` |
| Recepción | `recepcion@auradent.com` |
| Paciente | `paciente@auradent.com` |

## Autenticación

Login por email/contraseña que devuelve un **JWT**. El token se envía en la cabecera `Authorization: Bearer <token>`. El middleware `autenticar` valida el token y `autorizar(...roles)` restringe el acceso por rol.

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| GET | `/salud` | Público | Verificación de disponibilidad del servicio |
| POST | `/api/autenticacion/login` | Público | Inicio de sesión (`email`, `password`) → `{ token, usuario }` |
| GET | `/api/usuarios/me` | Autenticado | Devuelve el perfil del usuario del token |
| POST | `/api/reservas` | Autenticado | Crea una reserva temporal (15 minutos) |
| POST | `/api/reservas/:id/confirmar` | Autenticado | Confirma la cita tras validar el pago |
| POST | `/api/pagos/qr` | Autenticado | Valida un pago realizado por QR |
| POST | `/api/asistente/disponibilidad` | Autenticado | Consulta disponibilidad del asistente IA |

## Modelo de datos

El esquema lo crea `scripts/preparar_bd.ts`. Tablas: `usuarios`, `citas` y `pagos`.

```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  dni_ce VARCHAR(20) NOT NULL UNIQUE,
  fecha_nacimiento DATE,
  alergias TEXT,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('Paciente','Recepcion','Odontologo','Administrador')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
